import CmsSlugEditor from "@/components/CmsSlugEditor";

export default async function Page({ params }) {

  const { slug } = await params;

  return (
    <CmsSlugEditor slug={slug} />
  );
}