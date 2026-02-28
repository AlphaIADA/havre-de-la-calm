export const metadata = {
  title: 'Terms',
  description: 'Terms of service for OTA Apartments.',
};

export default function TermsPage() {
  return (
    <div className="container-px py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Terms</h1>
        <p className="mt-4 text-sm text-zinc-700">
          By booking, you agree to provide accurate guest details and required KYC documents before
          confirmation. House rules apply per unit. Payment may be completed online (if enabled) or
          offline, depending on your selection.
        </p>
      </div>
    </div>
  );
}

