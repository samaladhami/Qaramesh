import './globals.css';
import { Tajawal } from 'next/font/google';
import localFont from 'next/font/local';

const tajawal = Tajawal({
  weight: ['400', '500', '700'],
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-tajawal',
});
const headingFont = localFont({
  src: '../public/fonts/baloo-bhaijaan-2/BalooBhaijaan2.ttf',
  weight: '800',
  display: 'swap',
  variable: '--font-heading',
});
export const metadata = { title: 'قراميش | قائمة الطعام', description: 'اكتشف قائمة قراميش — أطباق، ساندويتشات، بيتزا ومشروبات.' };
export default function RootLayout({ children }) {
  return <html lang="ar" dir="rtl" className={`${tajawal.variable} ${headingFont.variable}`}><body>{children}</body></html>;
}
