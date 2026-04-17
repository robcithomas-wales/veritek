import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Veritek Back Office',
  description: 'Field service management — operations portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
