import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma/prisma.service';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const GITHUB_REPO = 'Vesse00/local-finance-dashboard';

function getCurrentVersion(): string {
  try {
    const pkgPath = join(process.cwd(), '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

@Injectable()
export class UpdateCheckService implements OnModuleInit {
  private readonly logger = new Logger(UpdateCheckService.name);
  private readonly jobName = 'update-check';

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    // Upewniamy się, że singleton ustawień istnieje
    await this.prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });

    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'singleton' },
    });
    const hour = settings?.updateCheckHour ?? 3;

    this.scheduleCronJob(hour);
  }

  scheduleCronJob(hour: number) {
    // Usuń stare zadanie jeśli istnieje
    if (this.schedulerRegistry.doesExist('cron', this.jobName)) {
      this.schedulerRegistry.deleteCronJob(this.jobName);
    }

    const cronExpression = `0 ${hour} * * *`; // Co dzień o danej godzinie
    const job = new CronJob(cronExpression, () => {
      this.performUpdateCheck();
    });

    this.schedulerRegistry.addCronJob(this.jobName, job);
    job.start();
    this.logger.log(`Zaplanowano sprawdzanie aktualizacji codziennie o godzinie ${hour}:00`);
  }

  async performUpdateCheck(): Promise<void> {
    this.logger.log('Sprawdzam dostępność nowych wersji na GitHub...');

    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'local-finance-dashboard-updater',
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(`GitHub API odpowiedział: ${response.status}`);
        return;
      }

      const data = (await response.json()) as { tag_name?: string };
      const latestVersion = data.tag_name?.replace('v', '') ?? null;

      const currentVersion = getCurrentVersion();

      const updateAvailable = !!latestVersion && latestVersion !== currentVersion;

      await this.prisma.systemSettings.update({
        where: { id: 'singleton' },
        data: {
          updateAvailable,
          latestVersion: latestVersion ?? undefined,
          lastChecked: new Date(),
        },
      });

      this.logger.log(
        `Sprawdzono aktualizacje. Obecna: ${currentVersion}, Najnowsza: ${latestVersion ?? 'brak'}, Aktualizacja: ${updateAvailable}`,
      );
    } catch (err) {
      this.logger.error('Błąd sprawdzania aktualizacji:', err);
    }
  }

  async getSettings() {
    return this.prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
  }

  async setUpdateCheckHour(hour: number) {
    const settings = await this.prisma.systemSettings.update({
      where: { id: 'singleton' },
      data: { updateCheckHour: hour },
    });
    this.scheduleCronJob(hour);
    return settings;
  }
}
