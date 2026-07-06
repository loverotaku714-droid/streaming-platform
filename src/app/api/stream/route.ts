import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fileName = searchParams.get("file");

    if (!fileName) {
      return NextResponse.json({ error: "File not specified" }, { status: 400 });
    }

    // Prevent directory traversal
    const safeName = path.basename(fileName);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Handle range requests for video streaming
    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": getContentType(safeName),
        "Cache-Control": "public, max-age=31536000",
      };

      return new NextResponse(file as unknown as ReadableStream, {
        status: 206,
        headers: head,
      });
    }

    const file = fs.createReadStream(filePath);
    const head = {
      "Content-Length": fileSize,
      "Content-Type": getContentType(safeName),
      "Cache-Control": "public, max-age=31536000",
    };

    return new NextResponse(file as unknown as ReadableStream, {
      status: 200,
      headers: head,
    });
  } catch (error) {
    console.error("Error streaming file:", error);
    return NextResponse.json({ error: "Failed to stream file" }, { status: 500 });
  }
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".m4v": "video/mp4",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return mimeTypes[ext] || "application/octet-stream";
}