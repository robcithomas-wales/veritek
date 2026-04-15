import { Injectable, Logger } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { MaterialsService } from '../materials/materials.service';
import { ClockService } from '../clock/clock.service';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import type { User } from '@prisma/client';
import type { SyncRequestDto } from '@veritek/validators';
import {
  CreateActivitySchema,
  StartWorkSchema,
  StopWorkSchema,
  SubmitChecklistSchema,
  CreateMaterialSchema,
  UpdateMaterialSchema,
  ClockEventSchema,
  RejectServiceOrderSchema,
} from '@veritek/validators';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly activities: ActivitiesService,
    private readonly materials: MaterialsService,
    private readonly clock: ClockService,
    private readonly serviceOrders: ServiceOrdersService,
  ) {}

  async flush(dto: SyncRequestDto, user: User) {
    const sorted = [...dto.mutations].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const results: Array<{ id: number; success: boolean; error?: string }> = [];

    for (const mutation of sorted) {
      try {
        await this.route(mutation, user);
        results.push({ id: mutation.id, success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        this.logger.warn(`Sync mutation ${mutation.id} failed: ${message}`);
        results.push({ id: mutation.id, success: false, error: message });
      }
    }

    return { results };
  }

  private async route(
    mutation: SyncRequestDto['mutations'][number],
    user: User,
  ) {
    const { endpoint, method, body } = mutation;

    // POST /service-orders/:id/activities
    const createActivity = endpoint.match(/^\/service-orders\/([^/]+)\/activities$/);
    if (method === 'POST' && createActivity) {
      const dto = CreateActivitySchema.parse(body);
      return this.activities.create(createActivity[1]!, dto, user);
    }

    // PATCH /activities/:id/start-travel
    const startTravel = endpoint.match(/^\/activities\/([^/]+)\/start-travel$/);
    if (method === 'PATCH' && startTravel) {
      return this.activities.startTravel(startTravel[1]!, user);
    }

    // PATCH /activities/:id/start-work
    const startWork = endpoint.match(/^\/activities\/([^/]+)\/start-work$/);
    if (method === 'PATCH' && startWork) {
      const dto = StartWorkSchema.parse(body);
      return this.activities.startWork(startWork[1]!, dto, user);
    }

    // PATCH /activities/:id/stop-work
    const stopWork = endpoint.match(/^\/activities\/([^/]+)\/stop-work$/);
    if (method === 'PATCH' && stopWork) {
      const dto = StopWorkSchema.parse(body);
      return this.activities.stopWork(stopWork[1]!, dto, user);
    }

    // POST /activities/:id/checklist-responses
    const checklist = endpoint.match(/^\/activities\/([^/]+)\/checklist-responses$/);
    if (method === 'POST' && checklist) {
      const dto = SubmitChecklistSchema.parse(body);
      return this.activities.submitChecklist(checklist[1]!, dto);
    }

    // POST /service-orders/:id/complete
    const complete = endpoint.match(/^\/service-orders\/([^/]+)\/complete$/);
    if (method === 'POST' && complete) {
      const { signedBy } = body as { signedBy: string };
      return this.activities.complete(complete[1]!, user, signedBy);
    }

    // PATCH /service-orders/:id/accept
    const accept = endpoint.match(/^\/service-orders\/([^/]+)\/accept$/);
    if (method === 'PATCH' && accept) {
      return this.serviceOrders.accept(accept[1]!, user);
    }

    // PATCH /service-orders/:id/reject
    const reject = endpoint.match(/^\/service-orders\/([^/]+)\/reject$/);
    if (method === 'PATCH' && reject) {
      const dto = RejectServiceOrderSchema.parse(body);
      return this.serviceOrders.reject(reject[1]!, user, dto);
    }

    // POST /service-orders/:id/materials
    const createMaterial = endpoint.match(/^\/service-orders\/([^/]+)\/materials$/);
    if (method === 'POST' && createMaterial) {
      const dto = CreateMaterialSchema.parse(body);
      return this.materials.create(createMaterial[1]!, dto, user);
    }

    // PATCH /materials/:id
    const updateMaterial = endpoint.match(/^\/materials\/([^/]+)$/);
    if (method === 'PATCH' && updateMaterial) {
      const dto = UpdateMaterialSchema.parse(body);
      return this.materials.update(updateMaterial[1]!, dto, user);
    }

    // POST /clock
    if (method === 'POST' && endpoint === '/clock') {
      const dto = ClockEventSchema.parse(body);
      return this.clock.record(dto, user);
    }

    throw new Error(`Unrecognised mutation: ${method} ${endpoint}`);
  }
}
