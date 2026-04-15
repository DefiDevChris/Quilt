/**
 * Seed script for blog posts.
 * Run with: npx tsx src/db/seed/seed-blog.ts
 */

import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { blogSeedPosts } from './blog-seed';
import { eq } from 'drizzle-orm';

async function seedBlogPosts() {
  console.log('🌱 Seeding blog posts...\n');

  // Check if we have an admin user, if not create a system user
  const adminUser = await db.query.users.findFirst({
    where: eq(users.role, 'admin'),
  });

  let systemUserId: string;

  if (adminUser) {
    console.log(`Using existing admin user: ${adminUser.email}`);
    systemUserId = adminUser.id;
  } else {
    // Create a system user for blog posts - don't fall back to random users
    console.log('No admin user found. Creating system user for blog posts...');
    const [newUser] = await db
      .insert(users)
      .values({
        name: 'QuiltCorgi Team',
        email: 'team@quiltcorgi.com',
        role: 'admin',
      })
      .returning();

    systemUserId = newUser.id;
    console.log(`Created system user: ${newUser.email} (${newUser.id})`);

    // Create user profile
    await db.insert(userProfiles).values({
      userId: newUser.id,
      displayName: 'QuiltCorgi Team',
    });
    console.log('Created user profile\n');
  }

  // Check for existing posts
  const existingPosts = await db.query.blogPosts.findMany({
    columns: { slug: true },
  });
  const existingSlugs = new Set(existingPosts.map((p) => p.slug));

  let inserted = 0;
  let skipped = 0;

  for (const post of blogSeedPosts) {
    if (existingSlugs.has(post.slug)) {
      console.log(`⏭️  Skipping: "${post.title}" (already exists)`);
      skipped++;
      continue;
    }

    await db.insert(blogPosts).values({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      tags: post.tags,
      status: post.status,
      publishedAt: post.publishedAt,
      authorId: systemUserId,
    });

    console.log(`✅ Inserted: "${post.title}"`);
    inserted++;
  }

  console.log(`\n🎉 Done! Inserted ${inserted} posts, skipped ${skipped} posts.`);
  process.exit(0);
}

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Seed scripts cannot run in production. Aborting.');
  process.exit(1);
}

seedBlogPosts().catch((error) => {
  console.error('❌ Failed to seed blog posts:', error);
  process.exit(1);
});
