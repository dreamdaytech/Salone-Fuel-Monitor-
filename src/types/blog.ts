export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown or HTML
  coverImage?: string;
  authorId: string;
  authorName: string;
  isPublished: boolean;
  publishedAt: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  views?: number;
}
