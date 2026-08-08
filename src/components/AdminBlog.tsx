import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from '../firebase';
import { db } from '../firebase';
import { BlogPost } from '../types/blog';
import { useEditor, EditorContent } from '@tiptap/react';
import ImageExtension from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code2, List, ListOrdered,
  Quote, Minus, Link as LinkIcon, Unlink, Undo, Redo,
  Heading1, Heading2, Heading3,
  Plus, Edit2, Trash2, CheckCircle, XCircle, Search, Save, X, Eye, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const ToolBtn = ({ onClick, active, disabled, children, title }: {
  onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title?: string;
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`p-1.5 rounded text-sm font-medium transition-colors ${active ? 'bg-primary/20 text-primary' : 'text-gray-600 hover:bg-gray-200'} disabled:opacity-30 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-gray-300 mx-0.5 self-center" />;

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5 rounded-t-lg sticky top-0 z-10 shadow-sm">
      {/* Headings */}
      <ToolBtn title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}><Heading1 className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}><Heading2 className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}><Heading3 className="w-4 h-4" /></ToolBtn>
      <Divider />
      {/* Text styles */}
      <ToolBtn title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><UnderlineIcon className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}><Strikethrough className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Inline Code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}><Code2 className="w-4 h-4" /></ToolBtn>
      <Divider />
      {/* Lists */}
      <ToolBtn title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}><Quote className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-4 h-4" /></ToolBtn>
      <Divider />
      {/* Links */}
      <ToolBtn title="Add Link" onClick={setLink} active={editor.isActive('link')}><LinkIcon className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}><Unlink className="w-4 h-4" /></ToolBtn>
      
      <label 
        className="cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20" 
        title="Insert Image into content"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>Insert Image</span>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
              toast.error('Image must be less than 5MB');
              return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > 800) { height *= 800 / width; width = 800; } }
                else { if (height > 800) { width *= 800 / height; height = 800; } }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  editor.chain().focus().setImage({ src: canvas.toDataURL('image/webp', 0.8) }).run();
                  toast.success('Image inserted!');
                }
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
            e.target.value = '';
          }} 
        />
      </label>

      <Divider />
      {/* History */}
      <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="w-4 h-4" /></ToolBtn>
      <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="w-4 h-4" /></ToolBtn>
    </div>
  );
};

const TiptapEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({ inline: false, allowBase64: true }),
      UnderlineExtension,
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline cursor-pointer', rel: 'noopener noreferrer', target: '_blank' } })
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4'
      }
    }
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <MenuBar editor={editor} />
      <div className="bg-surface-50 overflow-y-auto max-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default function AdminBlog() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<BlogPost> | null>(null);
  const [customDate, setCustomDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{id: string, title: string} | null>(null);

  // Load posts
  useEffect(() => {
    const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data: BlogPost[] = [];
      snap.forEach(d => {
        data.push({ id: d.id, ...d.data() } as BlogPost);
      });
      setPosts(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to load blog posts');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddNew = () => {
    setEditForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      isPublished: false,
      tags: [],
      seoTitle: '',
      seoDescription: ''
    });
    setCustomDate('');
    setIsEditing(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditForm(post);
    if (post.publishedAt?.toDate) {
      const d = post.publishedAt.toDate();
      setCustomDate(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16));
    } else {
      setCustomDate('');
    }
    setIsEditing(true);
  };

  const handleDelete = (id: string, title: string) => {
    setPostToDelete({ id, title });
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, 'blog_posts', postToDelete.id));
      toast.success('Post deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete post');
    } finally {
      setPostToDelete(null);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setEditForm(prev => {
      if (!prev) return prev;
      // Auto-generate slug if it's a new post and slug hasn't been manually edited heavily
      if (!prev.id && (!prev.slug || prev.slug === generateSlug(prev.title || ''))) {
        return { ...prev, title, slug: generateSlug(title) };
      }
      return { ...prev, title };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.82);
          setEditForm(prev => prev ? { ...prev, coverImage: dataUrl } : prev);
          toast.success('Cover image ready!');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm || !editForm.title || !editForm.slug || !editForm.content) {
      toast.error('Title, slug, and content are required');
      return;
    }

    setIsSaving(true);
    try {
      const isNew = !editForm.id;
      const docRef = isNew ? doc(collection(db, 'blog_posts')) : doc(db, 'blog_posts', editForm.id!);
      
      const payload: any = {
        title: editForm.title,
        slug: editForm.slug,
        excerpt: editForm.excerpt || '',
        content: editForm.content,
        coverImage: editForm.coverImage || '',
        isPublished: editForm.isPublished || false,
        tags: editForm.tags || [],
        seoTitle: editForm.seoTitle || editForm.title,
        seoDescription: editForm.seoDescription || editForm.excerpt || '',
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        payload.createdAt = serverTimestamp();
        payload.authorId = profile?.uid || 'unknown';
        payload.authorName = profile?.name || 'Admin';
      }

      if (editForm.isPublished) {
        if (customDate) {
          payload.publishedAt = new Date(customDate);
        } else if (!editForm.publishedAt) {
          payload.publishedAt = serverTimestamp();
        } else {
          payload.publishedAt = editForm.publishedAt;
        }
      } else {
        payload.publishedAt = null;
      }

      await setDoc(docRef, payload, { merge: true });
      toast.success(`Post ${isNew ? 'created' : 'updated'} successfully`);
      setIsEditing(false);
      setEditForm(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isEditing && editForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-xl font-bold text-surface-900">{editForm.id ? 'Edit Post' : 'Create New Post'}</h2>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Post'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-surface-900">Post Title *</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={handleTitleChange}
                className="w-full px-4 py-2 bg-surface-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter post title..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-surface-900">URL Slug *</label>
              <input
                type="text"
                value={editForm.slug || ''}
                onChange={e => setEditForm({ ...editForm, slug: e.target.value })}
                className="w-full px-4 py-2 bg-surface-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="url-friendly-slug"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-surface-900">Featured Image</label>
              <div className="flex items-center gap-4">
                {editForm.coverImage ? (
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img src={editForm.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, coverImage: '' })}
                      className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white text-red-500 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="cover-upload"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="cover-upload"
                      className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Image</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-surface-900">Excerpt (Short Summary)</label>
            <textarea
              value={editForm.excerpt || ''}
              onChange={e => setEditForm({ ...editForm, excerpt: e.target.value })}
              className="w-full px-4 py-2 bg-surface-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              rows={3}
              placeholder="A brief summary of the post..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-surface-900 flex justify-between items-center">
              <span>Content *</span>
            </label>
            <div className="prose-editor">
              <TiptapEditor
                value={editForm.content || ''}
                onChange={(content) => setEditForm({ ...editForm, content })}
              />
            </div>
          </div>

          {/* SEO Settings */}
          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-lg font-bold text-surface-900 mb-4">SEO & Publishing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-surface-900">SEO Title</label>
                <input
                  type="text"
                  value={editForm.seoTitle || ''}
                  onChange={e => setEditForm({ ...editForm, seoTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Defaults to Post Title if empty"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-surface-900">SEO Description</label>
                <input
                  type="text"
                  value={editForm.seoDescription || ''}
                  onChange={e => setEditForm({ ...editForm, seoDescription: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Defaults to Excerpt if empty"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-surface-900">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editForm.tags?.join(', ') || ''}
                  onChange={e => setEditForm({ ...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full px-4 py-2 bg-surface-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. fuel, economy, update"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isPublished || false}
                  onChange={e => setEditForm({ ...editForm, isPublished: e.target.checked })}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
                <span className="font-semibold text-surface-900">Publish Post</span>
              </label>

              {editForm.isPublished && (
                <div className="pl-7 space-y-2">
                  <label className="text-sm font-semibold text-surface-900">Publication Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-gray-500">Leave empty to use current time, or pick a past/future date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-surface-900">Blog Management</h2>
          <p className="text-sm text-gray-500">Create and manage SEO-friendly blog posts</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>New Post</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Post</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Views</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading posts...
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No posts found. Create your first blog post!
                  </td>
                </tr>
              ) : (
                filteredPosts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-surface-900 mb-1">{post.title}</div>
                      <div className="text-xs text-gray-500 font-mono">/{post.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                          <XCircle className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-surface-900">
                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                      <div className="text-xs text-gray-500">by {post.authorName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-surface-900">{post.views || 0}</div>
                      <div className="text-xs text-gray-500">views</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {post.isPublished && (
                          <Link 
                            to={`/blog/${post.slug}`} 
                            target="_blank" 
                            rel="noreferrer"
                            title="View Post"
                            className="p-2 text-gray-400 hover:text-primary hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleEdit(post)}
                          title="Edit"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          title="Delete"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-surface-900 mb-2">Delete Post?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the post "{postToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 text-surface-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
