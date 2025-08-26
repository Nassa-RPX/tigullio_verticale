import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const date = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/appuntamenti" }),
})

const event = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/eventi" }),
})

// 4. Export a single `collections` object to register your collection(s)
export const collections = { event, date };
