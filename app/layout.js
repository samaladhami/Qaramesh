import './globals.css';
import { Tajawal } from 'next/font/google';

const tajawal = Tajawal({
  weight: ['400', '500', '700'],
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-tajawal',
});
export const metadata = { title: 'قراميش | قائمة الطعام', description: 'اكتشف قائمة قراميش — أطباق، ساندويتشات، بيتزا ومشروبات.' };
export default function RootLayout({ children }) {
  return <html lang="ar" dir="rtl" className={tajawal.variable}><body>{children}</body></html>;
}
