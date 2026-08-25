import type { Metadata } from "next";

export const SITE_ORIGIN = "https://steven77726.github.io";
export const SITE_BASE_PATH = "/LIBERTYK";
export const SITE_URL = `${SITE_ORIGIN}${SITE_BASE_PATH}`;
export const SITE_NAME = "Liberty K";
export const DEFAULT_TITLE = "Liberty K — Le guide d'excellence de la communauté juive";
export const DEFAULT_DESCRIPTION =
  "Liberty K, le guide incontournable des meilleures adresses, expériences et services de la communauté juive en France.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/food/restaurants-khan.jpg`;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === SITE_BASE_PATH || normalized.startsWith(`${SITE_BASE_PATH}/`)) {
    return `${SITE_ORIGIN}${normalized}`;
  }
  return `${SITE_URL}${normalized === "/" ? "" : normalized}`;
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt ?? title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
