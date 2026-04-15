/**
 * Seed data for blog posts. These posts use Tiptap JSON content format
 * and are pre-set to 'published' status with publishedAt timestamps.
 */

import type { TiptapNode } from '@/types/community';

type BlogCategory =
  | 'Product Updates'
  | 'Behind the Scenes'
  | 'Tutorials'
  | 'Tips'
  | 'Inspiration'
  | 'History'
  | 'Organization';

/** TiptapDoc with required content — seed data always has content */
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
      'Choose from 50 traditional quilt blocks',
      'Upload and calibrate your own fabrics',
      'Export your designs as high-resolution images or PDFs'
    ),
    heading(2, 'Built for Quilters'),
    p(
      text(
        'Every feature in QuiltCorgi was designed with real quilting workflows in mind. From seam allowances to rotary cutting charts, from foundation paper piecing templates to on-point layouts -- we have built the tools that quilters actually need.'
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
        'With a single click, you can share any of your projects publicly. Other quilters can view your work and get inspired. It is like a gallery for the quilting world.'
      )
    ),
    heading(2, 'Get Inspired'),
    p(
      text(
        'Browse shared designs from quilters around the world. Explore different categories and find your next project idea. See how others approach color choices, layouts, and block combinations.'
      )
    ),
    heading(2, 'Build Your Portfolio'),
    p(
      text(
        'Create a quilter profile to showcase your work. Build a collection of your best designs and share them with the quilting community.'
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
        'Open the block library from the left panel. Browse 50 blocks across categories like Nine Patch, Log Cabin, Star, and Flying Geese. Click a block to add it to your canvas.'
      )
    ),
    heading(2, 'Step 3: Apply Fabrics'),
    p(
      text(
        'Switch to the Fabric panel and choose from our built-in fabric library or upload your own. Click on any shape in your block to apply a fabric.'
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
    tags: ['export', 'pdf', 'cutting-charts'],
    status: 'published',
    publishedAt: new Date('2026-02-05T12:00:00Z'),
  },
  {
    title: 'Meet the Community: Share Your Quilts with the World',
    slug: 'meet-the-community',
    content: meetTheCommunity,
    excerpt:
      'Quilting has always been a community craft. With QuiltCorgi, we bring that same spirit online.',
    category: 'Inspiration',
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
  {
    title: 'Using the Block Library',
    slug: 'block-library-guide',
    content: {
      type: 'doc',
      content: [
        p(
          text(
            'QuiltCorgi includes 50 traditional quilt blocks across 20+ categories. Here is how to find the perfect block for your design.'
          )
        ),
        heading(2, 'Browsing Blocks'),
        p(
          text(
            'Open the block library from the left panel in the Quilt Worktable. Blocks are organized into categories like Nine Patch, Log Cabin, Star, Flying Geese, and more. Use the search bar to find blocks by name or scroll through categories.'
          )
        ),
        heading(2, 'Adding Blocks to Your Design'),
        p(
          text(
            'Click any block to add it to your canvas. Blocks snap to the grid automatically. You can rotate, resize, and recolor any block after placing it. Drag blocks between cells to rearrange your layout.'
          )
        ),
        heading(2, 'Block Categories'),
        bulletList(
          "Stars — Ohio Star, Hunter's Star, and 80+ variations",
          'Nine Patch — Classic nine patch, disappearing nine patch, and more',
          'Log Cabin — Traditional, courthouse steps, pineapple',
          'Flying Geese — Single, paired, and stacked arrangements',
          'Pinwheels — Simple and complex spinning designs'
        ),
        p(
          text(
            'Every block can be customized with your own fabric choices and colors. Experiment freely — you can always undo.'
          )
        ),
      ],
    },
    excerpt:
      'Browse, search, and preview 650+ quilt blocks across 20+ categories. Learn to drag-and-drop blocks into your design.',
    category: 'Tutorials',
    tags: ['beginner', 'blocks', 'library', 'tutorial'],
    status: 'published',
    publishedAt: new Date('2026-03-05T12:00:00Z'),
  },
  {
    title: 'Drawing Custom Blocks with EasyDraw',
    slug: 'custom-blocks-easydraw',
    content: {
      type: 'doc',
      content: [
        p(
          text(
            "EasyDraw is QuiltCorgi's freehand block drafting tool. Use it to create original quilt blocks from scratch by drawing seam lines on a grid."
          )
        ),
        heading(2, 'Getting Started with EasyDraw'),
        p(
          text(
            'Switch to the Block Worktable and click "New Block." The EasyDraw canvas opens with a snap-to-grid system. Draw lines between grid points to define your block\'s seam lines. Each enclosed region becomes a fabric piece.'
          )
        ),
        heading(2, 'Drawing Tools'),
        bulletList(
          'Line tool — Click two grid points to draw a straight seam line',
          'Edit mode — Click and drag nodes to adjust existing lines',
          'Delete — Remove individual lines or clear the entire block',
          'Undo/Redo — Full history support while drafting'
        ),
        heading(2, 'Saving Your Block'),
        p(
          text(
            'When you are happy with your design, click "Save to Library." Your custom block appears alongside the built-in blocks and can be used in any project. Name it, add tags, and it is ready to use.'
          )
        ),
      ],
    },
    excerpt:
      "Draft original quilt blocks using EasyDraw's seam-line drawing tool. Draw lines, edit nodes, and save blocks to your library.",
    category: 'Tutorials',
    tags: ['intermediate', 'easydraw', 'blocks', 'drafting', 'tutorial'],
    status: 'published',
    publishedAt: new Date('2026-03-08T12:00:00Z'),
  },
  {
    title: 'Uploading Finished Block Photos',
    slug: 'block-photo-upload-guide',
    content: {
      type: 'doc',
      content: [
        p(
          text(
            'Upload a photo of a finished, sewn quilt block to preserve it in your Block Library. Block photos are stored as non-editable square images you can place in any layout.'
          )
        ),
        heading(2, 'Photographing Your Block'),
        bulletList(
          'Lay your block flat on a solid-color background',
          'Shoot from directly above to avoid perspective distortion',
          'Use even, natural lighting to minimize shadows',
          'Ensure all four edges are visible in the frame'
        ),
        heading(2, 'Uploading and Processing'),
        p(
          text(
            'From the Block Library, click the upload button and select your photo. The image is cropped to a square and saved as a photo block. Photo blocks can be placed on the canvas just like system blocks, but cannot be edited or have fabrics assigned per patch.'
          )
        ),
        heading(2, 'When to Use Block Photos'),
        p(
          text(
            'Block photos are ideal for documenting your finished work, building a portfolio of sewn projects, or using photographed blocks as reference in future designs.'
          )
        ),
      ],
    },
    excerpt:
      'Upload photos of finished, sewn quilt blocks to preserve them in your library and place them in future designs.',
    category: 'Tutorials',
    tags: ['beginner', 'block-photos', 'documentation', 'tutorial'],
    status: 'published',
    publishedAt: new Date('2026-03-10T12:00:00Z'),
  },
  {
    title: 'Managing Your Fabric Library',
    slug: 'fabric-library-guide',
    content: {
      type: 'doc',
      content: [
        p(
          text(
            'QuiltCorgi includes over 2,700 solid fabric swatches from 16 manufacturers. Pro users can also upload custom fabric images to build their own library.'
          )
        ),
        heading(2, 'Browsing the Fabric Library'),
        p(
          text(
            'Open the Fabric panel from the right sidebar. Fabrics are organized by color family, manufacturer, and value (light, medium, dark). Use the search bar to find specific fabrics or filter by manufacturer like Moda, Robert Kaufman, or Art Gallery Fabrics.'
          )
        ),
        heading(2, 'Assigning Fabrics to Patches'),
        p(
          text(
            'Drag any fabric onto a patch on the canvas to assign it. Each patch in a block can have its own fabric, giving you precise control over your design. Click a patch to see which fabric is assigned, or drag a new fabric to replace it.'
          )
        ),
        heading(2, 'Uploading Custom Fabrics (Pro)'),
        p(
          text(
            'Pro users can upload fabric photos from their computer or mobile device. Uploaded fabrics appear in the library alongside system fabrics and can be assigned to any patch. Use the scale calibration tool to ensure fabrics render at the correct size on screen.'
          )
        ),
      ],
    },
    excerpt:
      'Browse 2,700+ fabric swatches, assign them per patch, and upload custom fabrics to build your own library.',
    category: 'Tutorials',
    tags: ['beginner', 'fabric', 'library', 'tutorial'],
    status: 'published',
    publishedAt: new Date('2026-03-12T12:00:00Z'),
  },
  {
    title: 'Drafting Custom Blocks with the Block Builder',
    slug: 'block-builder-guide',
    content: {
      type: 'doc',
      content: [
        p(
          text(
            'The Block Builder lets you draft original quilt blocks from scratch using seam-line drawing tools. Draw lines, edit nodes, and save your creations to the library.'
          )
        ),
        heading(2, 'Getting Started'),
        p(
          text(
            'Switch to the Block Builder worktable from the top bar. You get a 600×600 grid-snapped canvas with drawing tools: pencil for freehand lines, rectangle, triangle, and circle. Every line you draw becomes a seam in your block.'
          )
        ),
        heading(2, 'Editing Your Block'),
        bulletList(
          'Draw seam lines connecting grid points to define patch shapes',
          'Click and drag nodes to adjust line endpoints',
          'Use the bend tool to curve straight seams for organic shapes',
          'Delete unwanted lines or patches with the selection tool'
        ),
        heading(2, 'Saving to Your Library'),
        p(
          text(
            'When your block is complete, save it with a name. It appears instantly in your Block Library alongside the 50 system blocks. Use it in any project, assign fabrics per patch, and include it in PDF exports.'
          )
        ),
      ],
    },
    excerpt:
      'Draft original quilt blocks from scratch using seam-line drawing tools, node editing, and grid snapping.',
    category: 'Tutorials',
    tags: ['intermediate', 'block-builder', 'custom-blocks', 'tutorial'],
    status: 'published',
    publishedAt: new Date('2026-03-15T12:00:00Z'),
  },
  {
    title: 'Layout Types: Grid, Sashing & On-Point',
    slug: 'layout-types-guide',
    content: {
      type: 'doc',
      content: [
        p(
          text(
            'QuiltCorgi offers six layout presets to arrange your blocks. Each creates a different visual effect and changes how your quilt comes together.'
          )
        ),
        heading(2, 'Grid Layout'),
        p(
          text(
            'The simplest layout — blocks sit side by side in rows and columns. Great for sampler quilts and designs where every block is unique. Adjust rows, columns, and block size from the Layout Settings panel.'
          )
        ),
        heading(2, 'Sashing Layout'),
        p(
          text(
            'Adds strips of fabric (sashing) between blocks. Sashing frames each block individually and adds visual breathing room. Adjust sashing width and color. Cornerstones appear automatically at intersections.'
          )
        ),
        heading(2, 'On-Point Layout'),
        p(
          text(
            'Rotates every block 45 degrees so they sit on their points like diamonds. Setting triangles fill the edges automatically. On-point layouts give a dynamic, sophisticated look to traditional blocks.'
          )
        ),
        heading(2, 'Free-Form'),
        p(
          text(
            'No grid at all — place blocks anywhere on the canvas at any size and rotation. Perfect for art quilts, asymmetric designs, and mixed-media compositions.'
          )
        ),
      ],
    },
    excerpt:
      'Explore all layout types available in QuiltCorgi: grid, sashing, on-point, and free-form.',
    category: 'Tutorials',
    tags: ['intermediate', 'layout', 'grid', 'tutorial'],
    status: 'published',
    publishedAt: new Date('2026-03-18T12:00:00Z'),
  },
  {
    title: 'Photo to Quilt: Turn Any Image into a Pattern',
    slug: 'photo-to-quilt-guide',
    content: {
      type: 'doc',
      content: [
        p(
          text(
            "QuiltCorgi's Photo to Design tool converts any photograph into a quilt design. Upload a photo and our computer vision engine detects the shapes, colors, and layout automatically."
          )
        ),
        heading(2, 'How It Works'),
        bulletList(
          'Upload any photo of a quilt or image you want to recreate',
          'The engine detects individual pieces using contour detection',
          'Colors are mapped to your fabric library',
          'Pieces are placed on the design canvas in the original layout'
        ),
        heading(2, 'Getting the Best Results'),
        p(
          text(
            'For best results, use a photo taken straight-on with even lighting. The perspective correction tool can fix mild angles. High-contrast quilts with clearly defined pieces produce the most accurate results.'
          )
        ),
        heading(2, 'After Import'),
        p(
          text(
            'Once imported, every piece is fully editable. Change colors, swap fabrics, resize blocks, and adjust the layout just like any other design. The photo gives you a starting point — make it your own.'
          )
        ),
      ],
    },
    excerpt:
      'Convert any photograph into a quilt layout using computer vision. Detect pieces, map colors, and edit the result.',
    category: 'Tutorials',
    tags: ['advanced', 'photo', 'patchwork', 'image', 'tutorial'],
    status: 'published',
    publishedAt: new Date('2026-03-20T12:00:00Z'),
  },
];
