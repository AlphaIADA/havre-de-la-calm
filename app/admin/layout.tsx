export const metadata = {
  title: {
    default: 'Admin',
    template: '%s — Admin',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="container-px py-10">{children}</div>;
}

