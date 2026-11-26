const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}

const legacySite = "https://circon3m22.github.io/je-tiki";

export function storefrontImageUrl(url: string) {
  return url.startsWith(`${legacySite}/images/je-tiki/`)
    ? assetPath(url.slice(legacySite.length))
    : url;
}
