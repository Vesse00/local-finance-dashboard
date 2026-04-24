import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkDaysService } from './work-days.service';
import { InternalAuthGuard } from '../auth/internal-auth.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';

@Controller('work-days')
@UseGuards(InternalAuthGuard)
export class WorkDaysController {
  constructor(private readonly workDaysService: WorkDaysService) {}

  @Get()
  async getWorkDays(
    @CurrentUserId() userId: string,
    @Query('month') month?: string,
  ) {
    return this.workDaysService.getWorkDays(userId, month);
  }

  @Post()
  async upsertWorkDay(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      date?: string;
      startTime?: string | null;
      endTime?: string | null;
      isOvertime?: boolean;
      overtimeHours?: number | string;
      notes?: string;
      shiftType?: string;
    },
  ) {
    return this.workDaysService.upsertWorkDay(userId, body);
  }

  @Post('bulk')
  async bulkGenerate(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      days?: Array<{
        date?: string;
        startTime?: string | null;
        endTime?: string | null;
        shiftType?: string;
      }>;
    },
  ) {
    return this.workDaysService.bulkGenerate(userId, body);
  }

  @Delete('bulk')
  async bulkDelete(
    @CurrentUserId() userId: string,
    @Body() body: { startDate?: string; endDate?: string; selectedWeekDays?: number[] },
  ) {
    return this.workDaysService.bulkDelete(userId, body);
  }
}
