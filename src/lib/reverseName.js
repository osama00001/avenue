function reverseName(name) {
  if (!name || !name.includes(",")) return "Unknown Author";

  const [last, first] = name.split(",").map((s) => s.trim());
  return `${first} ${last}`;
}

export default reverseName;