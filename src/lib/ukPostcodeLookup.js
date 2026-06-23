/**
 * Maps a postcodes.io result to address form fields.
 * @see https://postcodes.io/docs/api/lookup-postcode/
 */
export function mapPostcodeResult(result) {
  if (!result) return null;

  const parish = result.parish?.replace(/, unparished area$/i, "").trim();
  const city =
    result.admin_district ||
    parish ||
    result.admin_ward ||
    result.region ||
    "";

  const state =
    result.admin_county ||
    result.region ||
    result.country ||
    "";

  return {
    postalCode: result.postcode || "",
    city,
    state,
  };
}

export async function lookupUkPostcode(postcode) {
  const trimmed = postcode?.trim();
  if (!trimmed) {
    throw new Error("Please enter a postcode");
  }

  const res = await fetch(
    `/api/postcode/lookup?postcode=${encodeURIComponent(trimmed)}`
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Could not find that postcode");
  }

  return data;
}
