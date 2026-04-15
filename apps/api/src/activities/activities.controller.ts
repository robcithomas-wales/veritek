import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  CreateActivitySchema,
  StartWorkSchema,
  StopWorkSchema,
  SubmitChecklistSchema,
} from '@veritek/validators';
import type { User } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post('service-orders/:id/activities')
  @UsePipes(new ZodValidationPipe(CreateActivitySchema, 'body'))
  create(
    @Param('id') serviceOrderId: string,
    @Body() body: unknown,
    @CurrentUser() user: User,
  ) {
    return this.activities.create(serviceOrderId, body as any, user);
  }

  @Patch('activities/:id/start-travel')
  startTravel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.activities.startTravel(id, user);
  }

  @Patch('activities/:id/start-work')
  @UsePipes(new ZodValidationPipe(StartWorkSchema, 'body'))
  startWork(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: User,
  ) {
    return this.activities.startWork(id, body as any, user);
  }

  @Patch('activities/:id/stop-work')
  @UsePipes(new ZodValidationPipe(StopWorkSchema, 'body'))
  stopWork(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: User,
  ) {
    return this.activities.stopWork(id, body as any, user);
  }

  @Post('service-orders/:id/complete')
  complete(
    @Param('id') serviceOrderId: string,
    @Body('signedBy') signedBy: string,
    @CurrentUser() user: User,
  ) {
    return this.activities.complete(serviceOrderId, user, signedBy);
  }

  @Post('activities/:id/checklist-responses')
  @UsePipes(new ZodValidationPipe(SubmitChecklistSchema, 'body'))
  submitChecklist(@Param('id') activityId: string, @Body() body: unknown) {
    return this.activities.submitChecklist(activityId, body as any);
  }
}
