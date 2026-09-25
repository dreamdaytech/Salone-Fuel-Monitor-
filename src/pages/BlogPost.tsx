import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, updateDoc, increment, orderBy } from '../firebase';
import { db } from '../firebase';
import { BlogPost as BlogPostType } from '../types/blog';
import { useSEO } from '../hooks/useSEO';
import { Calendar, ArrowLeft, Tag, Share2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { trackBlogRead } from '../hooks/useAnalytics';

const SITE_URL = 'https://salonefuelmonitor.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function timestampToIso(value: any) {
  try {
    if (value?.toDate) return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function getSocialImageUrl(coverImage?: string, slug?: string) {
  if (!coverImage) return DEFAULT_OG_IMAGE;
  if (coverImage.startsWith('data:')) {
    return slug ? `${SITE_URL}/api/blog-image/${encodeURIComponent(slug)}` : DEFAULT_OG_IMAGE;
  }
  if (/^https?:\/\//i.test(coverImage)) return coverImage;
  return `${SITE_URL}${coverImage.startsWith('/') ? coverImage : `/${coverImage}`}`;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [recommendedPosts, setRecommendedPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      
      try {
        const q = query(
          collection(db, 'blog_posts'),
          where('slug', '==', slug),
          limit(1)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setPost(null);
        } else {
          const docData = snapshot.docs[0];
          const postData = { id: docData.id, ...docData.data() } as BlogPostType;
          setPost(postData);

          trackBlogRead(slug || '', postData.title || 'Untitled');
          
          const viewedKey = `viewed_post_${docData.id}`;
          if (!sessionStorage.getItem(viewedKey)) {
            try {
              const postRef = doc(db, 'blog_posts', docData.id);
              await updateDoc(postRef, {
                views: increment(1)
              });
              sessionStorage.setItem(viewedKey, 'true');
            } catch (updateErr) {
              console.error('Error updating views:', updateErr);
            }
          }

          try {
            const recQ = query(
              collection(db, 'blog_posts'),
              where('isPublished', '==', true),
              orderBy('publishedAt', 'desc'),
              limit(4)
            );
            const recSnap = await getDocs(recQ);
            const recs = recSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as BlogPostType))
              .filter(p => p.id !== docData.id)
              .slice(0, 3);
            setRecommendedPosts(recs);
          } catch (recErr) {
            console.error('Error fetching recommendations:', recErr);
          }
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };

    fetchPost();
  }, [slug]);

  const canonicalUrl = `${SITE_URL}/blog/${slug || ''}`;
  const notFound = !loading && (!post || !post.isPublished);
  const publishedAt = timestampToIso(post?.publishedAt);
  const modifiedAt = timestampToIso(post?.updatedAt) || publishedAt;
  const socialImage = getSocialImageUrl(post?.coverImage, slug);

  const articleSchema = post?.isPublished ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seoDescription || post.excerpt || '',
    image: socialImage,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(modifiedAt ? { dateModified: modifiedAt } : {}),
    author: {
      '@type': 'Person',
      name: post.authorName || 'Salone Fuel Monitor',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Salone Fuel Monitor',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  } : undefined;

  useSEO({
    title: notFound ? 'Article Not Found' : (post?.seoTitle || post?.title || 'Sierra Leone Fuel News & Analysis'),
    description: notFound
      ? 'The requested Salone Fuel Monitor article could not be found.'
      : (post?.seoDescription || post?.excerpt || 'Read Sierra Leone fuel-price news, market analysis, regional comparisons and explainers from Salone Fuel Monitor.'),
    image: socialImage,
    type: 'article',
    url: canonicalUrl,
    robots: notFound ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    keywords: post?.tags?.join(', '),
    jsonLd: articleSchema,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post || !post.isPublished) {
    return (
      <div className="min-h-screen bg-surface-50 py-20 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
          <span className="text-4xl text-gray-400">404</span>
        </div>
        <h1 className="text-3xl font-black text-surface-900 mb-4">Post Not Found</h1>
        <p className="text-gray-500 max-w-md mb-8">
          The article you're looking for doesn't exist or has been removed.
        </p>
        <button 
          onClick={() => navigate('/blog')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Blog
        </button>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: canonicalUrl,
        });
      } catch (err) {
        console.log('Share cancelled', err);
      }
    } else {
      navigator.clipboard.writeText(canonicalUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-surface-50 border-b border-gray-100 py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all posts
          </button>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {post.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-surface-900 mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl md:text-2xl text-gray-500 mb-8 leading-relaxed max-w-3xl">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {post.authorName ? post.authorName.charAt(0) : 'A'}
              </div>
              <div>
                <div className="font-bold text-surface-900">{post.authorName || 'Admin'}</div>
                <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> 
                  {post.publishedAt?.toDate ? post.publishedAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleShare}
              className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl shadow-sm hover:border-primary hover:text-primary transition-colors"
              title="Share this post"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {post.coverImage && (
        <div className="max-w-5xl mx-auto px-4 -mt-10 md:-mt-16 mb-12 relative z-10">
          <img 
            src={post.coverImage} 
            alt={`${post.title} featured image`}
            className="w-full aspect-[2/1] md:aspect-[21/9] object-contain rounded-[2rem] shadow-2xl border-4 border-white bg-white"
            loading="eager"
            fetchPriority="high"
            onError={(event) => {
              const image = event.currentTarget;
              if (image.dataset.fallbackApplied === 'true') return;
              image.dataset.fallbackApplied = 'true';
              image.src = DEFAULT_OG_IMAGE;
            }}
          />
        </div>
      )}

      <main className={`max-w-3xl mx-auto px-4 pb-24 ${!post.coverImage ? 'pt-12' : ''}`}>
        <article 
          className="blog-content text-surface-900 text-lg leading-relaxed max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </main>

      {recommendedPosts.length > 0 && (
        <section className="bg-surface-50 py-16 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <h3 className="text-2xl font-black text-surface-900 mb-8">More To Explore</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedPosts.map(rec => (
                <Link 
                  key={rec.id} 
                  to={`/blog/${rec.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {rec.coverImage ? (
                      <img 
                        src={rec.coverImage} 
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                        <Tag className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {rec.publishedAt?.toDate ? rec.publishedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                    </div>
                    <h4 className="text-lg font-bold text-surface-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {rec.title}
                    </h4>
                    <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-500">
                        {rec.authorName || 'Admin'}
                      </div>
                      <div className="text-primary font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
