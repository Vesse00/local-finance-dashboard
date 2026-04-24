import { Module } from '@nestjs/common';
import { WorkDaysController } from './work-days.controller';
import { WorkDaysService } from './work-days.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WorkDaysController],
  providers: [WorkDaysService, PrismaService],
})
export class WorkDaysModule {}
