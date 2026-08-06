export interface Partner {
  id: string;
  name: string;
  logoUrl: string; // Base64 data URL
  websiteUrl?: string;
  order: number;
  createdAt: any; // Firestore Timestamp
}
