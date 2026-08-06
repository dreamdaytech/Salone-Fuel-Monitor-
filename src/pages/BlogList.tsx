import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from '../firebase';
import { db } from '../firebase';
import { BlogPost } from '../types/blog';
import { useSEO } from '../hooks/useSEO';
import { Calendar, User, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function BlogList() {
  useSEO({
    title: 'Blog',
    description: 'Read the latest news, updates, and articles about fuel prices and market trends in Sierra Leone.'
  });

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, 'blog_posts'),
          where('isPublished', '==', true),
          orderBy('publishedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetchedPosts: BlogPost[] = [];
        snapshot.forEach(doc => {
          fetchedPosts.push({ id: doc.id, ...doc.data() } as BlogPost);
        });
        setPosts(fetchedPosts);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
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
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-6 tracking-tight">
            Latest <span className="text-primary">News & Updates</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Stay informed with the latest insights on fuel prices, market trends, and platform updates.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-surface-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">Check back later for new articles and updates.</p>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <Link 
              key={post.id} 
              to={`/blog/${post.slug}`}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
            >
              {/* Cover Image */}
              <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                {post.coverImage ? (
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-100">
                    <FileText className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {/* Overlay Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-surface-900 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                      {post.tags[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.publishedAt?.toDate ? post.publishedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
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
                      {post.authorName ? post.authorName.charAt(0) : 'A'}
                    </div>
                    {post.authorName || 'Admin'}
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
