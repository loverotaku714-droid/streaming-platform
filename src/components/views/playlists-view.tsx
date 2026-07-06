"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore, type VideoItem, type PlaylistItem } from "@/store/app";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ListVideo, Plus, Trash2, GripVertical } from "lucide-react";

export function PlaylistsView() {
  const { setCurrentVideo, setCurrentView } = useAppStore();
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/playlists");
      const data = await res.json();
      setPlaylists(data || []);
    } catch (e) {
      console.error("Failed to fetch playlists", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
      });
      setNewName("");
      setNewDesc("");
      setCreateOpen(false);
      fetchPlaylists();
    } catch (e) {
      console.error("Failed to create playlist", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this playlist?")) return;
    try {
      await fetch(`/api/playlists?id=${id}`, { method: "DELETE" });
      fetchPlaylists();
    } catch (e) {
      console.error("Failed to delete playlist", e);
    }
  };

  const handleVideoClick = (video: VideoItem) => {
    setCurrentVideo(video);
    setCurrentView("player");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ListVideo className="w-6 h-6" />
          Playlists
        </h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <Skeleton className="h-5 w-1/3 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ListVideo className="w-6 h-6" />
          Playlists
        </h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Playlist"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe this playlist"
                />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!newName.trim()}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {playlists.length > 0 ? (
        <div className="space-y-3">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() =>
                  setExpandedPlaylist(expandedPlaylist === playlist.id ? null : playlist.id)
                }
              >
                <div>
                  <h3 className="font-semibold">{playlist.name}</h3>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {playlist.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {playlist.items.length} video{playlist.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(playlist.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {expandedPlaylist === playlist.id && playlist.items.length > 0 && (
                <div className="border-t border-border p-3 space-y-1">
                  {playlist.items.map((item) => (
                    <VideoCard
                      key={item.id}
                      video={item.video}
                      onClick={() => handleVideoClick(item.video)}
                      compact
                      showMeta={false}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ListVideo className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No playlists yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create playlists to organize your videos
          </p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Playlist
          </Button>
        </div>
      )}
    </div>
  );
}