import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import pkg from '../../../../../package.json';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const response = await fetch('https://api.github.com/repos/Vesse00/local-finance-dashboard/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'local-finance-dashboard-updater'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ currentVersion: pkg.version, latestVersion: pkg.version, hasUpdate: false });
      }
      return NextResponse.json({ error: 'GitHub API error' }, { status: response.status });
    }

    const data = await response.json();
    const latestVersionStr = data.tag_name;
    
    if (!latestVersionStr) {
       return NextResponse.json({ currentVersion: pkg.version, latestVersion: pkg.version, hasUpdate: false });
    }

    const latestVersion = latestVersionStr.replace('v', '');
    const currentVersion = pkg.version;
    const hasUpdate = latestVersion !== currentVersion;

    return NextResponse.json({ currentVersion, latestVersion, hasUpdate, releaseNotes: data.body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check for updates' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    // Odpalamy skrypt auto-update.js w tle, niezależnie od procesu node, by uniknąć zabicia serwera podczas next build.
    // Zwracamy od razu odpowiedź, reszta dzieje się w tle.
    exec('node auto-update.js', (err, stdout, stderr) => {
      if (err) {
        console.error('Update failed:', err);
        return;
      }
      console.log('Update script finished:', stdout);
    });
    
    return NextResponse.json({ message: 'Aktualizacja rozpoczęta. Potrwa około minuty.' });
  } catch (error) {
    return NextResponse.json({ error: 'Błąd podczas uruchamiania aktualizacji' }, { status: 500 });
  }
}
