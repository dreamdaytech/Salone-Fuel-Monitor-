import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from '../firebase';
import { db } from '../firebase';
import { BlogPost as BlogPostType } from '../types/blog';
import { useSEO } from '../hooks/useSEO';
import { Calendar, User, ArrowLeft, Tag, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
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
          setPost({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BlogPostType);
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Hook handles SEO updates dynamically
  useSEO({
    title: post?.seoTitle || post?.title || 'Loading...',
    description: post?.seoDescription || post?.excerpt || ''
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
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Article Header */}
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
                {post.authorName.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-surface-900">{post.authorName}</div>
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

      {/* Cover Image */}
      {post.coverImage && (
        <div className="max-w-5xl mx-auto px-4 -mt-10 md:-mt-16 mb-12 relative z-10">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full aspect-[2/1] md:aspect-[21/9] object-cover rounded-[2rem] shadow-2xl border-4 border-white bg-gray-100"
          />
        </div>
      )}

      {/* Article Body */}
      <main className={`max-w-3xl mx-auto px-4 pb-24 ${!post.coverImage ? 'pt-12' : ''}`}>
        <article 
          className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-surface-900 prose-a:text-primary prose-img:rounded-2xl"
          // We use dangerouslySetInnerHTML to render HTML content that admins provide.
          // Since only trusted admins can create posts, this is safe.
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </main>
    </div>
  );
}
