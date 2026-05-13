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
        if (entry?.attributes) {
          setFooterConfig({ id: entry.id, ...entry.attributes });
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
        {footerColumns.map((col) => {
          const items = useFooterConfig ? col.links || [] : group(col.level);

          return (
            <div key={col.title || col.level}>
              <h4 className="text-sm font-semibold tracking-widest mb-4">
                {col.title}
              </h4>

              <ul className="space-y-2 text-sm">
                {loading && <li className="text-gray-500">Loading...</li>}

                {!loading && items.length === 0 && (
                  <li className="text-gray-500">
                    {useFooterConfig ? "No links" : "No pages"}
                  </li>
                )}

                {useFooterConfig
                  ? items.map((link, index) => (
                      <li key={`${link.label}-${index}`}>
                        <Link
                          href={link.href || "#"}
                          className="hover:underline text-gray-300"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))
                  : items.map((page) => (
                      <li key={page.slug}>
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
                <li key={i}>
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

      {/* COPYRIGHT */}
      <div className="border-t border-neutral-700 text-xs text-gray-400 px-6 py-4 text-center">
        © AVENUE, 2026.
      </div>
    </footer>
  );
}
