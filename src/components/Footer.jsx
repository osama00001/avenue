"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchCMSPages } from "@/store/cmsSlice";
import { fetchSocialLinks } from "@/store/socialSlice";

import {
  faXTwitter,
  faSquareFacebook,
  faInstagram,
  faTiktok,
  faYoutube,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Map icon string from DB → actual icon object
 */
const ICON_MAP = {
  faXTwitter,
  faSquareFacebook,
  faInstagram,
  faTiktok,
  faYoutube,
  faLinkedin,
};

const pickFirstString = (obj, exclude = []) => {
  if (!obj) return null;
  for (const [key, value] of Object.entries(obj)) {
    if (exclude.includes(key)) continue;
    if (typeof value === "string" && value.trim().length) {
      return value.trim();
    }
  }
  return null;
};

const resolveFooterHref = (href) => {
  if (!href) return "#";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  if (href.startsWith("/cms/")) return href;
  const normalized = href.startsWith("/") ? href : `/${href}`;
  return `/cms${normalized}`;
};

export default function Footer() {
  const dispatch = useDispatch();
  const [footerConfig, setFooterConfig] = useState(null);

  const { list: pages, loading } = useSelector((s) => s.cms);
  const { links: socialLinks } = useSelector((s) => s.social);

  /**
   * ================= LOAD DATA
   */
  useEffect(() => {
    if (!pages.length) {
      dispatch(fetchCMSPages());
    }

    if (!socialLinks.length) {
      dispatch(fetchSocialLinks());
    }

    const loadFooter = async () => {
      try {
        const res = await fetch("/api/strapi/footer");
        if (!res.ok) return;
        const payload = await res.json();
        const entry = payload?.data;
        const attributes = entry?.attributes ?? entry;
        if (attributes) {
          setFooterConfig({ id: entry?.id, ...attributes });
        }
      } catch (err) {
        console.error("[footer] failed to load footer config", err);
      }
    };

    loadFooter();
  }, [dispatch]);

  /**
   * ================= CMS GROUP
   */
  const group = (lvl) => pages.filter((p) => Number(p.level || 0) === lvl);

  const columns = [
    { title: "SHOPPING WITH US", level: 1 },
    { title: "LEGAL", level: 2 },
    { title: "ABOUT AVENUE", level: 3 },
  ];

  const footerColumns =
    footerConfig?.columns && footerConfig.columns.length
      ? footerConfig.columns
      : columns;
  const useFooterConfig = footerColumns === footerConfig?.columns;


  

  /**
   * ================= SORT SOCIALS
   */
  const visibleSocials = [...socialLinks]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

    // console.log("-=-= visibleSocials -=-=-=",visibleSocials);
    // console.log("-=-= socialLinks -=-=-=",socialLinks);

  return (
    <footer className="bg-[#363636] text-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-16">
        {/* CMS COLUMNS */}
        {footerColumns.map((col, colIndex) => {
          const items = useFooterConfig ? col.links || [] : group(col.level);
          const columnTitle =
            col.title || pickFirstString(col, ["id", "links"]);
          const columnKey =
            col.id ?? columnTitle ?? col.level ?? `col-${colIndex}`;

          return (
            <div key={columnKey}>
              <h4 className="text-sm font-semibold tracking-widest mb-4">
                {columnTitle || col.level || "Links"}
              </h4>

              <ul className="space-y-2 text-sm">
                {loading && <li className="text-gray-500">Loading...</li>}

                {!loading && items.length === 0 && (
                  <li className="text-gray-500">
                    {useFooterConfig ? "No links" : "No pages"}
                  </li>
                )}

                {useFooterConfig
                  ? items.map((link, index) => {
                      const linkLabel =
                        link.label || pickFirstString(link, ["id", "href"]);
                      const rawHref = link.href || link.url || "#";
                      const linkHref = resolveFooterHref(rawHref);
                      const linkKey =
                        link.id ??
                        linkLabel ??
                        linkHref ??
                        `link-${colIndex}-${index}`;
                      if (!linkLabel) return null;
                      return (
                        <li key={linkKey}>
                          <Link
                            href={linkHref}
                            target={link.openInNewTab ? "_blank" : undefined}
                            rel={link.openInNewTab ? "noreferrer" : undefined}
                            className="hover:underline text-gray-300"
                          >
                            {linkLabel}
                          </Link>
                        </li>
                      );
                    })
                  : items.map((page, index) => (
                      <li key={page.id ?? page.slug ?? `page-${index}`}>
                        <Link
                          href={`/cms/${page.slug}`}
                          className="hover:underline text-gray-300"
                        >
                          {page.title}
                        </Link>
                      </li>
                    ))}
              </ul>
            </div>
          );
        })}

        {/* SOCIAL (Redux Powered) */}
        <div>
          <h4 className="text-sm font-semibold tracking-widest mb-4">
            FOLLOW US
          </h4>

          <ul className="space-y-3 text-sm">
            {visibleSocials.map((social, i) => {
              const Icon = ICON_MAP[social.icon];
              // console.log("-=-=--= item in teh visibleSocials -=-=-", social);
              return (
                <li key={social.id ?? social.label ?? `social-${i}`}>
                  <Link
                    href={social.url}
                    target="_blank"
                    className="flex items-center gap-3 hover:underline"
                  >
                    {Icon && (
                      <FontAwesomeIcon icon={Icon} className="w-4 h-4" />
                    )}
                    <span>{social.label}</span>
                  </Link>
                </li>
              );
            })}

            {!visibleSocials.length && (
              <li className="text-gray-500">No social links</li>
            )}
          </ul>
        </div>
      </div>

      {/* Legal / company info */}
      <div className="border-t border-neutral-700 px-6 py-5">
        <div className="max-w-7xl mx-auto text-center text-xs text-gray-400 leading-relaxed space-y-1">
          <p className="font-medium text-gray-300">© Avenue, 2026.</p>
          <p>
            Avenue Retail Online Limited. Registered in England and Wales. Company
            Number 16339200. Registered Office 128 City Road London EC1V 2NX
          </p>
        </div>
      </div>
    </footer>
  );
}
