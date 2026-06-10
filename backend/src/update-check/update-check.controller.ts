import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { UpdateCheckService } from './update-check.service';
import { InternalAuthGuard } from '../auth/internal-auth.guard';

@Controller('system')
@UseGuards(InternalAuthGuard)
export class UpdateCheckController {
  constructor(private readonly updateCheckService: UpdateCheckService) {}

  @Get('settings')
  async getSystemSettings() {
    return this.updateCheckService.getSettings();
  }

  @Put('settings')
  async updateSystemSettings(@Body() body: { updateCheckHour?: number }) {
    if (body.updateCheckHour !== undefined) {
      return this.updateCheckService.setUpdateCheckHour(Number(body.updateCheckHour));
    }
    return this.updateCheckService.getSettings();
  }

  @Get('update-status')
  async getUpdateStatus() {
    return this.updateCheckService.getSettings();
  }

  @Post('check-update')
  async triggerUpdateCheck() {
    await this.updateCheckService.performUpdateCheck();
    return { message: 'Sprawdzanie aktualizacji uruchomione.' };
  }
}
