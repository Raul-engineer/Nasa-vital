import "./globals.css";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import RegistrarSW from "@/components/RegistrarSW";
import FondoApp from "@/components/FondoApp";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-space-grotesk", display: "swap" });

export const metadata = {
  title: "QuickFix · Another successful procedure",
  description: "QuickFix: autonomous health companion for astronauts on long-duration missions. Another successful procedure.",
  applicationName: "QuickFix",
  icons: { icon: "/favicon.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "QuickFix", statusBarStyle: "black-translucent" },
};

export const viewport = {
  themeColor: "#05040e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-US" data-theme="dark" className={`${dmSans.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <FondoApp />
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
