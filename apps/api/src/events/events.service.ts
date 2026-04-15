import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { DomainEvent } from '@veritek/types';

@Injectable()
export class EventsService {
  constructor(private readonly emitter: EventEmitter2) {}

  emit(event: DomainEvent, payload: Record<string, unknown>): void {
    this.emitter.emit(event, payload);
  }
}
