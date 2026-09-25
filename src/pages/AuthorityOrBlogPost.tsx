import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, ChevronRight, Share2 } from 'lucide-react';
import BlogPost from './BlogPost';
import { useSEO } from '../hooks/useSEO';
import { collection, getDocs, limit, query, where } from '../firebase';
import { db } from '../firebase';
import { getStaticArticle, STATIC_CONTENT_ARTICLES } from '../../content-articles-runtime.js';

const SITE_URL = 'https://salonefuelmonitor.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const ORGANIZATION_LOGO = { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` };

type OverrideStatus = 'checking' | 'present' | 'absent';

function formatPublishedDate(value?: string) {
  if (!value) return 'Recently';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Recently'
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getAbsoluteImageUrl(value?: string) {
  if (!value) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

function StaticAuthorityArticle({ article }: { article: any }) {
  const canonicalUrl = `${SITE_URL}/blog/${article.slug}`;
  const featuredImageUrl = getAbsoluteImageUrl(article.coverImage);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.seoDescription || article.excerpt,
    image: featuredImageUrl,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Organization',
      name: article.authorName || 'Salone Fuel Monitor',
      url: SITE_URL,
      logo: ORGANIZATION_LOGO,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Salone Fuel Monitor',
      url: SITE_URL,
      logo: ORGANIZATION_LOGO,
    },
  };

  useSEO({
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    image: featuredImageUrl,
    type: 'article',
    url: canonicalUrl,
    robots: 'index, follow, max-image-preview:large',
    keywords: article.tags?.join(', '),
    jsonLd: articleSchema,
  });

  const related = STATIC_CONTENT_ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 3);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.excerpt, url: canonicalUrl });
        return;
      } catch {
        // User cancelled or browser blocked sharing; fall back to copy below.
      }
    }
    await navigator.clipboard.writeText(canonicalUrl);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-surface-50 px-4 py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          <Link to="/blog" className="mb-8 inline-flex items-center text-sm font-bold text-gray-500 hover:text-primary">
            ← Back to fuel news & analysis
          </Link>
          <div className="mb-6 flex flex-wrap gap-2">
            {(article.tags || []).map((tag: string) => (
              <span key={tag} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-surface-900 md:text-5xl lg:text-6xl">
            {article.title}
          </h1>
          <p className="mb-8 max-w-3xl text-xl leading-relaxed text-gray-500 md:text-2xl">{article.excerpt}</p>
          <div className="flex items-center justify-between border-t border-gray-200 pt-8">
            <div>
              <div className="font-bold text-surface-900">{article.authorName || 'Salone Fuel Monitor'}</div>
              <div className="mt-1 flex items-center gap-1 text-sm font-medium text-gray-500">
                <Calendar className="h-3.5 w-3.5" /> {formatPublishedDate(article.publishedAt)}
              </div>
            </div>
            <button onClick={handleShare} className="rounded-xl border border-gray-200 bg-white p-3 text-gray-600 shadow-sm hover:border-primary hover:text-primary" title="Share this article">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {article.coverImage && (
        <div className="mx-auto max-w-5xl px-4 pt-10 md:pt-14">
          <div className="aspect-video overflow-hidden rounded-3xl border border-gray-100 bg-surface-50 shadow-xl shadow-surface-900/5">
            <img
              src={article.coverImage}
              alt={`${article.title} featured image`}
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-12 pb-24">
        <article className="blog-content max-w-none text-lg leading-relaxed text-surface-900" dangerouslySetInnerHTML={{ __html: article.content }} />
      </main>

      <section className="border-t border-gray-100 bg-surface-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-2xl font-black text-surface-900">More Fuel Guides</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} to={`/blog/${item.slug}`} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                {item.coverImage && (
                  <div className="aspect-video overflow-hidden bg-surface-100">
                    <img src={item.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  </div>
                )}
                <div className="p-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">{item.tags?.[0] || 'Fuel Guide'}</p>
                  <h3 className="text-lg font-bold text-surface-900 transition-colors group-hover:text-primary">{item.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">{item.excerpt}</p>
                  <div className="mt-5 flex items-center gap-1 text-sm font-bold text-primary">Read guide <ChevronRight className="h-4 w-4" /></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AuthorityOrBlogPost() {
  const { slug = '' } = useParams<{ slug: string }>();
  const article = getStaticArticle(slug);
  const [overrideStatus, setOverrideStatus] = useState<OverrideStatus>(article ? 'checking' : 'absent');

  useEffect(() => {
    let cancelled = false;

    if (!slug || !article) {
      setOverrideStatus('absent');
      return () => {
        cancelled = true;
      };
    }

    setOverrideStatus('checking');

    const checkForAdminOverride = async () => {
      try {
        const overrideQuery = query(
          collection(db, 'blog_posts'),
          where('slug', '==', slug),
          limit(1)
        );
        const snapshot = await getDocs(overrideQuery);
        if (!cancelled) setOverrideStatus(snapshot.empty ? 'absent' : 'present');
      } catch (error) {
        console.error('Failed to check Blog Management override:', error);
        if (!cancelled) setOverrideStatus('absent');
      }
    };

    checkForAdminOverride();

    return () => {
      cancelled = true;
    };
  }, [slug, article]);

  if (!article) return <BlogPost />;

  if (overrideStatus === 'checking') {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // A Blog Management record is the source of truth whenever one exists.
  // This keeps the reader page, card image, editor content and publication state
  // synchronized. Static authority content is only a fallback until an admin
  // saves an override for that slug.
  return overrideStatus === 'present' ? <BlogPost /> : <StaticAuthorityArticle article={article} />;
}
