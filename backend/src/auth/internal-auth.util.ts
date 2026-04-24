import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 5 * 60 * 1000;

const getInternalApiSecret = (): string =>
  process.env.INTERNAL_API_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  'dev-internal-api-secret-change-me';

const computeSignature = (payload: string): string => {
  return createHmac('sha256', getInternalApiSecret())
    .update(payload)
    .digest('base64url');
};

export const verifyInternalApiToken = (token: string): string | null => {
  const [userId, timestampRaw, providedSignature] = token.split('.');
  if (!userId || !timestampRaw || !providedSignature) {
    return null;
  }

  const timestamp = Number(timestampRaw);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  if (Date.now() - timestamp > TOKEN_TTL_MS) {
    return null;
  }

  const payload = `${userId}.${timestampRaw}`;
  const expectedSignature = computeSignature(payload);

  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return null;
  }

  const isValid = timingSafeEqual(expectedBuffer, providedBuffer);
  return isValid ? userId : null;
};
