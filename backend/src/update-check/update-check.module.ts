import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UpdateCheckService } from './update-check.service';
import { UpdateCheckController } from './update-check.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [UpdateCheckController],
  providers: [UpdateCheckService, PrismaService],
  exports: [UpdateCheckService],
})
export class UpdateCheckModule {}
