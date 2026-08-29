import type { Metadata, Viewport } from "next";
import "./globals.css";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "SEL Control",
  description: "Servicios Eléctricos López — gestión de obras y cotizaciones",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#14171a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <BrandMark />
        {children}
      </body>
    </html>
  );
}
