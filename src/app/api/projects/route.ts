import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/db/schema/projects';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getCognitoSession } from '@/lib/cognito-session';
import { computeLayoutSize } from '@/lib/quilt-sizing';
import { LAYOUT_PRESETS } from '@/lib/layout-library';
import { layoutTemplates } from '@/db/schema/layoutTemplates';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  isPublic: z.boolean().optional().default(false),
  // Phase 2 + 3 extensions
  initialLayout: z.object({
    presetId: z.string(),
    blockSize: z.number(),
    rotated: z.boolean().optional(),
  }).optional(),
  initialTemplate: z.object({
    templateId: z.string().uuid(),
    blockSize: z.number(),
    rotated: z.boolean().optional(),
  }).optional()
});

export async function POST(req: Request) {
  try {
    const session = await getCognitoSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 });
    }

    const { name, description, isPublic, initialLayout, initialTemplate } = result.data;

    let canvasWidth = result.data.width || 60;
    let canvasHeight = result.data.height || 60;
    let initialSetupConfig: any = null;

    // Apply Layout Initialization
    if (initialLayout) {
      const preset = LAYOUT_PRESETS.find(p => p.id === initialLayout.presetId);
      if (preset) {
        const calculatedSize = computeLayoutSize(preset, initialLayout.blockSize, !!initialLayout.rotated);
        canvasWidth = calculatedSize.width;
        canvasHeight = calculatedSize.height;
        initialSetupConfig = {
          kind: 'layout',
          preset,
          blockSize: initialLayout.blockSize,
          rotated: !!initialLayout.rotated
        };
      }
    } 
    // Apply Template Initialization
    else if (initialTemplate) {
       const templateRecords = await db
         .select()
         .from(layoutTemplates)
         .where(eq(layoutTemplates.id, initialTemplate.templateId));
         
       if (templateRecords.length > 0) {
         const tpl = templateRecords[0];
         // Ideally scale size, but using default size overrides if not fully implemented in sizing lib yet
         initialSetupConfig = {
           kind: 'template',
           templateData: tpl.templateData,
           blockSize: initialTemplate.blockSize,
           rotated: !!initialTemplate.rotated
         };
       }
    }

    // Default empty canvas data if no special initialization
    const canvasData = {
      elements: [],
      version: 1,
      initialSetup: initialSetupConfig
    };

    const [project] = await db
      .insert(projects)
      .values({
        userId: session.user.id,
        name,
        description: description || '',
        canvasWidth,
        canvasHeight,
        isPublic,
        canvasData,
      })
      .returning();

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// Keeping the existing GET handler below
export async function GET(req: Request) {
  try {
    const session = await getCognitoSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, session.user.id));

    return NextResponse.json({ projects: userProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
