import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyInternalApiToken } from './internal-auth.util';

type RequestWithUserId = {
  headers: Record<string, string | string[] | undefined>;
  userId?: string;
};

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUserId>();
    const rawHeader = request.headers['x-internal-auth'];
    const token = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!token) {
      throw new UnauthorizedException('Brak autoryzacji');
    }

    const userId = verifyInternalApiToken(token);
    if (!userId) {
      throw new UnauthorizedException('Nieprawidlowy token wewnetrzny');
    }

    request.userId = userId;
    return true;
  }
}
