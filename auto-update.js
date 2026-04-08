const { execSync } = require('child_process');

async function checkAndUpdate() {
    try {
        console.log('Sprawdzanie aktualizacji...');
        const response = await fetch('https://api.github.com/repos/Vesse00/local-finance-dashboard/releases/latest');
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('Nie znaleziono jeszcze żadnych oficjalnych wydań (Releases) w tym repozytorium.');
            } else {
                console.error(`Błąd API GitHuba: ${response.status} ${response.statusText}`);
            }
            return;
        }

        const data = await response.json();
        const latestVersionStr = data.tag_name;
        
        if (!latestVersionStr) {
            console.log('Nie udało się odczytać numeru najnowszej wersji.');
            return;
        }
        
        const latestVersion = latestVersionStr.replace('v', '');
        const currentVersion = require('./package.json').version;

        console.log(`Zainstalowana wersja: ${currentVersion}`);
        console.log(`Najnowsza wersja: ${latestVersion}`);

        if (latestVersion !== currentVersion) {
            console.log('🚀 Znaleziono nową wersję! Rozpoczynam aktualizację...');
            
            // Pobieranie najnowszych zmian z repozytorium
            console.log('📥 Pobieranie zmian z GitHuba...');
            execSync('git pull origin master', { stdio: 'inherit' });
            
            // Instalacja nowych zależności (jeśli są)
            console.log('📦 Instalowanie zależności...');
            execSync('npm install', { stdio: 'inherit' });
            
            // Aktualizacja bazy danych Prisma (jeśli dotyczy)
            console.log('🗄️ Aktualizacja bazy danych...');
            execSync('npx prisma generate', { stdio: 'inherit' });
            try {
                execSync('npx prisma migrate deploy', { stdio: 'inherit' });
            } catch (e) {
                console.log('Brak nowych migracji lub błąd podczas migracji.');
            }

            // Budowanie nowej wersji
            console.log('🏗️ Budowanie aplikacji...');
            execSync('npm run build', { stdio: 'inherit' });
            
            console.log('✅ Aktualizacja zakończona pomyślnie! Zrestartuj serwer aplikacji (np. wyłącz i wpisz ponownie `npm start` lub zrestartuj PM2), aby zastosować zmiany.');
        } else {
            console.log('✨ Posiadasz najnowszą wersję aplikacji.');
        }
    } catch (error) {
        console.error('Błąd podczas próby aktualizacji:', error.message);
    }
}

checkAndUpdate();
