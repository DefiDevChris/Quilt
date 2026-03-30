/**
 * Seed data for blog posts. These posts use Tiptap JSON content format
 * and are pre-set to 'published' status with publishedAt timestamps.
 */

type BlogCategory =
  | 'Product Updates'
  | 'Behind the Scenes'
  | 'Tutorials'
  | 'Community'
  | 'Tips'
  | 'Inspiration'
  | 'History'
  | 'Organization';

interface TiptapNode {
  readonly type: string;
  readonly content?: readonly TiptapNode[];
  readonly text?: string;
  readonly marks?: readonly { type: string; attrs?: Record<string, unknown> }[];
  readonly attrs?: Record<string, unknown>;
}

interface TiptapDoc {
  readonly type: 'doc';
  readonly content: readonly TiptapNode[];
}

function p(...nodes: TiptapNode[]): TiptapNode {
  return { type: 'paragraph', content: nodes };
}

function text(t: string, marks?: { type: string; attrs?: Record<string, unknown> }[]): TiptapNode {
  const node: TiptapNode = { type: 'text', text: t };
  if (marks) {
    return { ...node, marks };
  }
  return node;
}

function bold(t: string): TiptapNode {
  return text(t, [{ type: 'bold' }]);
}

function heading(level: number, t: string): TiptapNode {
  return { type: 'heading', attrs: { level }, content: [text(t)] };
}

function bulletList(...items: string[]): TiptapNode {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [p(text(item))],
    })),
  };
}

const introducingQuiltcorgi: TiptapDoc = {
  type: 'doc',
  content: [
    p(
      text(
        'We are thrilled to announce the launch of QuiltCorgi, a free, browser-based quilt design tool built for quilters of all skill levels. Whether you are a complete beginner or an experienced quilter, QuiltCorgi gives you the power to design beautiful quilts without expensive desktop software.'
      )
    ),
    heading(2, 'Why Another Quilt Tool?'),
    p(
      text(
        'Existing quilt design software often comes with steep learning curves and price tags. We believe that creative tools should be '
      ),
      bold('accessible to everyone'),
      text(
        '. That is why QuiltCorgi runs entirely in your browser -- no downloads, no installations, no subscriptions required to get started.'
      )
    ),
    heading(2, 'What Can You Do?'),
    bulletList(
      'Design quilts using a drag-and-drop canvas with grid snapping',
      'Choose from over 650 traditional quilt blocks',
      'Upload and calibrate your own fabrics',
      'Export your designs as high-resolution images or PDFs',
      'Share your work with the QuiltCorgi community'
    ),
    heading(2, 'Built for Quilters'),
    p(
      text(
        'Every feature in QuiltCorgi was designed with real quilting workflows in mind. From seam allowances to rotary cutting charts, from foundation paper piecing templates to medallion layouts -- we have built the tools that quilters actually need.'
      )
    ),
    p(
      text(
        'We cannot wait to see what you create. Head to the studio and start designing your first quilt today!'
      )
    ),
  ],
};

const whyFreeQuiltTool: TiptapDoc = {
  type: 'doc',
  content: [
    p(
      text(
        'When we started building QuiltCorgi, we made a deliberate choice: the core design tools would be free. Here is why that matters.'
      )
    ),
    heading(2, 'The Problem with Paid Design Software'),
    p(
      text(
        'Many quilters are hobbyists who quilt for the joy of it. Asking them to pay hundreds of dollars for design software creates a barrier that keeps people from exploring their creativity. Some quilters resort to graph paper and colored pencils -- effective, but limiting.'
      )
    ),
    heading(2, 'Our Philosophy'),
    bulletList(
      'Every quilter should be able to visualize their ideas digitally',
      'Basic design tools should never be behind a paywall',
      'The community benefits when more people can share polished designs',
      'Pro features should enhance the experience, not gate the basics'
    ),
    heading(2, 'What Is Free vs. Pro?'),
    p(
      text('The '),
      bold('free tier'),
      text(
        ' includes the full design canvas, block library, fabric uploads, basic exports, and community sharing. '
      ),
      bold('Pro'),
      text(
        ' adds advanced features like photo-to-quilt conversion, PDF export, cutting charts, and priority support.'
      )
    ),
    p(
      text(
        'We believe this model lets us sustain the platform while keeping the door wide open for anyone who wants to start designing quilts.'
      )
    ),
  ],
};

const screenToFabric: TiptapDoc = {
  type: 'doc',
  content: [
    p(
      text(
        'One of the most common questions we hear is: "How do I go from a digital design to actual fabric?" In this post, we walk through the export tools that bridge that gap.'
      )
    ),
    heading(2, 'High-Resolution Image Export'),
    p(
      text(
        'Every design can be exported as a PNG image at up to 300 DPI. This is perfect for sharing your design on social media, printing a reference copy, or sending to a long-arm quilter.'
      )
    ),
    heading(2, 'Foundation Paper Piecing (FPP) Templates'),
    p(
      text(
        'For complex blocks, QuiltCorgi generates print-ready FPP templates. Each template includes numbered sections, grain line indicators, and seam allowances. Print them on standard letter or A4 paper and you are ready to sew.'
      )
    ),
    heading(2, 'Rotary Cutting Charts'),
    p(
      text(
        'Our cutting chart generator analyzes your quilt design and produces a fabric requirements list. It groups cuts by fabric, calculates strip widths, and accounts for seam allowances. No more guessing how much fabric to buy.'
      )
    ),
    heading(2, 'PDF Export'),
    p(
      text(
        'Export your entire project as a multi-page PDF that includes the full quilt layout, individual block diagrams, cutting instructions, and fabric swatches. It is your complete project guide in one file.'
      )
    ),
  ],
};

const meetTheCommunity: TiptapDoc = {
  type: 'doc',
  content: [
    p(
      text(
        'Quilting has always been a community craft. Quilting bees, guild meetings, and fabric swaps bring people together. With QuiltCorgi, we wanted to bring that same spirit online.'
      )
    ),
    heading(2, 'Share Your Designs'),
    p(
      text(
        'With a single click, you can share any of your projects to the community feed. Other quilters can like your work, leave comments, and save designs for inspiration. It is like a gallery for the quilting world.'
      )
    ),
    heading(2, 'Get Feedback'),
    p(
      text(
        'Stuck on a color choice? Not sure about your layout? Post your work-in-progress and get feedback from fellow quilters. The community is supportive, constructive, and full of great ideas.'
      )
    ),
    heading(2, 'Find Inspiration'),
    p(
      text(
        'Browse the community feed to discover designs from quilters around the world. Filter by category -- from show-and-tell finished quilts to works in progress -- and find your next project idea.'
      )
    ),
    heading(2, 'Build Your Profile'),
    p(
      text(
        'Create a quilter profile to showcase your work. Add a bio, link your social accounts, and build a following within the QuiltCorgi community.'
      )
    ),
  ],
};

const gettingStarted: TiptapDoc = {
  type: 'doc',
  content: [
    p(
      text(
        'Ready to design your first quilt? This five-minute guide will take you from a blank canvas to a finished design.'
      )
    ),
    heading(2, 'Step 1: Create a New Project'),
    p(
      text(
        'Click "New Project" from the dashboard. Choose your quilt dimensions (we recommend starting with a lap quilt at 48 by 48 inches) and your preferred unit system.'
      )
    ),
    heading(2, 'Step 2: Add Blocks'),
    p(
      text(
        'Open the block library from the left panel. Browse over 650 blocks across categories like Nine Patch, Log Cabin, Star, and Flying Geese. Click a block to add it to your canvas.'
      )
    ),
    heading(2, 'Step 3: Apply Fabrics'),
    p(
      text(
        'Switch to the Fabric panel and choose from our built-in fabric library or upload your own. Click on any shape in your block to apply a fabric. Use the eyedropper tool to copy colors between shapes.'
      )
    ),
    heading(2, 'Step 4: Arrange Your Layout'),
    p(
      text(
        'Use the layout tools to arrange your blocks in a grid, on-point, or free-form arrangement. Add sashing, borders, and cornerstones to complete the look.'
      )
    ),
    heading(2, 'Step 5: Export and Share'),
    p(
      text(
        'When you are happy with your design, export it as a PDF or image. Share it with the community for feedback, or head to the cutting chart generator to plan your fabric purchases.'
      )
    ),
    p(
      bold('That is it!'),
      text(
        ' You have just designed your first quilt in QuiltCorgi. The more you explore, the more tools you will discover. Happy quilting!'
      )
    ),
  ],
};

export interface BlogSeedPost {
  readonly title: string;
  readonly slug: string;
  readonly content: TiptapDoc;
  readonly excerpt: string;
  readonly category: BlogCategory;
  readonly tags: string[];
  readonly status: 'published';
  readonly publishedAt: Date;
}

export const blogSeedPosts: readonly BlogSeedPost[] = [
  {
    title: 'Introducing QuiltCorgi: Design Quilts in Your Browser',
    slug: 'introducing-quiltcorgi',
    content: introducingQuiltcorgi,
    excerpt:
      'We are thrilled to announce the launch of QuiltCorgi, a free, browser-based quilt design tool built for quilters of all skill levels.',
    category: 'Product Updates',
    tags: ['launch', 'announcement'],
    status: 'published',
    publishedAt: new Date('2026-01-15T12:00:00Z'),
  },
  {
    title: 'Why We Built a Free Quilt Design Tool',
    slug: 'why-free-quilt-tool',
    content: whyFreeQuiltTool,
    excerpt:
      'When we started building QuiltCorgi, we made a deliberate choice: the core design tools would be free. Here is why that matters.',
    category: 'Behind the Scenes',
    tags: ['philosophy', 'free-tier'],
    status: 'published',
    publishedAt: new Date('2026-01-22T12:00:00Z'),
  },
  {
    title: 'From Screen to Fabric: How Our Export Tools Work',
    slug: 'screen-to-fabric',
    content: screenToFabric,
    excerpt:
      'One of the most common questions we hear is: how do I go from a digital design to actual fabric? We walk through the export tools.',
    category: 'Tutorials',
    tags: ['export', 'fpp', 'cutting-charts'],
    status: 'published',
    publishedAt: new Date('2026-02-05T12:00:00Z'),
  },
  {
    title: 'Meet the Community: Share Your Quilts with the World',
    slug: 'meet-the-community',
    content: meetTheCommunity,
    excerpt:
      'Quilting has always been a community craft. With QuiltCorgi, we bring that same spirit online.',
    category: 'Community',
    tags: ['community', 'sharing'],
    status: 'published',
    publishedAt: new Date('2026-02-19T12:00:00Z'),
  },
  {
    title: 'Getting Started: Your First Quilt in 5 Minutes',
    slug: 'getting-started-first-quilt',
    content: gettingStarted,
    excerpt:
      'Ready to design your first quilt? This five-minute guide takes you from a blank canvas to a finished design.',
    category: 'Tutorials',
    tags: ['beginner', 'getting-started', 'tutorial'],
    status: 'published',
    publishedAt: new Date('2026-03-01T12:00:00Z'),
  },
];
