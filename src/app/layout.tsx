import "../styles/globals.css";
import { Geist } from "next/font/google";

const geistSans = Geist({ subsets: ["latin"], weight: "400", display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`antialiased ${geistSans.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
