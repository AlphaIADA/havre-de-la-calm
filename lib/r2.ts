import crypto from 'crypto';

function isNonEmpty(value: string | undefined | null) {
  return typeof value === 'string' && value.trim().length > 0;
}

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function awsEncodePath(path: string) {
  return path
    .split('/')
    .map((segment) => awsEncode(segment))
    .join('/');
}

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function hmac(key: Buffer, input: string) {
  return crypto.createHmac('sha256', key).update(input, 'utf8').digest();
}

function toAmzDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mi = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return {
    dateStamp: `${yyyy}${mm}${dd}`,
    amzDate: `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`,
  };
}

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return `${b}/${p}`;
}

function sanitizePathPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function isR2Configured() {
  return (
    isNonEmpty(process.env.CLOUDFLARE_R2_ACCOUNT_ID) &&
    isNonEmpty(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) &&
    isNonEmpty(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) &&
    isNonEmpty(process.env.CLOUDFLARE_R2_BUCKET)
  );
}

export function getR2PublicBaseUrl() {
  const value = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '').trim();
  return value ? value.replace(/\/+$/, '') : null;
}

export function buildR2ObjectKey(prefix: string, fileName: string) {
  const safePrefix = prefix
    .split('/')
    .map((p) => sanitizePathPart(p))
    .filter(Boolean)
    .join('/');
  const safeName = sanitizePathPart(fileName);
  const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
  const safeExt = ext ? sanitizePathPart(ext) : '';
  const finalName = safeExt && !safeName.endsWith(`.${safeExt}`) ? `${safeName}.${safeExt}` : safeName;

  const stamp = Date.now();
  const rand = crypto.randomBytes(6).toString('hex');
  const name = finalName || `upload-${stamp}-${rand}`;
  const withRand = `${stamp}-${rand}-${name}`;
  return safePrefix ? `${safePrefix}/${withRand}` : withRand;
}

export function getR2PublicUrlForKey(key: string) {
  const base = getR2PublicBaseUrl();
  if (!base) return null;
  return joinUrl(base, key);
}

export function presignR2PutObject(input: {
  key: string;
  expiresInSeconds?: number;
}) {
  if (!isR2Configured()) {
    throw new Error('R2 is not configured');
  }

  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!.trim();
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!.trim();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET!.trim();
  const region = (process.env.CLOUDFLARE_R2_REGION ?? 'auto').trim() || 'auto';

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const method = 'PUT';
  const now = new Date();
  const { amzDate, dateStamp } = toAmzDate(now);
  const expires = Math.min(60 * 30, Math.max(60, input.expiresInSeconds ?? 60 * 10));

  const canonicalUri = awsEncodePath(`/${bucket}/${input.key}`);

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
  };

  const canonicalQueryString = Object.keys(query)
    .sort()
    .map((k) => `${awsEncode(k)}=${awsEncode(query[k] ?? '')}`)
    .join('&');

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = [method, canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n');

  const kDate = hmac(Buffer.from(`AWS4${secretAccessKey}`, 'utf8'), dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  const uploadUrl = `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  return { uploadUrl, expiresInSeconds: expires };
}

