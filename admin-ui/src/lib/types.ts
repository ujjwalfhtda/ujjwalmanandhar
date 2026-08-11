export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface ImageItem {
  id: number;
  title: string;
  description: string;
  filename: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface VideoItem {
  id: number;
  title: string;
  description: string;
  filename: string;
  url: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface Paged<T> {
  items: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Stats {
  totalImages: number;
  totalVideos: number;
  totalUsers: number;
  lastImage: { title: string; created_at: string; url: string } | null;
  lastVideo: { title: string; created_at: string; url: string } | null;
  activity30d: number;
}

export interface ActivityItem {
  id: number;
  user_id: number | null;
  user_name?: string | null;
  action: string;
  entity: string;
  detail: string;
  created_at: string;
}

export interface ContentSections {
  [section: string]: { [field: string]: string };
}