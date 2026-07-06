"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore, type VideoItem, type CategoryItem } from "@/store/app";
import { VideoCard } from "@/components/video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  Upload,
  Grid3X3,
  List,
  Film,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryViewProps {
  categories: CategoryItem[];
  onRefresh: () => void;
}

export function LibraryView({ categories, onRefresh }: LibraryViewProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    setCurrentVideo,
    setCurrentView,
    sortBy,
    setSortBy,
  } = useAppStore();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder: "desc",
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategory) params.set("categoryId", selectedCategory);

      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      setVideos(data.videos || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error("Failed to fetch videos", e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, sortBy, page]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleVideoClick = (video: VideoItem) => {
    setCurrentVideo(video);
    setCurrentView("player");
  };

  const handleToggleFavorite = async (video: VideoItem) => {
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id }),
      });
      fetchVideos();
      onRefresh();
    } catch (e) {
      console.error("Failed to toggle favorite", e);
    }
  };

  const handleDelete = async (video: VideoItem) => {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
      fetchVideos();
      onRefresh();
    } catch (e) {
      console.error("Failed to delete video", e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-accent")}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="w-4 h-4" />
            ) : (
              <Grid3X3 className="w-4 h-4" />
            )}
          </Button>
          <Button onClick={() => setCurrentView("upload")} className="gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Category
            </label>
            <Select
              value={selectedCategory || "all"}
              onValueChange={(v) => {
                setSelectedCategory(v === "all" ? null : v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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
          <div className="min-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Added</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="views">Views</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="size">File Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchQuery || selectedCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} video{total !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Video grid/list */}
      {loading ? (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-2"
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn(viewMode === "grid" ? "space-y-3" : "flex gap-3")}>
              <Skeleton
                className={cn(
                  "rounded-xl",
                  viewMode === "grid" ? "w-full aspect-video" : "w-40 h-24 flex-shrink-0"
                )}
              />
              <div className={cn("space-y-2", viewMode === "list" && "py-1")}>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-1"
          )}
        >
          {videos.map((video) => (
            <div
              key={video.id}
              className={cn(
                viewMode === "grid" && "bg-card border border-border rounded-xl overflow-hidden"
              )}
            >
              <VideoCard
                video={video}
                onClick={() => handleVideoClick(video)}
                onToggleFavorite={() => handleToggleFavorite(video)}
                onDelete={() => handleDelete(video)}
                compact={viewMode === "list"}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No videos found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "Upload your first video to get started"}
          </p>
          <Button onClick={() => setCurrentView("upload")} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Video
          </Button>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}