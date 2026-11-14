import "./globals.css";
import { SCRIPT_TEMA } from "@/lib/temaScript";

export const metadata = {
  title: "QuickFix · Another successful procedure",
  description: "QuickFix: compañero de salud autónomo para astronautas en misiones de larga duración. Another successful procedure.",
  icons: { icon: "/favicon.png", apple: "/logo-quickfix-icono.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
