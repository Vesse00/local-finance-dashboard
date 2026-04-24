import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { InternalAuthGuard } from '../auth/internal-auth.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';

@Controller('transfer')
@UseGuards(InternalAuthGuard)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  async transfer(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      amount?: string | number;
      fromAccount?: string;
      toAccount?: string;
      date?: string;
    },
  ) {
    return this.transferService.transfer(userId, body);
  }
}
