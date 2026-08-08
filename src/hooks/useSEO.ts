import { useEffect } from 'react';

const DEFAULT_OG_IMAGE = 'https://salonefuelmonitor.com/og-image.png';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

function setMetaTag(property: string, content: string, isName = false) {
  const attr = isName ? 'name' : 'property';
  let tag = document.querySelector(`meta[${attr}="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function useSEO({ title, description, image, url, type = 'website' }: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Salone Fuel Monitor` : 'Salone Fuel Monitor';
    document.title = fullTitle;

    setMetaTag('og:title', fullTitle);
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('og:type', type);

    const currentUrl = url || window.location.href;
    setMetaTag('og:url', currentUrl);
    setMetaTag('twitter:url', currentUrl);

    if (description) {
      setMetaTag('description', description, true);
      setMetaTag('og:description', description);
      setMetaTag('twitter:description', description);
    }

    // Use provided image if it's a real HTTPS URL, otherwise fallback to og-image.png
    const ogImage = (image && image.startsWith('https://')) ? image : DEFAULT_OG_IMAGE;
    setMetaTag('og:image', ogImage);
    setMetaTag('twitter:image', ogImage);
    // Always set explicit dimensions — WhatsApp requires this to show the image without fetching it first
    setMetaTag('og:image:width', '1200');
    setMetaTag('og:image:height', '630');
    setMetaTag('og:image:type', 'image/jpeg');
  }, [title, description, image, url, type]);
}
