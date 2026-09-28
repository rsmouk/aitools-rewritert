import type { ArticleDraft } from "@/types";

export const DRAFT_STORAGE_KEY = "ai-writer-draft";

export function emptyDraft(): ArticleDraft {
  return {
    title: "",
    description: "",
    slug: "",
    content: "",
    categories: [],
    tags: [],
    featuredImage: null,
    featured_image_url: null,
    wp_post_id: null,
    changes_summary: [],
  };
}
