const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_URL) {
  console.warn("[strapi] STRAPI_URL is not set");
}

const buildUrl = (path) => {
  if (!STRAPI_URL) return path;
  return `${STRAPI_URL.replace(/\/$/, "")}${path}`;
};

const defaultHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  if (STRAPI_TOKEN) {
    headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
  }
  return headers;
};

const fetchStrapi = async (path, options = {}) => {
  const res = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...defaultHeaders(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strapi request failed (${res.status}): ${text}`);
  }

  return res.json();
};

export const getStrapiSingle = async (name, query = "") => {
  const suffix = query ? `?${query}` : "";
  return fetchStrapi(`/api/${name}${suffix}`);
};

export const getStrapiCollection = async (name, query = "") => {
  const suffix = query ? `?${query}` : "";
  return fetchStrapi(`/api/${name}${suffix}`);
};

export const getStrapiPageBySlug = async (slug, query = "") => {
  const suffix = query ? `&${query}` : "";
  return fetchStrapi(`/api/pages?filters[slug][$eq]=${slug}${suffix}`);
};
