import { Test } from '@nestjs/testing';
import { EventsService } from './events.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

const mockEmitter = { emit: jest.fn() };

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();
    service = module.get(EventsService);
  });

  describe('emit', () => {
    it('delegates to EventEmitter2 with the event name and payload', () => {
      const payload = { orderId: 'order-1', userId: 'user-1' };
      service.emit('job.assigned', payload);
      expect(mockEmitter.emit).toHaveBeenCalledWith('job.assigned', payload);
    });

    it('emits exactly once per call', () => {
      service.emit('job.completed', { orderId: 'order-1' });
      expect(mockEmitter.emit).toHaveBeenCalledTimes(1);
    });
  });
});
