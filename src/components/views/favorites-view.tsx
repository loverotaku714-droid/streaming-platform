"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore, type VideoItem } from "@/store/app";
import { VideoCard } from "@/components/video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Film } from "lucide-react";

export function FavoritesView() {
  const { setCurrentVideo, setCurrentView } = useAppStore();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favorites");
      const data = await res.json();
      setVideos(data || []);
    } catch (e) {
      console.error("Failed to fetch favorites", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

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
      fetchFavorites();
    } catch (e) {
      console.error("Failed to toggle favorite", e);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Favorites
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="w-full aspect-video rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-500" />
        Favorites
        {videos.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({videos.length})
          </span>
        )}
      </h1>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <VideoCard
                video={video}
                onClick={() => handleVideoClick(video)}
                onToggleFavorite={() => handleToggleFavorite(video)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No favorites yet</h3>
          <p className="text-sm text-muted-foreground">
            Click the heart icon on any video to add it here
          </p>
        </div>
      )}
    </div>
  );
}