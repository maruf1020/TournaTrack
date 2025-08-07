
'use client'; // This component now uses client-side hooks

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';
import { Roboto } from 'next/font/google';
import * as React from 'react';
import { getPublicSettings } from '@/lib/services';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

// Utility to convert hex to HSL for CSS variables
const hexToHsl = (hex: string): string => {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
};

// This component now fetches settings and applies the theme color.
function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
    React.useEffect(() => {
        const unsubscribe = getPublicSettings((settings) => {
            if (settings && settings.primaryColor) {
                const hslColor = hexToHsl(settings.primaryColor);
                document.documentElement.style.setProperty('--primary', hslColor);
                document.documentElement.style.setProperty('--ring', hslColor);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Tour Console</title>
        <meta name="description" content="Annual Tour Sports Tournament Management" />
      </head>
      <body className={cn(roboto.variable, "font-sans antialiased", "min-h-screen bg-background")}>
        <DynamicThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </DynamicThemeProvider>
      </body>
    </html>
  );
}
