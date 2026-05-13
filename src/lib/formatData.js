export const formatPublishingDate = (raw) => {
  if (!raw || raw.length !== 8) return raw;

  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);

  const date = new Date(`${year}-${month}-${day}`);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};