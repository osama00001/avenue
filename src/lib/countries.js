import countries from "@/data/countries.json";

export const DEFAULT_COUNTRY = "United Kingdom";

export const COUNTRIES = countries;

const UK_ALIASES = new Set([
  "united kingdom",
  "uk",
  "gb",
  "great britain",
  "england",
  "scotland",
  "wales",
  "northern ireland",
]);

export function isUnitedKingdom(country) {
  if (!country) return false;
  return UK_ALIASES.has(String(country).trim().toLowerCase());
}
