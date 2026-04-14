import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects, userProfiles } from '@/db/schema';
import { downloadCanvasDataFromS3 } from '@/lib/s3';
import { notFoundResponse } from '@/lib/api-responses';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`public-project:${ip}`, API_RATE_LIMITS.projects);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { id } = await params;

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      canvasData: projects.canvasData,
      canvasDataS3Key: projects.canvasDataS3Key,
      canvasWidth: projects.canvasWidth,
      canvasHeight: projects.canvasHeight,
      thumbnailUrl: projects.thumbnailUrl,
      isPublic: projects.isPublic,
      userId: projects.userId,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.isPublic, true)))
    .limit(1);

  if (!project) {
    return notFoundResponse('Project not found.');
  }

  // Hydrate canvas data from S3 if needed
  let canvasData = project.canvasData;
  if (project.canvasDataS3Key) {
    const s3Data = await downloadCanvasDataFromS3(project.canvasDataS3Key);
    if (s3Data) canvasData = s3Data;
  }

  // Fetch creator profile (optional — may not exist)
  const [creator] = await db
    .select({
      displayName: userProfiles.displayName,
      username: userProfiles.username,
      avatarUrl: userProfiles.avatarUrl,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, project.userId))
    .limit(1);

  return Response.json({
    success: true,
    data: {
      id: project.id,
      name: project.name,
      description: project.description,
      canvasData,
      canvasWidth: project.canvasWidth,
      canvasHeight: project.canvasHeight,
      thumbnailUrl: project.thumbnailUrl,
      createdAt: project.createdAt,
      creator: creator ?? null,
    },
  });
}
