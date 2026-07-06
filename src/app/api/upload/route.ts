import { NextRequest, NextResponse } from "next/server";
import {
  createWriteStream, existsSync, mkdirSync, appendFileSync,
  unlinkSync, readdirSync, statSync, writeFileSync,
} from "fs";
import { readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const CHUNKS_DIR = path.join(process.cwd(), "uploads", ".chunks");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action, uploadId, title, description, categoryId,
      fileName, fileSize, mimeType, totalChunks, chunkIndex,
      chunkData, thumbnailData, thumbnailName,
    } = body;

    if (!existsSync(CHUNKS_DIR)) {
      mkdirSync(CHUNKS_DIR, { recursive: true });
    }

    // INIT
    if (action === "init") {
      const id = uploadId || crypto.randomUUID();
      const dir = path.join(CHUNKS_DIR, id);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      return NextResponse.json({ uploadId: id });
    }

    // CHUNK
    if (action === "chunk") {
      if (!uploadId) return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });
      const chunkBuffer = Buffer.from(chunkData, "base64");
      const chunkPath = path.join(CHUNKS_DIR, uploadId, `chunk_${chunkIndex}`);
      writeFileSync(chunkPath, chunkBuffer);
      return NextResponse.json({ received: true, chunkIndex });
    }

    // COMPLETE
    if (action === "complete") {
      if (!uploadId || !title) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const chunkDir = path.join(CHUNKS_DIR, uploadId);
      const videoId = uuidv4();
      const videoExt = path.extname(fileName) || ".mp4";
      const videoFileName = `${videoId}${videoExt}`;
      const videoFilePath = path.join(UPLOAD_DIR, videoFileName);

      // Assemble chunks
      const writeStream = createWriteStream(videoFilePath);
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `chunk_${i}`);
        if (existsSync(chunkPath)) {
          const chunk = await readFile(chunkPath);
          if (!writeStream.write(chunk)) {
            await new Promise<void>((resolve) => writeStream.once("drain", resolve));
          }
        }
      }
      await new Promise<void>((resolve, reject) => {
        writeStream.end();
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      // Save thumbnail
      let thumbnailFileName: string | null = null;
      if (thumbnailData) {
        const thumbExt = path.extname(thumbnailName || ".jpg") || ".jpg";
        thumbnailFileName = `${videoId}_thumb${thumbExt}`;
        writeFileSync(
          path.join(UPLOAD_DIR, thumbnailFileName),
          Buffer.from(thumbnailData, "base64")
        );
      }

      // Clean up chunks
      const chunkFiles = readdirSync(chunkDir);
      for (const f of chunkFiles) unlinkSync(path.join(chunkDir, f));
      try { await readFile(chunkDir); } catch { /* dir may already be cleaned */ }

      const actualSize = statSync(videoFilePath).size;

      // Create DB record
      const video = await db.video.create({
        data: {
          id: videoId,
          title,
          description: description || null,
          filePath: `/api/uploads/${videoFileName}`,
          thumbnailPath: thumbnailFileName ? `/api/uploads/${thumbnailFileName}` : null,
          size: actualSize,
          mimeType: mimeType || "video/mp4",
          categoryId: categoryId || null,
        },
        include: { category: true },
      });

      return NextResponse.json(video, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}