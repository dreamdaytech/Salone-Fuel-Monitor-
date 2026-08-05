import { useEffect } from 'react';

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

    if (image) {
      setMetaTag('og:image', image);
      setMetaTag('twitter:image', image);
    }
  }, [title, description, image]);
}
