import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const history = await db.watchHistory.findMany({
      orderBy: { watchedAt: "desc" },
      take: 50,
      include: {
        video: {
          include: { category: true },
        },
      },
    });
    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching watch history:", error);
    return NextResponse.json({ error: "Failed to fetch watch history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, progress } = body;

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    // Upsert watch history
    const existing = await db.watchHistory.findFirst({
      where: { videoId },
      orderBy: { watchedAt: "desc" },
    });

    if (existing) {
      const updated = await db.watchHistory.update({
        where: { id: existing.id },
        data: {
          progress: progress ?? existing.progress,
          watchedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    const history = await db.watchHistory.create({
      data: { videoId, progress: progress || 0 },
    });

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    console.error("Error saving watch history:", error);
    return NextResponse.json({ error: "Failed to save watch history" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "History ID is required" }, { status: 400 });
    }

    await db.watchHistory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting watch history:", error);
    return NextResponse.json({ error: "Failed to delete watch history" }, { status: 500 });
  }
}