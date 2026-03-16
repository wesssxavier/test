import { Module } from '@nestjs/common';
import { RoomElementsService } from './room-elements.service';
import { RoomElementsController } from './room-elements.controller';

@Module({
  providers: [RoomElementsService],
  controllers: [RoomElementsController],
  exports: [RoomElementsService],
})
export class RoomElementsModule {}
