import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SocialFeed - Clean & Simple Social Experience",
  description: "A clean and simple social feed application with beautiful post cards, comments, and image previews.",
  keywords: ["Social", "Feed", "Community", "Posts", "Next.js", "TypeScript"],
  authors: [{ name: "SocialFeed Team" }],
  icons: {
    icon: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=32&h=32&fit=crop",
  },
  openGraph: {
    title: "SocialFeed",
    description: "Clean & Simple Social Experience",
    url: "https://socialfeed.app",
    siteName: "SocialFeed",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
