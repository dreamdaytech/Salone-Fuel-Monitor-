import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  getSeoForPath,
  isPrivateOrUtilityPath,
  normalizePathname,
} from '../../seo-routes.js';

type RouteMeta = {
  title: string;
  description: string;
  heading?: string;
  intro?: string;
  schemaType?: string;
  index?: boolean;
};

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = value;
}

function setCanonical(url: string) {
  let tag = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement('link');
    tag.rel = 'canonical';
    document.head.appendChild(tag);
  }
  tag.href = url;
}

function setJsonLd(data: unknown) {
  let script = document.getElementById('route-seo-jsonld') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'route-seo-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  document.getElementById('route-seo-jsonld')?.remove();
}

function getDynamicMeta(pathname: string): RouteMeta | null {
  if (pathname.startsWith('/blog/')) {
    return {
      title: `Fuel News & Analysis | ${SITE_NAME}`,
      description: 'Read Sierra Leone fuel-price news, market analysis, regional comparisons and explainers from Salone Fuel Monitor.',
      schemaType: 'Article',
      index: true,
    };
  }

  if (pathname.startsWith('/transport-prices/')) {
    return {
      title: `Sierra Leone Transport Fare Details | ${SITE_NAME}`,
      description: 'View transport fare and route-price details in Sierra Leone, with fuel-price context from Salone Fuel Monitor.',
      schemaType: 'WebPage',
      index: true,
    };
  }

  return null;
}

export default function RouteSEO() {
  const location = useLocation();

  useEffect(() => {
    const pathname = normalizePathname(location.pathname);
    const staticMeta = getSeoForPath(pathname) as RouteMeta | null;
    const dynamicMeta = getDynamicMeta(pathname);
    const privatePath = isPrivateOrUtilityPath(pathname);

    // Clear richer page-specific schema from the previous route. A page such as
    // BlogPost can add it back in its own SEO effect after navigation completes.
    document.getElementById('dynamic-seo-jsonld')?.remove();

    const meta: RouteMeta = staticMeta || dynamicMeta || {
      title: `Page Not Found | ${SITE_NAME}`,
      description: 'The requested Salone Fuel Monitor page could not be found.',
      schemaType: 'WebPage',
      index: false,
    };

    const canonical = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
    const shouldIndex = !privatePath && meta.index !== false;

    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', shouldIndex ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');
    setMeta('name', 'googlebot', shouldIndex ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');

    setCanonical(canonical);

    setMeta('property', 'og:type', meta.schemaType === 'Article' ? 'article' : 'website');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', DEFAULT_OG_IMAGE);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', SITE_NAME);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:url', canonical);
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    setMeta('name', 'twitter:image', DEFAULT_OG_IMAGE);

    if (!shouldIndex) {
      removeJsonLd();
      return;
    }

    const pageSchema = {
      '@context': 'https://schema.org',
      '@type': meta.schemaType || 'WebPage',
      name: meta.heading || meta.title.replace(` | ${SITE_NAME}`, ''),
      description: meta.description,
      url: canonical,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/logo.png`,
        },
      },
      ...(meta.schemaType === 'Dataset'
        ? {
            spatialCoverage: {
              '@type': 'Place',
              name: pathname === '/regional-comparison' ? 'West Africa' : 'Sierra Leone',
            },
            license: `${SITE_URL}/terms`,
          }
        : {}),
    };

    if (pathname === '/') {
      setJsonLd(pageSchema);
      return;
    }

    const breadcrumbName = meta.heading || meta.title.replace(` | ${SITE_NAME}`, '');
    setJsonLd([
      pageSchema,
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: breadcrumbName,
            item: canonical,
          },
        ],
      },
    ]);
  }, [location.pathname]);

  return null;
}
