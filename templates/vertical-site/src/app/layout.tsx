import "../../registerPacks";
import "./globals.css";
import type { Metadata } from "next";
import siteConfig from "../../site.config";
import Layout from "@/components/Layout";

export const metadata: Metadata = {
  title: siteConfig.businessName,
  description: `${siteConfig.businessName} — ${siteConfig.address}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={
          {
            "--brand-primary": siteConfig.brandHues.primary,
            "--brand-secondary": siteConfig.brandHues.secondary,
          } as React.CSSProperties
        }
      >
        <Layout config={siteConfig}>{children}</Layout>
      </body>
    </html>
  );
}
