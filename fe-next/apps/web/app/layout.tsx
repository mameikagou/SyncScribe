import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';

import '@workspace/ui/globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner'; // 1. 引入组件

// const fontSans = Geist({
//   subsets: ['latin'],
//   variable: '--font-sans',
// });

// const fontMono = Geist_Mono({
//   subsets: ['latin'],
//   variable: '--font-mono',
// });

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});
const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${sourceSerif4.variable}`}>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
