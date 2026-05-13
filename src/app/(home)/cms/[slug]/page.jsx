import CmsPage from "@/models/CmsPage";
import { TEMPLATE_REGISTRY } from "@/components/templates/registry";
import { connectDB } from "@/lib/db";
import CmsNotFound from "@/components/CmsNotFound";
import { getStrapiPageBySlug } from "@/lib/strapi";
import parse from "html-react-parser";

export default async function Page({ params }) {
  const { slug } = await params;

  let strapiEntry = null;

  try {
    const strapiData = await getStrapiPageBySlug(
      slug,
      "fields[0]=title&fields[1]=slug&fields[2]=content"
    );
    strapiEntry = strapiData?.data?.[0] || null;
  } catch (err) {
    console.error("[cms] failed to load Strapi page", err);
  }

  if (strapiEntry?.attributes) {
    const { title, content } = strapiEntry.attributes;
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {title && <h1 className="text-4xl font-bold">{title}</h1>}
        <div className="text-base leading-relaxed text-slate-800">
          {content ? parse(content) : null}
        </div>
      </div>
    );
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
