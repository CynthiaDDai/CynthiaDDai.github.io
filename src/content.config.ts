import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const common = z.looseObject({
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  date: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  show_children: z.boolean().default(true),
  example: z.boolean().default(false),
  status: z.string().optional(),
  repo: z.url().optional(),
  demo: z.url().optional(),
  featured: z.boolean().default(false),
});

export const collections = {
  content: defineCollection({
    loader: glob({
      // Names starting with _ are kept out of the site; dotfiles are skipped by default.
      pattern: ['**/*.{md,mdx}', '!**/_*', '!**/_*/**'], base: process.env.SITE_CONTENT_DIR || './src/content',
      generateId: ({ entry }) => entry,
    }),
    schema: common,
  }),
};
