import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ReduxProvider from "@/app/providers/reduxProvider";
import { Providers } from "./providers/authProvider";
import CookieConsent from "@/components/CookieConsent";

const GA_MEASUREMENT_ID = "G-2XBZ685SBM";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default:
      "The best deals on books, fiction, nonfiction and children's books at Avenue Bookstore",
    template: "%s | Avenue Bookstore",
  },
  description:
    "The Avenue Bookstore brings you the best deals on books, stationery and gifts. Fiction, nonfiction and children's books of all genres and ages await. Great deals and free next day delivery on books.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <Providers>
            {children}
            <CookieConsent />
          </Providers>
        </ReduxProvider>
      </body>
    </html>
  );
}
