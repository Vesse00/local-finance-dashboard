import { Controller, Get, UseGuards } from '@nestjs/common';
import { BriefingService } from './briefing.service';
import { InternalAuthGuard } from '../auth/internal-auth.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';

@Controller('briefing')
@UseGuards(InternalAuthGuard)
export class BriefingController {
  constructor(private readonly briefingService: BriefingService) {}

  @Get()
  async getBriefing(@CurrentUserId() userId: string) {
    return this.briefingService.getBriefing(userId);
  }
}
