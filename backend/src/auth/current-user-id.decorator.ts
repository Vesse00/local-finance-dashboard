import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestWithUserId = {
  userId?: string;
};

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUserId>();
    return request.userId;
  },
);
