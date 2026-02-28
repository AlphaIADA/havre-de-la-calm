import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export const metadata = {
  title: 'Login',
};

export default function AdminLoginPage() {
  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-base font-semibold">Admin login</h2>
      <p className="text-sm text-zinc-600">Sign in to manage properties, units, bookings, and KYC.</p>
      <AdminLoginForm />
    </div>
  );
}
