"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore, type VideoItem } from "@/store/app";
import { VideoPlayer } from "@/components/video-player";
import { VideoCard } from "@/components/video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  Share2,
  Eye,
  Calendar,
  Clock,
  HardDrive,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryItem } from "@/store/app";
import { formatDuration, formatViews, formatDate, formatSize } from "@/components/video-card";

interface PlayerViewProps {
  categories: CategoryItem[];
}

export function PlayerView({ categories }: PlayerViewProps) {
  const {
    currentVideo,
    setCurrentVideo,
    setCurrentView,
    setPreviousView,
  } = useAppStore();
  const [relatedVideos, setRelatedVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState<string>("");
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const [initialProgress, setInitialProgress] = useState(0);

  const fetchVideo = useCallback(async () => {
    if (!currentVideo) return;
    setLoading(true);
    try {
      // Fetch fresh video data
      const res = await fetch(`/api/videos/${currentVideo.id}`);
      const data = await res.json();
      setVideo(data);

      // Fetch watch history for progress
      const historyRes = await fetch("/api/history");
      const historyData = await historyRes.json();
      const historyItem = historyData.find(
        (h: { videoId: string; progress: number }) => h.videoId === currentVideo.id
      );
      if (historyItem) {
        setInitialProgress(historyItem.progress);
      } else {
        setInitialProgress(0);
      }

      // Fetch related videos (same category or recent)
      const relatedParams = new URLSearchParams({
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (data.categoryId) {
        relatedParams.set("categoryId", data.categoryId);
      }
      const relatedRes = await fetch(`/api/videos?${relatedParams}`);
      const relatedData = await relatedRes.json();
      setRelatedVideos(
        (relatedData.videos || []).filter((v: VideoItem) => v.id !== currentVideo.id)
      );

      // Save watch history entry
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: currentVideo.id, progress: 0 }),
      });
    } catch (e) {
      console.error("Failed to fetch video", e);
    } finally {
      setLoading(false);
    }
  }, [currentVideo]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleProgress = useCallback(
    (progress: number) => {
      if (!currentVideo) return;
      clearTimeout(progressSaveTimer.current);
      progressSaveTimer.current = setTimeout(() => {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: currentVideo.id, progress }),
        });
      }, 3000);
    },
    [currentVideo]
  );

  const handleToggleFavorite = async () => {
    if (!video) return;
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id }),
      });
      setVideo({ ...video, isFavorite: !video.isFavorite });
    } catch (e) {
      console.error("Failed to toggle favorite", e);
    }
  };

  const handleDelete = async () => {
    if (!video || !confirm(`Delete "${video.title}"?`)) return;
    try {
      await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
      setCurrentVideo(null);
      setCurrentView("library");
    } catch (e) {
      console.error("Failed to delete video", e);
    }
  };

  const openEdit = () => {
    if (!video) return;
    setEditTitle(video.title);
    setEditDesc(video.description || "");
    setEditCategory(video.categoryId || "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!video) return;
    try {
      const res = await fetch("/api/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: video.id,
          title: editTitle,
          description: editDesc,
          categoryId: editCategory,
        }),
      });
      const updated = await res.json();
      setVideo(updated);
      setEditOpen(false);
    } catch (e) {
      console.error("Failed to update video", e);
    }
  };

  const handleBack = () => {
    setCurrentVideo(null);
    setCurrentView("library");
  };

  const handleRelatedClick = (v: VideoItem) => {
    setCurrentVideo(v);
    setInitialProgress(0);
    window.scrollTo(0, 0);
    fetchVideo();
  };

  if (!currentVideo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">No video selected</p>
        <Button onClick={handleBack}>Back to Library</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full aspect-video rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 -ml-2">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video player */}
          <VideoPlayer
            src={video.filePath}
            title={video.title}
            initialProgress={initialProgress}
            onProgress={handleProgress}
          />

          {/* Video info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl sm:text-2xl font-bold">{video.title}</h1>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleToggleFavorite}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      video.isFavorite ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={openEdit}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              {video.views > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatViews(video.views)} views
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(video.createdAt)}
              </span>
              {video.duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(video.duration)}
                </span>
              )}
              {video.size > 0 && (
                <span className="flex items-center gap-1">
                  <HardDrive className="w-4 h-4" />
                  {formatSize(video.size)}
                </span>
              )}
            </div>

            {/* Category badge */}
            {video.category && (
              <div className="mt-3">
                <Badge
                  variant="secondary"
                  className="gap-1.5"
                  style={{
                    borderColor: video.category.color + "40",
                    backgroundColor: video.category.color + "15",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: video.category.color }}
                  />
                  {video.category.name}
                </Badge>
              </div>
            )}

            {/* Description */}
            {video.description && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {video.description}
              </p>
            )}
          </div>
        </div>

        {/* Related videos sidebar */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Related Videos
          </h3>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {relatedVideos.length > 0 ? (
              relatedVideos.map((v) => (
                <div
                  key={v.id}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <VideoCard
                    video={v}
                    onClick={() => handleRelatedClick(v)}
                    compact
                    showMeta={false}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No related videos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={editCategory || "none"} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
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
            <Button onClick={handleSaveEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}