"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore, type CategoryItem } from "@/store/app";
import { Sidebar } from "@/components/sidebar";
import { HomeView } from "@/components/views/home-view";
import { LibraryView } from "@/components/views/library-view";
import { PlayerView } from "@/components/views/player-view";
import { HistoryView } from "@/components/views/history-view";
import { FavoritesView } from "@/components/views/favorites-view";
import { PlaylistsView } from "@/components/views/playlists-view";
import { UploadView } from "@/components/views/upload-view";
import { cn } from "@/lib/utils";
import { Upload, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { currentView, sidebarOpen, toggleSidebar, uploadOpen, setUploadOpen } = useAppStore();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (!cancelled) setCategories(data || []);
      } catch (e) {
        if (!cancelled) console.error("Failed to fetch categories", e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    refreshRef.current += 1;
    setRefreshKey(refreshRef.current);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case "home":
        return <HomeView categories={categories} />;
      case "library":
        return <LibraryView categories={categories} onRefresh={handleRefresh} />;
      case "player":
        return <PlayerView categories={categories} />;
      case "upload":
        return <UploadView categories={categories} onRefresh={handleRefresh} />;
      case "history":
        return <HistoryView />;
      case "favorites":
        return <FavoritesView />;
      case "playlists":
        return <PlaylistsView />;
      default:
        return <HomeView categories={categories} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar categories={categories} />

      {/* Main content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "md:ml-60" : "md:ml-16"
        )}
      >
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={toggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {renderView()}
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          MyStream — Personal Streaming Platform
        </footer>
      </main>
    </div>
  );
}