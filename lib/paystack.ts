import crypto from 'crypto';

export function getPaystackSecret() {
  return process.env.PAYSTACK_SECRET_KEY ?? null;
}

export function getPaystackPublic() {
  return process.env.PAYSTACK_PUBLIC_KEY ?? null;
}

export function isPaystackEnabled() {
  return Boolean(getPaystackSecret() && getPaystackPublic());
}

export async function paystackInitialize(input: {
  email: string;
  amountKobo: number;
  callbackUrl: string;
  reference: string;
  metadata?: Record<string, unknown>;
}) {
  const secret = getPaystackSecret();
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not set');

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? undefined,
    }),
  });

  type InitResponse = {
    status: boolean;
    message?: string;
    data?: { authorization_url: string; access_code: string; reference: string };
  };

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok || !json || typeof json !== 'object') {
    throw new Error('Paystack initialize failed');
  }

  const parsed = json as InitResponse;
  if (!parsed.status || !parsed.data) {
    const message = parsed.message || 'Paystack initialize failed';
    throw new Error(message);
  }

  return parsed.data;
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string) {
  const secret = getPaystackSecret() ?? process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) return false;
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return hash === signature;
}
