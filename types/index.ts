export type TemplateType = "writing" | "checking";
export type ArticleStatus = "draft" | "published" | "saved";
export type ProviderId = "openai" | "gemini" | "openrouter";

export type InstructionTemplate = {
  id: string;
  name: string;
  type: TemplateType;
  content: string;
  created_at: string;
};

export type GeneratedArticle = {
  id: string;
  title: string;
  description: string;
  slug: string;
  content: string;
  categories: string[];
  tags: string[];
  featured_image_url: string | null;
  wp_post_id: number | null;
  status: ArticleStatus;
  created_at: string;
};

export type FeaturedImage = {
  base64: string;
  filename: string;
  alt: string;
  description: string;
  previewUrl: string;
};

export type ArticleDraft = {
  id?: string;
  title: string;
  description: string;
  slug: string;
  content: string;
  categories: string[];
  tags: string[];
  featuredImage: FeaturedImage | null;
  featured_image_url?: string | null;
  wp_post_id?: number | null;
  changes_summary?: string[];
};

export type AIArticleResponse = {
  title: string;
  description: string;
  slug: string;
  content: string;
  suggested_categories: string[];
  suggested_tags: string[];
  changes_summary: string[];
};

export type WpTerm = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

export type WpPostSummary = {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  categories: string[];
  tags: string[];
  content: string;
  status?: string;
};

export type WpPostList = {
  posts: WpPostSummary[];
  total: number;
  total_pages: number;
  page: number;
};

export type SettingsView = {
  wp_site_url: string;
  openai_api_key_set: boolean;
  gemini_api_key_set: boolean;
  openrouter_api_key_set: boolean;
  wp_api_key_set: boolean;
  admin_password_set: boolean;
};

export type AIModelOption = {
  id: string;
  label: string;
  provider: ProviderId;
  free?: boolean;
};
