import HomePageClient from "./HomePageClient";

const SEO_TITLE =
  "The best deals on books, fiction, nonfiction and children's books at Avenue Bookstore";

const SEO_DESCRIPTION =
  "The Avenue Bookstore brings you the best deals on books, stationery and gifts. Fiction, nonfiction and children's books of all genres and ages await. Great deals and free next day delivery on books.";

export const metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: "website",
    siteName: "Avenue Bookstore",
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
