import { PipeTransform, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import type { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(
    private readonly schema: ZodSchema,
    private readonly target: 'body' | 'query' = 'body',
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== this.target) return value;
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return result.data;
  }
}
