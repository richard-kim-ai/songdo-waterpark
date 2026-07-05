import type { Metadata } from 'next';
import { Jost, Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const jost = Jost({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jost',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: '송도국제캠핑장 물놀이장 - 여름의 즐거움',
  description:
    '시원한 발물놀이터와 편안한 카바나에서 가족과 함께 특별한 여름 추억을 만드세요. 입장권·카바나 예약 안내.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${jost.variable} ${notoSansKr.variable}`}>
      <body>{children}</body>
    </html>
  );
}
