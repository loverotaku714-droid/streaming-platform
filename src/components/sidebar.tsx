"use client";

import { useAppStore, type CategoryItem } from "@/store/app";
import { cn } from "@/lib/utils";
import {
  Home,
  Library,
  Upload,
  Clock,
  Heart,
  ListVideo,
  Play,
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const mainNavItems = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "library" as const, label: "Library", icon: Library },
  { id: "upload" as const, label: "Upload", icon: Upload },
  { id: "history" as const, label: "History", icon: Clock },
  { id: "favorites" as const, label: "Favorites", icon: Heart },
  { id: "playlists" as const, label: "Playlists", icon: ListVideo },
];

export function Sidebar({ categories }: { categories: CategoryItem[] }) {
  const {
    currentView,
    setCurrentView,
    sidebarOpen,
    toggleSidebar,
    selectedCategory,
    setSelectedCategory,
  } = useAppStore();

  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#ef4444");
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), color: newCatColor }),
      });
      setNewCatName("");
      setNewCatColor("#ef4444");
      setAddCatOpen(false);
      window.location.reload();
    } catch (e) {
      console.error("Failed to create category", e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (selectedCategory === id) setSelectedCategory(null);
      window.location.reload();
    } catch (e) {
      console.error("Failed to delete category", e);
    }
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg tracking-tight">MyStream</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {/* Main Navigation */}
          <nav className="p-2 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <Separator className="my-2 mx-2" />

          {/* Categories */}
          {sidebarOpen && (
            <div className="px-4 mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Categories
              </span>
              <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Movies, Tutorials..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newCatColor}
                          onChange={(e) => setNewCatColor(e.target.value)}
                          className="h-9 w-12 rounded cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground">{newCatColor}</span>
                      </div>
                    </div>
                    <Button onClick={handleAddCategory} className="w-full">
                      Create Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="px-2 space-y-1 pb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors",
                selectedCategory === null && currentView === "library"
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              )}
            >
              {sidebarOpen && <span>All</span>}
            </button>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={cn(
                  "group flex items-center rounded-lg transition-colors",
                  selectedCategory === cat.id && currentView === "library"
                    ? "bg-sidebar-accent"
                    : "hover:bg-sidebar-accent/50"
                )}
              >
                <button
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentView("library");
                  }}
                  className={cn(
                    "flex-1 flex items-center gap-3 px-3 py-1.5 text-sm text-left",
                    selectedCategory === cat.id && currentView === "library"
                      ? "text-sidebar-primary font-medium"
                      : "text-sidebar-foreground/70"
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  {sidebarOpen && (
                    <>
                      <span className="truncate">{cat.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {cat._count?.videos || 0}
                      </span>
                    </>
                  )}
                </button>
                {sidebarOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCatToDelete(cat.id);
                      handleDeleteCategory(cat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 mr-1 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile overlay */}
      {!sidebarOpen && (
        <div className="md:hidden fixed top-0 left-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="m-2"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </>
  );
}