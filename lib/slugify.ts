import slugify from "slugify";

const ARABIC_BLOCKS = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

export function toSlug(input: string) {
  const latin = input.replace(ARABIC_BLOCKS, " ").replace(/\s+/g, " ").trim();
  return slugify(latin, { lower: true, strict: true, trim: true });
}
