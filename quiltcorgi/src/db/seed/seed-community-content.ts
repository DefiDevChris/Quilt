import { db } from '@/lib/db';
import { users, userProfiles, communityPosts, likes, projects } from '@/db/schema';

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
    isFeatured: true,
  },
  {
    title: 'Close up of my stitching - getting better!',
    description:
      'Working on my stitch consistency. Still not perfect but much better than my first quilt. Practice makes progress!',
    image: '/images/quilts/quilt_02_closeup_stitches.png',
    category: 'wip',
    likes: 89,
    isFeatured: false,
  },
  {
    title: 'Scrappy quilt corner - using up all my scraps!',
    description:
      "This is what happens when you can't throw away fabric scraps! A chaotic but colorful quilt top.",
    image: '/images/quilts/quilt_03_closeup_scrappy.png',
    category: 'show-and-tell',
    likes: 234,
    isFeatured: true,
  },
  {
    title: "My grandmother's bear paw pattern",
    description:
      'Recreating a pattern my grandma used to make. The red and white is so classic. Missing her today.',
    image: '/images/quilts/quilt_04_closeup_bearpaw.png',
    category: 'show-and-tell',
    likes: 312,
    isFeatured: true,
  },
  {
    title: 'Hand stitching the binding - my favorite part',
    description:
      "There's something meditative about hand stitching binding. Watching Netflix and sewing = perfect evening.",
    image: '/images/quilts/quilt_05_closeup_binding.png',
    category: 'wip',
    likes: 67,
    isFeatured: false,
  },
  {
    title: 'Baby quilt for my niece!',
    description:
      'Pastel triangles for a sweet baby girl. Hope she loves it as much as I loved making it!',
    image: '/images/quilts/quilt_06_closeup_baby.png',
    category: 'show-and-tell',
    likes: 198,
    isFeatured: true,
  },
  {
    title: 'Modern improv - just went with the flow',
    description:
      'No pattern, just cutting and sewing. Navy and orange is such an underrated combo!',
    image: '/images/quilts/quilt_07_closeup_modern.png',
    category: 'show-and-tell',
    likes: 145,
    isFeatured: false,
  },
  {
    title: 'Log cabin blocks - slightly imperfect but loved',
    description:
      "My seams don't all match perfectly but that's what makes it handmade, right? Red centers with blue strips.",
    image: '/images/quilts/quilt_08_closeup_logcabin.png',
    category: 'show-and-tell',
    likes: 123,
    isFeatured: false,
  },
  {
    title: 'Found this vintage hexagon quilt at a thrift store',
    description:
      "1930s reproduction fabrics, hand stitched. Someone spent hours on this. Now it's my treasure.",
    image: '/images/quilts/quilt_09_closeup_vintage.png',
    category: 'inspiration',
    likes: 456,
    isFeatured: true,
  },
  {
    title: 'Star quilt detail shot',
    description:
      "Gray, white, and yellow - neutral but interesting. This one's going on my guest bed.",
    image: '/images/quilts/quilt_10_closeup_star.png',
    category: 'show-and-tell',
    likes: 78,
    isFeatured: false,
  },
  // Studio/work-in-progress shots
  {
    title: 'Layout day!',
    description:
      'Spreading out the quilt top on my cutting mat to check the layout. Messy table = creative mind, right?',
    image: '/images/quilts/quilt_11_table_layout.png',
    category: 'wip',
    likes: 92,
    isFeatured: false,
  },
  {
    title: 'Design wall is full!',
    description:
      'Finally organized enough to have a design wall. Game changer for visualizing blocks!',
    image: '/images/quilts/quilt_12_studio_designwall.png',
    category: 'wip',
    likes: 267,
    isFeatured: true,
  },
  {
    title: 'Evening hand quilting session',
    description: 'Hoop in lap, tea nearby, podcast on. This is my happy place.',
    image: '/images/quilts/quilt_13_hoop_lap.png',
    category: 'wip',
    likes: 134,
    isFeatured: false,
  },
  {
    title: 'Basting day - dining room table takeover',
    description:
      'When you need a big flat surface, the dining table becomes the quilting station. Family knows not to disturb!',
    image: '/images/quilts/quilt_14_table_basting.png',
    category: 'wip',
    likes: 189,
    isFeatured: true,
  },
  {
    title: 'Piecing station chaos',
    description:
      "Half-square triangles everywhere! My sewing room is a disaster but I'm in the zone.",
    image: '/images/quilts/quilt_15_table_piecing.png',
    category: 'wip',
    likes: 112,
    isFeatured: false,
  },
  {
    title: 'Took my quilt to the longarm studio',
    description:
      "Finally invested in professional quilting for this big one. Can't wait to see the finished result!",
    image: '/images/quilts/quilt_16_longarm_studio.png',
    category: 'show-and-tell',
    likes: 223,
    isFeatured: true,
  },
  {
    title: 'Floor basting - my back hurts already',
    description: 'Pinning layers on the living room floor. Yoga first would have been smart. Ouch.',
    image: '/images/quilts/quilt_17_floor_basting.png',
    category: 'wip',
    likes: 87,
    isFeatured: false,
  },
  {
    title: 'My sewing room wall',
    description:
      'Hung up my first wall quilt! Surrounded by fabric swatches and tools. This is my sanctuary.',
    image: '/images/quilts/quilt_18_wall_studio.png',
    category: 'show-and-tell',
    likes: 178,
    isFeatured: false,
  },
  {
    title: 'Quilt tops waiting their turn',
    description:
      'Anyone else have a stack of quilt tops waiting to be quilted? My to-do list is getting long...',
    image: '/images/quilts/quilt_19_shelf_stacked.png',
    category: 'general',
    likes: 345,
    isFeatured: true,
  },
  {
    title: 'Binding while binge-watching',
    description:
      'Best way to finish a quilt: cozy chair, good show, hand stitching. Perfect Sunday.',
    image: '/images/quilts/quilt_20_chair_binding.png',
    category: 'wip',
    likes: 156,
    isFeatured: false,
  },
  // Lifestyle shots
  {
    title: 'Real quilt life - unmade bed',
    description:
      'No styled photos here - this is how it actually looks when you use your quilts every day!',
    image: '/images/quilts/quilt_21_bed_unmade.png',
    category: 'general',
    likes: 234,
    isFeatured: true,
  },
  {
    title: 'Hanging on the porch railing',
    description:
      'Best way to photograph a quilt? Natural light + outdoor breeze = gorgeous draping.',
    image: '/images/quilts/quilt_22_porch_railing.png',
    category: 'show-and-tell',
    likes: 189,
    isFeatured: false,
  },
  {
    title: "Baby's first quilt - well loved already!",
    description:
      "Made this for my daughter 6 months ago. It's been washed 20 times and played on daily. Best compliment ever.",
    image: '/images/quilts/quilt_23_nursery_floor.png',
    category: 'show-and-tell',
    likes: 412,
    isFeatured: true,
  },
  {
    title: 'Casual couch quilt',
    description: 'This one lives on the sofa for movie nights. Functional art is the best art.',
    image: '/images/quilts/quilt_24_sofa_casual.png',
    category: 'general',
    likes: 167,
    isFeatured: false,
  },
  {
    title: 'Picnic quilt in action',
    description: 'Took my quilt outside for lunch today. Grass stains add character, right?',
    image: '/images/quilts/quilt_25_grass_picnic.png',
    category: 'general',
    likes: 98,
    isFeatured: false,
  },
];

// Blog posts are seeded separately via seed-blog.ts / blog-seed.ts.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _BLOG_POSTS_DEPRECATED = [
  {
    title: "The Complete Beginner's Guide to Machine Quilting",
    slug: 'beginners-guide-machine-quilting',
    excerpt:
      'Everything you need to know to start machine quilting your first project, from choosing batting to mastering your walking foot.',
    category: 'Tutorials',
    tags: ['machine quilting', 'beginner', 'tutorial'],
    image: '/images/quilts/quilt_16_longarm_studio.png',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Machine quilting can seem intimidating when you're first starting out. I remember staring at my sewing machine, wondering how on earth I was going to fit a whole quilt through that tiny arm. But with the right techniques and a bit of practice, machine quilting becomes not just manageable, but genuinely enjoyable.",
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Choosing Your Batting' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "The first decision you'll need to make is what type of batting to use. Cotton batting is the most popular choice for beginners because it's easy to work with and gives a traditional, flat look. Polyester batting is loftier and warmer, while wool batting is lightweight but expensive. For your first quilt, I recommend a cotton or cotton-blend batting.",
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Setting Up Your Machine' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Before you start quilting, you'll need to attach your walking foot (also called an even feed foot). This special foot feeds the top layer of your quilt through at the same rate as the feed dogs move the bottom layer, preventing puckering and shifting. Install it according to your machine's manual.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Set your stitch length to 3.0-3.5mm - slightly longer than you'd use for piecing. This helps the stitches sink into the batting and gives a more professional look.",
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Starting Your First Line' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Begin in the center of your quilt and work your way out. This helps distribute any fullness evenly. Roll up the sides of your quilt so it fits through the machine\'s arm - this is called \"pooling\" or \"scrunching\" and is completely normal!',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Take a deep breath, lower your presser foot, and start sewing. Go slowly at first - there's no rush. Focus on keeping your lines straight and your speed consistent.",
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Common Problems and Solutions' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Puckering usually means your tension is off or you're not using a walking foot. skipped stitches often indicate a dull needle - change it! And remember: every quilter has ugly stitches in their first few quilts. It's part of the learning process.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "With practice, you'll develop a rhythm and confidence. Happy quilting!",
            },
          ],
        },
      ],
    },
    isLong: true,
  },
  {
    title: '5 Quick Tips for Perfect Binding',
    slug: '5-tips-perfect-binding',
    excerpt:
      'Master the final step of your quilt with these simple binding techniques that make a big difference.',
    category: 'Tips',
    tags: ['binding', 'finishing', 'quick tips'],
    image: '/images/quilts/quilt_05_closeup_binding.png',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Binding is the final touch on your quilt, and it deserves attention. Here are 5 quick tips to make your binding look professional:',
            },
          ],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Cut your binding strips 2.5\" wide - this gives enough fabric to fold over and cover your stitching line.',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Join strips with diagonal seams to reduce bulk. Sew at 45 degrees and trim the excess.',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Sew binding to the front of your quilt with a ¼\" seam, then wrap to the back and hand stitch for an invisible finish.',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Miter your corners by folding at 45 degrees - take your time here for crisp corners.',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: "Use wonder clips instead of pins - they won't poke you and hold the binding securely while you stitch.",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Happy binding!' }],
        },
      ],
    },
    isLong: false,
  },
  {
    title: 'Why I Love Scrappy Quilts',
    slug: 'why-i-love-scrappy-quilts',
    excerpt: 'Embracing the beauty of using every last scrap of fabric in your stash.',
    category: 'Inspiration',
    tags: ['scrappy', 'fabric stash', 'sustainable'],
    image: '/images/quilts/quilt_03_closeup_scrappy.png',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "There's something deeply satisfying about using up every last bit of fabric. Scrappy quilts tell stories - that floral from your first quilt, the stripe from a baby blanket, the dot from a gift you made your mom. Each piece has history.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Beyond the sentimentality, scrappy quilts are sustainable. Instead of buying new fabric for every project, you're using what you have. It's quilting in its most traditional form - resourceful and creative.",
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'My favorite patterns for scraps are log cabin, string quilts, and postage stamp quilts. These patterns embrace the chaos and turn it into beauty.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "So before you buy more fabric (I know, it's hard!), look at your scrap bin. You might already have everything you need for your next masterpiece.",
            },
          ],
        },
      ],
    },
    isLong: false,
  },
  {
    title: 'The History of the Log Cabin Pattern',
    slug: 'history-log-cabin-pattern',
    excerpt:
      "Discover the fascinating history behind one of quilting's most iconic patterns, from pioneer days to modern interpretations.",
    category: 'History',
    tags: ['log cabin', 'history', 'traditional patterns'],
    image: '/images/quilts/quilt_08_closeup_logcabin.png',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The Log Cabin quilt pattern is one of the most recognizable and beloved designs in quilting history. With its central square surrounded by strips of fabric, it symbolizes home, hearth, and the pioneering spirit of early America.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Origins' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'While the pattern is strongly associated with American pioneer history, its roots may go back further. Some historians trace similar designs to ancient Egyptian mummy wrappings and English patchwork from the 17th century. However, the pattern as we know it gained popularity in the United States during the Civil War era.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Symbolism' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The central square traditionally represents the hearth or heart of the home, while the strips around it symbolize the logs of a cabin. Red centers often symbolized the fire burning in the hearth, while yellow centers represented light shining from the windows.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Underground Railroad historians have suggested that log cabin quilts with black centers may have been hung on clotheslines to signal safe houses, though this claim is debated among historians.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Modern Variations' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Today, the log cabin pattern has evolved into countless variations. Courthouse Steps features strips of equal length on opposite sides, creating a symmetrical look. The Pineapple variation adds triangles to the corners, creating a completely different effect. Modern quilters play with scale, color placement, and negative space to create fresh interpretations of this classic design.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Whether you stick to traditional red centers or go wild with modern fabrics, the log cabin pattern remains a testament to the resourcefulness and creativity of quilters throughout history.',
            },
          ],
        },
      ],
    },
    isLong: true,
  },
  {
    title: 'Organizing Your Sewing Space',
    slug: 'organizing-sewing-space',
    excerpt: 'Practical tips for keeping your quilting area functional and inspiring.',
    category: 'Organization',
    tags: ['studio', 'organization', 'tips'],
    image: '/images/quilts/quilt_19_shelf_stacked.png',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'A well-organized sewing space makes quilting more enjoyable. Here are my favorite organization tips:',
            },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Store fabric by color in clear bins so you can see what you have at a glance.',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Use a pegboard for tools - scissors, rulers, and rotary cutters stay visible and accessible.',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: "Keep a small trash bin next to your cutting mat. You'll use it more than you think!",
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Create a design wall using flannel-covered foam boards - essential for laying out blocks.',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'Label everything. Future you will thank present you.' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Remember: organization is personal. What works for one quilter might not work for another. Experiment and find your flow!',
            },
          ],
        },
      ],
    },
    isLong: false,
  },
  {
    title: 'Color Theory for Quilters: A Deep Dive',
    slug: 'color-theory-quilters',
    excerpt:
      'Understanding color relationships to create stunning quilts with confidence. From complementary colors to value and saturation.',
    category: 'Tutorials',
    tags: ['color theory', 'design', 'tutorial'],
    image: '/images/quilts/quilt_07_closeup_modern.png',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Color theory can transform your quilting from \"nice\" to \"wow.\" Understanding how colors interact helps you choose fabrics with confidence and create quilts that truly sing.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'The Color Wheel Basics' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The color wheel is your best friend. Primary colors (red, blue, yellow) mix to create secondary colors (orange, green, purple), which mix to create tertiary colors. But the real magic happens when you understand color relationships.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Complementary Colors' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Colors opposite each other on the wheel - like blue and orange, or red and green - create high contrast and visual excitement. Use them when you want a bold, dynamic look. Navy and orange is a favorite modern combination that proves complementary colors don't have to be loud.",
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Analogous Colors' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Colors next to each other on the wheel create harmony and flow. Think blue, blue-green, and green, or yellow, orange, and red. These combinations are soothing and cohesive - perfect for quilts meant to be calming.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Value Matters More Than Hue' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Here's the secret: value (how light or dark a color is) often matters more than the actual color. Take a black and white photo of your fabric pull - if everything looks the same gray, your quilt might look flat. Aim for a mix of lights, mediums, and darks for visual interest.",
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'The 60-30-10 Rule' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Interior designers use this rule, and it works for quilts too: 60% dominant color, 30% secondary color, 10% accent. This creates balance while allowing for pops of interest.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Don't be afraid to experiment. Some of the most beautiful quilts break all the rules. But understanding color theory gives you a foundation to stand on - and sometimes, to leap from.",
            },
          ],
        },
      ],
    },
    isLong: true,
  },
];

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
      .insert(communityPosts)
      .values({
        userId: user.id,
        projectId: project.id,
        title: post.title,
        description: post.description,
        thumbnailUrl: post.image,
        likeCount: post.likes,
        status: 'approved',
        isFeatured: post.isFeatured,
        isPinned: i === 0, // Pin the first post
        category: post.category as 'show-and-tell' | 'wip' | 'help' | 'inspiration' | 'general',
      })
      .returning();

    createdPosts.push(communityPost);
  }
  console.log(`✅ Created ${createdPosts.length} community posts\n`);

  // Create likes for featured/trending posts
  console.log('Creating likes for engagement...');
  const featuredPosts = createdPosts.filter((p) => p.isFeatured);
  for (const post of featuredPosts) {
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
  console.log(`✅ Added likes to featured posts\n`);

  // Blog posts are seeded separately via `npm run db:seed:blog` (seed-blog.ts)

  console.log('🎉 Content seeding complete!');
  console.log('\nSummary:');
  console.log(`- ${createdUsers.length} quilter users`);
  console.log(`- ${createdPosts.length} community posts (${featuredPosts.length} featured)`);
  console.log('\nFeatured posts (most liked):');
  featuredPosts
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5)
    .forEach((post, i) => {
      console.log(`  ${i + 1}. "${post.title}" - ${post.likeCount} likes`);
    });
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
