import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
}

export function useSEO({ title, description }: SEOProps) {
  useEffect(() => {
    // Save original title and description to restore on unmount
    const originalTitle = document.title;
    let metaDescription = document.querySelector('meta[name="description"]');
    
    // Set new title
    document.title = title ? `${title} | Salone Fuel Monitor` : 'Salone Fuel Monitor';

    // Set or create new description
    if (description) {
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }

    return () => {
      document.title = originalTitle;
      // Optionally we could restore the old description here, but 
      // typically SPAs leave the last description, or we clear it.
      // Leaving it is usually fine.
    };
  }, [title, description]);
}
