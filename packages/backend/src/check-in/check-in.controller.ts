import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CheckInService } from './check-in.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/check-in')
export class CheckInController {
  constructor(private checkInService: CheckInService) {}

  @Post(':guestId')
  async checkIn(
    @Param('eventId') eventId: string,
    @Param('guestId') guestId: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    const guest = await this.checkInService.checkIn(eventId, guestId, req.user.id, body.notes);
    return { data: guest };
  }

  @Post(':guestId/undo')
  async undoCheckIn(
    @Param('eventId') eventId: string,
    @Param('guestId') guestId: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    const guest = await this.checkInService.undoCheckIn(eventId, guestId, req.user.id, body.notes);
    return { data: guest };
  }

  @Get('stats')
  async getStats(@Param('eventId') eventId: string) {
    const stats = await this.checkInService.getCheckInStats(eventId);
    return { data: stats };
  }

  @Get('search')
  async search(@Param('eventId') eventId: string, @Query('q') search: string) {
    const guests = await this.checkInService.searchForCheckIn(eventId, search || '');
    return { data: guests };
  }

  @Get('logs')
  async getLogs(@Param('eventId') eventId: string) {
    const logs = await this.checkInService.getCheckInLogs(eventId);
    return { data: logs };
  }

  @Post('walk-in')
  async walkIn(
    @Param('eventId') eventId: string,
    @Body() body: { convidado: string; empresa?: string; notes?: string },
    @Request() req: any,
  ) {
    const guest = await this.checkInService.walkIn(eventId, body, req.user.id);
    return { data: guest };
  }

  @Post('bulk')
  async bulkCheckIn(
    @Param('eventId') eventId: string,
    @Body() body: { guestIds: string[] },
    @Request() req: any,
  ) {
    const results = await this.checkInService.bulkCheckIn(eventId, body.guestIds, req.user.id);
    return { data: results };
  }
}
