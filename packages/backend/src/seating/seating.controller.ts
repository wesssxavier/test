import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SeatingService, SeatingWarning } from './seating.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/seating')
export class SeatingController {
  constructor(private seatingService: SeatingService) {}

  @Get()
  async getAssignments(@Param('eventId') eventId: string) {
    const assignments = await this.seatingService.getAssignments(eventId);
    return { data: assignments };
  }

  @Post('assign')
  async assignGuest(
    @Param('eventId') eventId: string,
    @Body() body: { guestId: string; tableId: string; seatNumber?: number },
    @Request() req: any,
  ) {
    const assignment = await this.seatingService.assignGuest(eventId, body, req.user.id);
    return { data: assignment };
  }

  @Post('unassign')
  async unassignGuest(
    @Param('eventId') eventId: string,
    @Body() body: { guestId: string },
    @Request() req: any,
  ) {
    const result = await this.seatingService.unassignGuest(eventId, body.guestId, req.user.id);
    return { data: result };
  }

  @Post('move')
  async moveGuest(
    @Param('eventId') eventId: string,
    @Body() body: { guestId: string; fromTableId: string; toTableId: string; seatNumber?: number },
    @Request() req: any,
  ) {
    const assignment = await this.seatingService.moveGuest(eventId, body, req.user.id);
    return { data: assignment };
  }

  @Post('bulk-assign')
  async bulkAssign(
    @Param('eventId') eventId: string,
    @Body() body: { assignments: { guestId: string; tableId: string; seatNumber?: number }[] },
    @Request() req: any,
  ) {
    const results = await this.seatingService.bulkAssign(eventId, body.assignments, req.user.id);
    return { data: results };
  }

  @Delete('clear')
  async clearAll(@Param('eventId') eventId: string, @Request() req: any) {
    const result = await this.seatingService.clearAllAssignments(eventId, req.user.id);
    return { data: result };
  }

  @Get('warnings')
  async getWarnings(@Param('eventId') eventId: string): Promise<{ data: SeatingWarning[] }> {
    const warnings = await this.seatingService.getWarnings(eventId);
    return { data: warnings };
  }

  @Get('rules')
  async getRules(@Param('eventId') eventId: string) {
    const rules = await this.seatingService.getRules(eventId);
    return { data: rules };
  }

  @Post('rules')
  async createRule(@Param('eventId') eventId: string, @Body() body: { ruleType: string; config: any }) {
    const rule = await this.seatingService.createRule(eventId, body);
    return { data: rule };
  }

  @Patch('rules/:ruleId')
  async updateRule(@Param('ruleId') ruleId: string, @Body() body: any) {
    const rule = await this.seatingService.updateRule(ruleId, body);
    return { data: rule };
  }

  @Delete('rules/:ruleId')
  async deleteRule(@Param('ruleId') ruleId: string) {
    const result = await this.seatingService.deleteRule(ruleId);
    return { data: result };
  }
}
