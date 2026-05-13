import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/app/providers/reduxProvider";
import { Providers } from "./providers/authProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Avenue Book Store",
  description: "UK best book store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <Providers>{children}</Providers>
        </ReduxProvider>
      </body>
    </html>
  );
}
