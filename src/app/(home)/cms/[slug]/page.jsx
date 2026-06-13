import Link from "next/link";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import CmsPage from "@/models/CmsPage";
import { TEMPLATE_REGISTRY } from "@/components/templates/registry";
import { connectDB } from "@/lib/db";
import CmsNotFound from "@/components/CmsNotFound";
import { getStrapiCollection, getStrapiPageBySlug } from "@/lib/strapi";

const cmsHeadingFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-cms-heading",
});

const cmsBodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cms-body",
});

const renderCmsContent = (content) => {
  if (!content) return null;
  if (typeof content !== "string") {
    return (
      <pre className="cms-pre">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw]}
    >
      {content}
    </ReactMarkdown>
  );
};

export default async function Page({ params }) {
  const { slug } = await params;

  let strapiEntry = null;
  let navPages = [];
  const useStrapi = Boolean(process.env.STRAPI_URL);

  try {
    const strapiData = await getStrapiPageBySlug(
      slug,
      "fields[0]=title&fields[1]=slug&fields[2]=content"
    );
    strapiEntry = strapiData?.data?.[0] || null;
  } catch (err) {
    console.error("[cms] failed to load Strapi page", err);
  }

  try {
    const navData = await getStrapiCollection(
      "pages",
      "fields[0]=title&fields[1]=slug&fields[2]=level&sort[0]=level:asc&sort[1]=title:asc"
    );
    navPages = (navData?.data || [])
      .map((entry) => ({
        id: entry.id,
        ...(entry.attributes || entry),
      }))
      .filter((entry) => entry?.slug && entry?.title);
  } catch (err) {
    console.error("[cms] failed to load Strapi nav pages", err);
  }

  const strapiAttributes = strapiEntry?.attributes || strapiEntry;

  if (strapiAttributes) {
    const { title, content } = strapiAttributes;
    return (
      <div
        className={`cms-page ${cmsHeadingFont.variable} ${cmsBodyFont.variable}`}
      >
        <div className="cms-shell">
          <div className="cms-grid">
            {navPages.length > 0 && (
              <aside className="cms-sidebar">
                <h2 className="cms-sidebar-title">Help menu</h2>
                <ul className="cms-nav">
                  {navPages.map((page) => {
                    const isActive = page.slug === slug;
                    const level = Number(page.level || 0);
                    const itemClass =
                      level === 1 ? "cms-nav-heading" : "cms-nav-item";
                    return (
                      <li key={page.id || page.slug}>
                        <Link
                          href={`/cms/${page.slug}`}
                          className={`${itemClass} ${
                            isActive ? "cms-nav-active" : ""
                          }`}
                        >
                          <span>{page.title}</span>
                          <span className="cms-nav-arrow">▶</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            )}
            <div className="cms-article">
              {title && <h1 className="cms-title">{title}</h1>}
              <div className="cms-content">{renderCmsContent(content)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (useStrapi) {
    return <CmsNotFound />;
  }

  await connectDB();

  const page = await CmsPage.findOne({ slug }).lean();

  if (!page) {
    return <CmsNotFound />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Title */}
      {page.title && <h1 className="text-4xl font-bold mb-10">{page.title}</h1>}

      {/* Blocks */}
      {page.blocks.map((block, i) => {
        const Comp = TEMPLATE_REGISTRY[block.type]?.component;

        if (!Comp) return null;

        return <Comp key={i} {...block.data} />;
      })}
    </div>
  );
}
