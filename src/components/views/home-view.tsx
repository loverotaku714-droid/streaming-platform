"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore, type VideoItem, type CategoryItem } from "@/store/app";
import { VideoCard } from "@/components/video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Play, Film } from "lucide-react";

interface HomeViewProps {
  categories: CategoryItem[];
}

export function HomeView({ categories }: HomeViewProps) {
  const { setCurrentView, setCurrentVideo, setSearchQuery } = useAppStore();
  const [recentVideos, setRecentVideos] = useState<VideoItem[]>([]);
  const [topVideos, setTopVideos] = useState<VideoItem[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [recentRes, topRes, allRes, favRes] = await Promise.all([
        fetch("/api/videos?sortBy=createdAt&sortOrder=desc&limit=8"),
        fetch("/api/videos?sortBy=views&sortOrder=desc&limit=4"),
        fetch("/api/videos?limit=1"),
        fetch("/api/favorites"),
      ]);
      const recentData = await recentRes.json();
      const topData = await topRes.json();
      const allData = await allRes.json();
      const favData = await favRes.json();
      setRecentVideos(recentData.videos || []);
      setTopVideos(topData.videos || []);
      setTotalVideos(allData.pagination?.total || 0);
      setTotalFavorites(Array.isArray(favData) ? favData.length : 0);
    } catch (e) {
      console.error("Failed to fetch home data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fetchData();
    } catch (e) {
      console.error("Failed to toggle favorite", e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero search section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/10 p-6 sm:p-10">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to MyStream</h1>
          <p className="text-muted-foreground mb-6">
            Your personal video library, organized and ready to watch.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your videos..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setCurrentView("library");
              }}
            />
          </div>
        </div>
        <div className="absolute right-6 bottom-6 opacity-10">
          <Film className="w-32 h-32" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Videos", value: totalVideos.toString(), icon: Film },
          { label: "Categories", value: categories.length.toString(), icon: Play },
          { label: "Top Views", value: topVideos[0]?.views?.toLocaleString() || "0", icon: TrendingUp },
          { label: "Favorites", value: totalFavorites.toString(), icon: Play },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recently Added */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recently Added</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full aspect-video rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : recentVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentVideos.map((video) => (
              <div key={video.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <VideoCard
                  video={video}
                  onClick={() => handleVideoClick(video)}
                  onToggleFavorite={() => handleToggleFavorite(video)}
                  showMeta={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Film}
            title="No videos yet"
            description="Upload your first video to get started"
            actionLabel="Upload Video"
            onAction={() => setCurrentView("upload")}
          />
        )}
      </section>

      {/* Top viewed */}
      {topVideos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Most Watched
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topVideos.map((video) => (
              <div key={video.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <VideoCard
                  video={video}
                  onClick={() => handleVideoClick(video)}
                  onToggleFavorite={() => handleToggleFavorite(video)}
                  compact
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories preview */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Categories</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("library")}
            >
              View All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="outline"
                className="gap-2"
                onClick={() => {
                  useAppStore.getState().setSelectedCategory(cat.id);
                  setCurrentView("library");
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
                <span className="text-xs text-muted-foreground">
                  ({cat._count?.videos || 0})
                </span>
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}