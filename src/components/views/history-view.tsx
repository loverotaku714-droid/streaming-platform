"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore, type VideoItem, type WatchHistoryItem } from "@/store/app";
import { VideoCard } from "@/components/video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, Film } from "lucide-react";

export function HistoryView() {
  const { setCurrentVideo, setCurrentView } = useAppStore();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data || []);
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleVideoClick = (video: VideoItem) => {
    setCurrentVideo(video);
    setCurrentView("player");
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      fetchHistory();
    } catch (e) {
      console.error("Failed to delete history entry", e);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Clear all watch history?")) return;
    try {
      await Promise.all(history.map((h) => fetch(`/api/history?id=${h.id}`, { method: "DELETE" })));
      fetchHistory();
    } catch (e) {
      console.error("Failed to clear history", e);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Watch History
          </h1>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-40 h-24 rounded-lg flex-shrink-0" />
              <div className="space-y-2 py-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Watch History
        </h1>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-1">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl overflow-hidden group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <VideoCard
                    video={item.video}
                    onClick={() => handleVideoClick(item.video)}
                    compact
                    progress={item.progress}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-1"
                  onClick={() => handleDeleteEntry(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No watch history</h3>
          <p className="text-sm text-muted-foreground">
            Videos you watch will appear here
          </p>
        </div>
      )}
    </div>
  );
}