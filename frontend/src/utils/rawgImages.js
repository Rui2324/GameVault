// frontend/src/utils/rawgImages.js

function normalizeRawgHost(url) {
  if (!url) return null;
  let u = String(url);

  // se por algum motivo veio "api.rawg.io/media/...", troca para o host certo
  u = u.replace("https://api.rawg.io/media/", "https://media.rawg.io/media/");
  u = u.replace("http://api.rawg.io/media/", "https://media.rawg.io/media/");

  // garante https
  u = u.replace("http://media.rawg.io/media/", "https://media.rawg.io/media/");

  return u;
}

// devolve sempre o original “normal”
export function rawgOriginal(url) {
  return normalizeRawgHost(url);
}

/**
 * Gera URL resized/crop do RAWG.
 * Exemplos RAWG válidos:
 * - https://media.rawg.io/media/resize/900/-/games/...
 * - https://media.rawg.io/media/crop/600/400/games/...
 */
export function rawgImage(url, opts = {}) {
  const original = normalizeRawgHost(url);
  if (!original) return null;

  const { mode = "resize", width = 900, height = "-" } = opts;

  // só sabemos “resizar” se for do media.rawg.io/media/...
  const marker = "https://media.rawg.io/media/";
  if (!original.startsWith(marker)) return original;

  const rest = original.slice(marker.length); // ex: games/xxx.jpg

  // evita duplicar resize/crop se já vier aplicado
  if (rest.startsWith("resize/") || rest.startsWith("crop/")) return original;

  if (mode === "crop") {
    // crop precisa de width e height numéricos
    const w = Number(width) || 600;
    const h = Number(height) || 400;
    return `${marker}crop/${w}/${h}/${rest}`;
  }

  // resize aceita "-" como height (mantém proporção)
  const w = Number(width) || 900;
  const h = height === "-" ? "-" : Number(height) || "-";
  return `${marker}resize/${w}/${h}/${rest}`;
}
