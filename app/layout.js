import "./globals.css";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import RegistrarSW from "@/components/RegistrarSW";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata = {
  title: "QuickFix · Another successful procedure",
  description: "QuickFix: compañero de salud autónomo para astronautas en misiones de larga duración. Another successful procedure.",
  applicationName: "QuickFix",
  icons: { icon: "/favicon.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "QuickFix", statusBarStyle: "black-translucent" },
};

export const viewport = {
  themeColor: "#100f13",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX" data-theme="dark" className={`${dmSans.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <div className="orb orb-a" aria-hidden />
        <div className="orb orb-b" aria-hidden />
        <div className="orb orb-c" aria-hidden />
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
