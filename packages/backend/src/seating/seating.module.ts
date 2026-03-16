import { Module } from '@nestjs/common';
import { SeatingService } from './seating.service';
import { SeatingController } from './seating.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [SeatingService],
  controllers: [SeatingController],
  exports: [SeatingService],
})
export class SeatingModule {}
