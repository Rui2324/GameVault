function normalizeRawgHost(url) {
  if (!url) return null;
  let u = String(url);

  u = u.replace("https://api.rawg.io/media/", "https://media.rawg.io/media/");
  u = u.replace("http://api.rawg.io/media/", "https://media.rawg.io/media/");

  u = u.replace("http://media.rawg.io/media/", "https://media.rawg.io/media/");

  return u;
}

export function rawgOriginal(url) {
  return normalizeRawgHost(url);
}


export function rawgImage(url, opts = {}) {
  const original = normalizeRawgHost(url);
  if (!original) return null;

  const { mode = "resize", width = 900, height = "-" } = opts;

  const marker = "https://media.rawg.io/media/";
  if (!original.startsWith(marker)) return original;

  const rest = original.slice(marker.length); 

  if (rest.startsWith("resize/") || rest.startsWith("crop/")) return original;

  if (mode === "crop") {
    const w = Number(width) || 600;
    const h = Number(height) || 400;
    return `${marker}crop/${w}/${h}/${rest}`;
  }

  const w = Number(width) || 900;
  const h = height === "-" ? "-" : Number(height) || "-";
  return `${marker}resize/${w}/${h}/${rest}`;
}
