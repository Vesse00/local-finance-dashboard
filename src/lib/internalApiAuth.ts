import { createHmac } from 'node:crypto';

const getInternalApiSecret = (): string =>
  process.env.INTERNAL_API_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  'dev-internal-api-secret-change-me';

export const createInternalApiToken = (userId: string): string => {
  const timestamp = Date.now().toString();
  const payload = `${userId}.${timestamp}`;

  const signature = createHmac('sha256', getInternalApiSecret())
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
};
