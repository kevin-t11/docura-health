/** Set app metadata, DM Sans, and shared query and toast providers. */
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import '@/app/globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/providers/toast-provider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans'
});

export const metadata: Metadata = {
  title: 'Docura · Clarity in every document',
  description:
    'Understand your documents, ask grounded questions, and trace every insight to its source.'
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="bg-paper font-sans text-[15px] leading-[1.6] text-copy antialiased selection:bg-[#d9e9dc]">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
