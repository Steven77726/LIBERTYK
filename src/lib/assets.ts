export function withCacheBust(url: string, version?: string | number): string {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.includes("?v=") || url.includes("&v=")) return url;
  const v = version ?? (typeof window !== "undefined" ? Math.floor(Date.now() / 60000) : 1);
  if (url.includes("?")) {
    return `${url}&v=${v}`;
  }
  return `${url}?v=${v}`;
}

export function assetPath(src: string) {
  if (!src || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}${src.startsWith("/") ? src : `/${src}`}`;
}
