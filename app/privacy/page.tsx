export const metadata = {
  title: 'Privacy',
  description: 'Privacy policy for OTA Apartments.',
};

export default function PrivacyPage() {
  return (
    <div className="container-px py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
        <p className="mt-4 text-sm text-zinc-700">
          We collect the minimum data required to run bookings and keep guests safe. KYC documents
          are stored securely and are only accessible to ADMIN/STAFF for verification.
        </p>
        <p className="mt-4 text-sm text-zinc-700">
          For questions, contact us at <span className="font-medium">hdlc.bookings@gmail.com</span>.
        </p>
      </div>
    </div>
  );
}

