import type { Metadata } from "next";
import { Montserrat, Syncopate } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const bodyFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
});

const headingFont = Syncopate({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Telemetry Console",
  description: "CSV telemetry plotting and serial connection tooling for a formula racing team.",
};

const themeInitializer = `
  try {
    const storedTheme = localStorage.getItem("tmfr-theme");
    const theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body
        className={`${bodyFont.variable} ${headingFont.variable} bg-background font-sans text-foreground antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
