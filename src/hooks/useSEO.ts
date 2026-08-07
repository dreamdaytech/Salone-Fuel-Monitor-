import { useEffect } from 'react';

const DEFAULT_OG_IMAGE = 'https://salonefuelmonitor.com/og-image.png';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
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

export function useSEO({ title, description, image }: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Salone Fuel Monitor` : 'Salone Fuel Monitor';
    document.title = fullTitle;

    setMetaTag('og:title', fullTitle);
    setMetaTag('twitter:title', fullTitle);

    if (description) {
      setMetaTag('description', description, true);
      setMetaTag('og:description', description);
      setMetaTag('twitter:description', description);
    }

    // Use provided image if it's a real HTTPS URL, otherwise fallback to og-image.png
    const ogImage = (image && !image.startsWith('data:')) ? image : DEFAULT_OG_IMAGE;
    setMetaTag('og:image', ogImage);
    setMetaTag('twitter:image', ogImage);
  }, [title, description, image]);
}
