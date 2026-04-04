import { db } from '@/lib/db';
import { users, userProfiles, socialPosts, likes, projects } from '@/db/schema';

// Sample quilter users
const QUILTERS = [
  {
    name: 'Sarah Stitches',
    email: 'sarah@example.com',
    username: 'sarahstitches',
    bio: 'Modern quilter | Color lover | Mom of 3',
  },
  {
    name: 'Martha Sewing',
    email: 'martha@example.com',
    username: 'marthamakes',
    bio: 'Traditional quilting since 1985 | Hand quilter',
  },
  {
    name: 'Jenny Blocks',
    email: 'jenny@example.com',
    username: 'jennyblocks',
    bio: 'Patchwork obsessed | Weekend warrior',
  },
  {
    name: 'Rita Patterns',
    email: 'rita@example.com',
    username: 'ritaquilts',
    bio: 'Longarm quilting services | Custom designs',
  },
  {
    name: 'Emily Threads',
    email: 'emily@example.com',
    username: 'emilythreads',
    bio: 'Modern improv quilter | Art quilts',
  },
  {
    name: 'Grace Needle',
    email: 'grace@example.com',
    username: 'graceneedle',
    bio: 'Hand quilting | Vintage lover | Slow stitching',
  },
  {
    name: 'Amy Fabric',
    email: 'amy@example.com',
    username: 'amyfabric',
    bio: 'Fabric hoarder | Scrap quilt queen',
  },
  {
    name: 'Lisa Patch',
    email: 'lisa@example.com',
    username: 'lisapatch',
    bio: 'Beginner quilter | Learning every day',
  },
];

// Feed posts with realistic images (using the new close-up and studio shots)
const FEED_POSTS = [
  {
    title: 'Just finished my churn dash quilt!',
    description:
      'Finally done with this blue and white beauty. Took me 3 months but worth every stitch! The binding was tricky but I managed. What do you all think?',
    image: '/images/quilts/quilt_01_closeup_churndash.png',
    category: 'show-and-tell',
    likes: 156,
  },
  {
    title: 'Close up of my stitching - getting better!',
    description:
      'Working on my stitch consistency. Still not perfect but much better than my first quilt. Practice makes progress!',
    image: '/images/quilts/quilt_02_closeup_stitches.png',
    category: 'wip',
    likes: 89,
  },
  {
    title: 'Scrappy quilt corner - using up all my scraps!',
    description:
      "This is what happens when you can't throw away fabric scraps! A chaotic but colorful quilt top.",
    image: '/images/quilts/quilt_03_closeup_scrappy.png',
    category: 'show-and-tell',
    likes: 234,
  },
  {
    title: "My grandmother's bear paw pattern",
    description:
      'Recreating a pattern my grandma used to make. The red and white is so classic. Missing her today.',
    image: '/images/quilts/quilt_04_closeup_bearpaw.png',
    category: 'show-and-tell',
    likes: 312,
  },
  {
    title: 'Hand stitching the binding - my favorite part',
    description:
      "There's something meditative about hand stitching binding. Watching Netflix and sewing = perfect evening.",
    image: '/images/quilts/quilt_05_closeup_binding.png',
    category: 'wip',
    likes: 67,
  },
  {
    title: 'Baby quilt for my niece!',
    description:
      'Pastel triangles for a sweet baby girl. Hope she loves it as much as I loved making it!',
    image: '/images/quilts/quilt_06_closeup_baby.png',
    category: 'show-and-tell',
    likes: 198,
  },
  {
    title: 'Modern improv - just went with the flow',
    description:
      'No pattern, just cutting and sewing. Navy and orange is such an underrated combo!',
    image: '/images/quilts/quilt_07_closeup_modern.png',
    category: 'show-and-tell',
    likes: 145,
  },
  {
    title: 'Log cabin blocks - slightly imperfect but loved',
    description:
      "My seams don't all match perfectly but that's what makes it handmade, right? Red centers with blue strips.",
    image: '/images/quilts/quilt_08_closeup_logcabin.png',
    category: 'show-and-tell',
    likes: 123,
  },
  {
    title: 'Found this vintage hexagon quilt at a thrift store',
    description:
      "1930s reproduction fabrics, hand stitched. Someone spent hours on this. Now it's my treasure.",
    image: '/images/quilts/quilt_09_closeup_vintage.png',
    category: 'inspiration',
    likes: 456,
  },
  {
    title: 'Star quilt detail shot',
    description:
      "Gray, white, and yellow - neutral but interesting. This one's going on my guest bed.",
    image: '/images/quilts/quilt_10_closeup_star.png',
    category: 'show-and-tell',
    likes: 78,
  },
  // Studio/work-in-progress shots
  {
    title: 'Layout day!',
    description:
      'Spreading out the quilt top on my cutting mat to check the layout. Messy table = creative mind, right?',
    image: '/images/quilts/quilt_11_table_layout.png',
    category: 'wip',
    likes: 92,
  },
  {
    title: 'Design wall is full!',
    description:
      'Finally organized enough to have a design wall. Game changer for visualizing blocks!',
    image: '/images/quilts/quilt_12_studio_designwall.png',
    category: 'wip',
    likes: 267,
  },
  {
    title: 'Evening hand quilting session',
    description: 'Hoop in lap, tea nearby, podcast on. This is my happy place.',
    image: '/images/quilts/quilt_13_hoop_lap.png',
    category: 'wip',
    likes: 134,
  },
  {
    title: 'Basting day - dining room table takeover',
    description:
      'When you need a big flat surface, the dining table becomes the quilting station. Family knows not to disturb!',
    image: '/images/quilts/quilt_14_table_basting.png',
    category: 'wip',
    likes: 189,
  },
  {
    title: 'Piecing station chaos',
    description:
      "Half-square triangles everywhere! My sewing room is a disaster but I'm in the zone.",
    image: '/images/quilts/quilt_15_table_piecing.png',
    category: 'wip',
    likes: 112,
  },
  {
    title: 'Took my quilt to the longarm studio',
    description:
      "Finally invested in professional quilting for this big one. Can't wait to see the finished result!",
    image: '/images/quilts/quilt_16_longarm_studio.png',
    category: 'show-and-tell',
    likes: 223,
  },
  {
    title: 'Floor basting - my back hurts already',
    description: 'Pinning layers on the living room floor. Yoga first would have been smart. Ouch.',
    image: '/images/quilts/quilt_17_floor_basting.png',
    category: 'wip',
    likes: 87,
  },
  {
    title: 'My sewing room wall',
    description:
      'Hung up my first wall quilt! Surrounded by fabric swatches and tools. This is my sanctuary.',
    image: '/images/quilts/quilt_18_wall_studio.png',
    category: 'show-and-tell',
    likes: 178,
  },
  {
    title: 'Quilt tops waiting their turn',
    description:
      'Anyone else have a stack of quilt tops waiting to be quilted? My to-do list is getting long...',
    image: '/images/quilts/quilt_19_shelf_stacked.png',
    category: 'general',
    likes: 345,
  },
  {
    title: 'Binding while binge-watching',
    description:
      'Best way to finish a quilt: cozy chair, good show, hand stitching. Perfect Sunday.',
    image: '/images/quilts/quilt_20_chair_binding.png',
    category: 'wip',
    likes: 156,
  },
  // Lifestyle shots
  {
    title: 'Real quilt life - unmade bed',
    description:
      'No styled photos here - this is how it actually looks when you use your quilts every day!',
    image: '/images/quilts/quilt_21_bed_unmade.png',
    category: 'general',
    likes: 234,
  },
  {
    title: 'Hanging on the porch railing',
    description:
      'Best way to photograph a quilt? Natural light + outdoor breeze = gorgeous draping.',
    image: '/images/quilts/quilt_22_porch_railing.png',
    category: 'show-and-tell',
    likes: 189,
  },
  {
    title: "Baby's first quilt - well loved already!",
    description:
      "Made this for my daughter 6 months ago. It's been washed 20 times and played on daily. Best compliment ever.",
    image: '/images/quilts/quilt_23_nursery_floor.png',
    category: 'show-and-tell',
    likes: 412,
  },
  {
    title: 'Casual couch quilt',
    description: 'This one lives on the sofa for movie nights. Functional art is the best art.',
    image: '/images/quilts/quilt_24_sofa_casual.png',
    category: 'general',
    likes: 167,
  },
  {
    title: 'Picnic quilt in action',
    description: 'Took my quilt outside for lunch today. Grass stains add character, right?',
    image: '/images/quilts/quilt_25_grass_picnic.png',
    category: 'general',
    likes: 98,
  },
];

// Blog posts are seeded separately via seed-blog.ts / blog-seed.ts.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function seedContent() {
  console.log('🧵 Starting content seeding...\n');

  // Create users
  console.log('Creating quilter users...');
  const createdUsers = [];
  for (const quilter of QUILTERS) {
    const [user] = await db
      .insert(users)
      .values({
        name: quilter.name,
        email: quilter.email,
        image: `https://i.pravatar.cc/150?u=${quilter.username}`,
      })
      .onConflictDoNothing()
      .returning();

    if (user) {
      await db
        .insert(userProfiles)
        .values({
          userId: user.id,
          displayName: quilter.name,
          username: quilter.username,
          bio: quilter.bio,
          avatarUrl: `https://i.pravatar.cc/150?u=${quilter.username}`,
        })
        .onConflictDoNothing();
      createdUsers.push(user);
    }
  }
  console.log(`✅ Created ${createdUsers.length} users\n`);

  // Get existing users for posts
  const allUsers = await db.select().from(users).limit(20);
  if (allUsers.length === 0) {
    console.error('❌ No users found. Cannot create posts.');
    return;
  }

  // Create projects for community posts
  console.log('Creating projects for community posts...');
  const createdProjects = [];
  for (let i = 0; i < FEED_POSTS.length; i++) {
    const post = FEED_POSTS[i];
    const user = allUsers[i % allUsers.length];

    const [project] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name: post.title,
        description: post.description,
        thumbnailUrl: post.image,
        isPublic: true,
      })
      .returning();

    createdProjects.push(project);
  }
  console.log(`✅ Created ${createdProjects.length} projects\n`);

  // Create community posts
  console.log('Creating community posts...');
  const createdPosts = [];
  for (let i = 0; i < FEED_POSTS.length; i++) {
    const post = FEED_POSTS[i];
    const user = allUsers[i % allUsers.length];
    const project = createdProjects[i];

    const [communityPost] = await db
      .insert(socialPosts)
      .values({
        userId: user.id,
        projectId: project.id,
        title: post.title,
        description: post.description,
        thumbnailUrl: post.image,
        likeCount: post.likes,
        category: post.category as 'show-and-tell' | 'wip' | 'help' | 'inspiration' | 'general',
      })
      .returning();

    createdPosts.push(communityPost);
  }
  console.log(`✅ Created ${createdPosts.length} community posts\n`);

  // Create likes for posts
  console.log('Creating likes for engagement...');
  for (const post of createdPosts) {
    // Add likes from random users using Fisher-Yates shuffle for unbiased randomization
    const numLikes = Math.min(post.likeCount, allUsers.length);
    const shuffledUsers = [...allUsers];
    for (let i = shuffledUsers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledUsers[i], shuffledUsers[j]] = [shuffledUsers[j], shuffledUsers[i]];
    }

    for (let i = 0; i < numLikes; i++) {
      await db
        .insert(likes)
        .values({
          userId: shuffledUsers[i].id,
          communityPostId: post.id,
        })
        .onConflictDoNothing();
    }
  }
  console.log(`✅ Added likes to posts\n`);

  // Blog posts are seeded separately via `npm run db:seed:blog` (seed-blog.ts)

  console.log('🎉 Content seeding complete!');
  console.log('\nSummary:');
  console.log(`- ${createdUsers.length} quilter users`);
  console.log(`- ${createdPosts.length} community posts`);
}

// Only run when executed directly, not when imported
const isDirectRun =
  process.argv[1]?.endsWith('seed-community-content.ts') ||
  process.argv[1]?.endsWith('seed-community-content.js');

if (isDirectRun) {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed scripts cannot run in production. Aborting.');
    process.exit(1);
  }
  seedContent().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}

export { seedContent };
