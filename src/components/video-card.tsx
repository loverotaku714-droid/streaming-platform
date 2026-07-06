"use client";

import { type VideoItem } from "@/store/app";
import { cn } from "@/lib/utils";
import { Clock, Heart, MoreVertical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

interface VideoCardProps {
  video: VideoItem;
  onClick: () => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  progress?: number;
  showMeta?: boolean;
}

export function VideoCard({
  video,
  onClick,
  onToggleFavorite,
  onDelete,
  compact = false,
  progress,
  showMeta = true,
}: VideoCardProps) {
  return (
    <div
      className={cn(
        "video-card group cursor-pointer rounded-xl overflow-hidden",
        compact ? "flex gap-3 p-2" : ""
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "relative bg-muted overflow-hidden flex-shrink-0",
          compact ? "w-40 h-24 rounded-lg" : "w-full aspect-video rounded-t-xl"
        )}
      >
        {video.thumbnailPath ? (
          <img
            src={video.thumbnailPath}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Duration badge */}
        {video.duration > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100 duration-200">
            <svg className="w-5 h-5 text-primary-foreground ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className={cn("flex-1 min-w-0", compact ? "py-0.5" : "p-3 pt-2")}>
        <div className="flex items-start gap-2">
          <h3
            className={cn(
              "font-medium text-foreground line-clamp-2",
              compact ? "text-sm" : "text-sm sm:text-base"
            )}
          >
            {video.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.();
                }}
              >
                <Heart
                  className={cn(
                    "w-4 h-4 mr-2",
                    video.isFavorite ? "fill-red-500 text-red-500" : ""
                  )}
                />
                {video.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {video.category && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: video.category.color }}
            />
            <span className="text-xs text-muted-foreground">{video.category.name}</span>
          </div>
        )}

        {showMeta && (
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {video.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatViews(video.views)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(video.createdAt)}
            </span>
            {video.size > 0 && (
              <span>{formatSize(video.size)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { formatDuration, formatViews, formatDate, formatSize };