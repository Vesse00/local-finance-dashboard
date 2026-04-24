import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BriefingModule } from './briefing/briefing.module';
import { CarsModule } from './cars/cars.module';
import { HealthModule } from './health/health.module';
import { SavingsModule } from './savings/savings.module';
import { SettingsModule } from './settings/settings.module';
import { TransferModule } from './transfer/transfer.module';
import { WorkDaysModule } from './work-days/work-days.module';

@Module({
  imports: [
    BriefingModule,
    CarsModule,
    HealthModule,
    SavingsModule,
    SettingsModule,
    TransferModule,
    WorkDaysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
