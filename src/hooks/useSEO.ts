import { useEffect } from 'react';

const SITE_URL = 'https://salonefuelmonitor.com';
const SITE_NAME = 'Salone Fuel Monitor';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  robots?: string;
  keywords?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

function setMetaTag(key: string, content: string, attribute: 'name' | 'property' = 'property') {
  let tag = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function canonicalizeUrl(value?: string) {
  try {
    const parsed = new URL(value || window.location.href, SITE_URL);
    const pathname = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${pathname}`;
  } catch {
    const pathname = window.location.pathname === '/'
      ? '/'
      : window.location.pathname.replace(/\/+$/, '');
    return `${SITE_URL}${pathname}`;
  }
}

function setCanonical(url: string) {
  let tag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', url);
}

function setJsonLd(data?: SEOProps['jsonLd']) {
  const existing = document.getElementById('dynamic-seo-jsonld');
  if (!data) {
    existing?.remove();
    return;
  }

  // When a page supplies richer dynamic schema, remove the generic route schema.
  document.getElementById('route-seo-jsonld')?.remove();

  const script = (existing || document.createElement('script')) as HTMLScriptElement;
  script.id = 'dynamic-seo-jsonld';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
}

export function useSEO({
  title,
  description,
  image,
  url,
  type = 'website',
  robots = 'index, follow, max-image-preview:large',
  keywords,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const alreadyBranded = title.toLowerCase().includes(SITE_NAME.toLowerCase());
    const fullTitle = title
      ? (alreadyBranded ? title : `${title} | ${SITE_NAME}`)
      : SITE_NAME;
    const currentUrl = canonicalizeUrl(url);

    document.title = fullTitle;

    setMetaTag('robots', robots, 'name');
    setMetaTag('googlebot', robots, 'name');
    if (keywords) setMetaTag('keywords', keywords, 'name');

    setMetaTag('og:title', fullTitle);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', SITE_NAME);
    setMetaTag('og:url', currentUrl);

    setMetaTag('twitter:card', 'summary_large_image', 'name');
    setMetaTag('twitter:title', fullTitle, 'name');
    setMetaTag('twitter:url', currentUrl, 'name');

    setCanonical(currentUrl);

    if (description) {
      setMetaTag('description', description, 'name');
      setMetaTag('og:description', description);
      setMetaTag('twitter:description', description, 'name');
    }

    const ogImage = (image && image.startsWith('https://')) ? image : DEFAULT_OG_IMAGE;
    setMetaTag('og:image', ogImage);
    setMetaTag('twitter:image', ogImage, 'name');
    setMetaTag('og:image:width', '1200');
    setMetaTag('og:image:height', '630');
    setMetaTag('og:image:type', ogImage.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
    setMetaTag('og:image:alt', fullTitle);

    setJsonLd(jsonLd);
  }, [title, description, image, url, type, robots, keywords, jsonLd]);
}
