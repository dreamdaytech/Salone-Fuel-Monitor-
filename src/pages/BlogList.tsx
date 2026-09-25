import React, { useState, useEffect } from 'react';
import { collection, getDocs } from '../firebase';
import { db } from '../firebase';
import { BlogPost } from '../types/blog';
import { useSEO } from '../hooks/useSEO';
import { Calendar, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STATIC_CONTENT_ARTICLES } from '../../content-articles-runtime.js';

function toMillis(value: any) {
  try {
    if (value?.toDate) return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  } catch {
    return 0;
  }
}

function formatDate(value: any) {
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Recently'
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function BlogList() {
  useSEO({
    title: 'Sierra Leone Fuel News & Analysis',
    description: 'Read Sierra Leone fuel-price news, market analysis, regional comparisons and explainers from Salone Fuel Monitor.',
    url: 'https://salonefuelmonitor.com/blog',
    keywords: 'Sierra Leone fuel news, fuel price Sierra Leone, petrol price news Sierra Leone, diesel price Sierra Leone, West Africa fuel prices'
  });

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const staticPosts = STATIC_CONTENT_ARTICLES as unknown as BlogPost[];

      try {
        // Read every Blog Management record so an admin override remains
        // authoritative even when it is unpublished. Only published records are
        // displayed, but any matching slug suppresses the static fallback.
        const snapshot = await getDocs(collection(db, 'blog_posts'));
        const allFirestorePosts: BlogPost[] = [];
        snapshot.forEach(document => {
          allFirestorePosts.push({ id: document.id, ...document.data() } as BlogPost);
        });

        const firestoreSlugs = new Set(allFirestorePosts.map((post) => post.slug));
        const publishedFirestorePosts = allFirestorePosts.filter((post) => post.isPublished);
        const mergedPosts = [
          ...publishedFirestorePosts,
          ...staticPosts.filter((post) => !firestoreSlugs.has(post.slug)),
        ].sort((a, b) => toMillis(b.publishedAt) - toMillis(a.publishedAt));

        setPosts(mergedPosts);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setPosts([...staticPosts].sort((a, b) => toMillis(b.publishedAt) - toMillis(a.publishedAt)));
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      <div className="flex-1 py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-6 tracking-tight">
              Sierra Leone <span className="text-primary">Fuel News & Analysis</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Stay informed with fuel-price updates, market analysis, regional comparisons and explainers focused on Sierra Leone and West Africa.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-surface-900 mb-2">No posts yet</h3>
              <p className="text-gray-500">Check back later for new articles and updates.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <Link
                key={post.id || post.slug}
                to={`/blog/${post.slug}`}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-100">
                      <FileText className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-surface-900 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                        {post.tags[0]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(post.publishedAt)}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-surface-900 mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">
                    {post.excerpt || post.content.substring(0, 150).replace(/[#*`_]/g, '') + '...'}
                  </p>

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-sm font-semibold text-surface-900">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                        {post.authorName ? post.authorName.charAt(0) : 'S'}
                      </div>
                      {post.authorName || 'Salone Fuel Monitor'}
                    </div>
                    <div className="text-primary font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
