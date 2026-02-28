export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_PUBLIC_KEY && process.env.PAYSTACK_SECRET_KEY);
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

