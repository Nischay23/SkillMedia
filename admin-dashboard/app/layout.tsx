import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { dark } from "@clerk/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skills App Admin Dashboard",
  description: "Admin dashboard for managing Skills/Career app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#10b981",
          colorBackground: "#111827",
          colorInputBackground: "#0b0f19",
          colorInputText: "#e5e7eb",
        },
      }}
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          {/* Prevent theme flash on initial load */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('admin-theme');
                    if (theme === 'light') {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.classList.add('light');
                    } else if (theme === 'system') {
                      var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      document.documentElement.classList.remove('dark', 'light');
                      document.documentElement.classList.add(isDark ? 'dark' : 'light');
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider defaultTheme="dark" storageKey="admin-theme">
            <ConvexClientProvider>
              {children}
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
