"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Film, Image } from "lucide-react";
import type { CategoryItem } from "@/store/app";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryItem[];
  onUploadComplete: () => void;
}

export function UploadDialog({
  open,
  onOpenChange,
  categories,
  onUploadComplete,
}: UploadDialogProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setVideoFile(null);
    setThumbnailFile(null);
    setTitle("");
    setDescription("");
    setCategoryId("");
    setUploading(false);
    setUploadProgress(0);
    setUploadError("");
  }, []);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[._-]/g, " "));
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[._-]/g, " "));
      }
    }
  }, [title]);

  const handleUpload = async () => {
    if (!videoFile || !title.trim()) return;

    setUploading(true);
    setUploadProgress(0);

    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
    const totalChunks = Math.ceil(videoFile.size / CHUNK_SIZE);

    try {
      // Step 1: Init upload session
      const initRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init" }),
      });
      if (!initRes.ok) throw new Error("Failed to init upload");
      const { uploadId } = await initRes.json();

      // Step 2: Read thumbnail as base64 (if provided)
      let thumbBase64: string | null = null;
      if (thumbnailFile) {
        thumbBase64 = await fileToBase64(thumbnailFile);
      }

      // Step 3: Send chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, videoFile.size);
        const blob = videoFile.slice(start, end);
        const arrayBuf = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuf).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        const chunkRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "chunk",
            uploadId,
            chunkIndex: i,
            chunkData: base64,
          }),
        });
        if (!chunkRes.ok) throw new Error(`Failed to upload chunk ${i}`);

        setUploadProgress(Math.round(((i + 1) / totalChunks) * 95));
      }

      // Step 4: Complete upload
      const completeRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          uploadId,
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId || null,
          fileName: videoFile.name,
          fileSize: videoFile.size,
          mimeType: videoFile.type,
          totalChunks,
          thumbnailData: thumbBase64,
          thumbnailName: thumbnailFile?.name,
        }),
      });
      if (!completeRes.ok) throw new Error("Failed to complete upload");

      setUploadProgress(100);
      resetForm();
      onOpenChange(false);
      onUploadComplete();
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      setUploadProgress(0);
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Video file drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : videoFile
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-muted-foreground/30"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => videoInputRef.current?.click()}
          >
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoSelect}
            />
            {videoFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Film className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{videoFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(videoFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Drop video here or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  MP4, WebM, MKV, AVI, MOV supported
                </p>
              </div>
            )}
          </div>

          {/* Thumbnail upload */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Thumbnail (optional)</Label>
            {thumbnailFile ? (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                <img
                  src={URL.createObjectURL(thumbnailFile)}
                  alt="Custom thumbnail preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => setThumbnailFile(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => thumbInputRef.current?.click()}
              >
                <Image className="w-4 h-4" />
                Choose Thumbnail
              </Button>
            )}
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbSelect}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your video..."
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {uploadError}
            </div>
          )}

          {/* Upload button */}
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={!videoFile || !title.trim() || uploading}
          >
            {uploading ? "Uploading..." : "Upload Video"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}