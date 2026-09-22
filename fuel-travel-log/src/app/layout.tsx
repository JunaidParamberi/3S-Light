import { auth } from '@/auth';
import { DirectionProvider } from '@/components/ui/direction';
import type { UserRole } from '@/types/next-auth';
import Link from 'next/link';
import { signOutAction } from './actions';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: 'Fuel & Travel Log',
  description: 'Vehicle fuel & travel claim log for 3S Lighting',
};

const NAV: { href: string; label: string; roles: UserRole[] }[] = [
  { href: '/', label: 'Home', roles: ['employee', 'manager', 'accounts', 'hr'] },
  { href: '/new', label: 'Add Trip', roles: ['employee', 'manager'] },
  { href: '/approve', label: 'Approve', roles: ['manager'] },
  { href: '/vehicles', label: 'Vehicles', roles: ['manager', 'accounts'] },
  { href: '/dashboard', label: 'Dashboard', roles: ['accounts', 'hr'] },
];

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const role = session?.user.role;

  return (
    <html lang="en" dir="ltr" className={cn("font-sans", inter.variable)}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* RTL-ready: switch dir (here + <html dir>) to "rtl" to flip the whole UI to Arabic */}
        <DirectionProvider dir="ltr">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              ⛽ Fuel &amp; Travel Log
            </Link>
            {session && (
              <nav className="flex items-center gap-1 text-sm">
                {NAV.filter((item) => role && item.roles.includes(role)).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded px-2 py-1 hover:bg-gray-100"
                  >
                    {item.label}
                  </Link>
                ))}
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="ml-1 rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </form>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        </DirectionProvider>
      </body>
    </html>
  );
}
