import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [ImportsService],
  controllers: [ImportsController],
  exports: [ImportsService],
})
export class ImportsModule {}
