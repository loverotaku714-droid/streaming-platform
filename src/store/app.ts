import { create } from "zustand";

export type ViewMode = "home" | "library" | "player" | "upload" | "history" | "favorites" | "playlists";

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  filePath: string;
  thumbnailPath: string | null;
  duration: number;
  size: number;
  mimeType: string;
  categoryId: string | null;
  isFavorite: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    description: string | null;
    color: string;
  } | null;
}

interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  order: number;
  _count?: { videos: number };
}

interface WatchHistoryItem {
  id: string;
  videoId: string;
  progress: number;
  watchedAt: string;
  video: VideoItem;
}

interface PlaylistItem {
  id: string;
  name: string;
  description: string | null;
  items: {
    id: string;
    order: number;
    addedAt: string;
    video: VideoItem;
  }[];
}

interface AppState {
  // Navigation
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  previousView: ViewMode;
  setPreviousView: (view: ViewMode) => void;

  // Current video being played
  currentVideo: VideoItem | null;
  setCurrentVideo: (video: VideoItem | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Selected category filter
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;

  // Upload modal
  uploadOpen: boolean;
  setUploadOpen: (open: boolean) => void;

  // Sort
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "home",
  setCurrentView: (view) => set({ currentView: view }),
  previousView: "home",
  setPreviousView: (view) => set({ previousView: view }),

  currentVideo: null,
  setCurrentVideo: (video) => set({ currentVideo: video }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  selectedCategory: null,
  setSelectedCategory: (id) => set({ selectedCategory: id }),

  uploadOpen: false,
  setUploadOpen: (open) => set({ uploadOpen: open }),

  sortBy: "createdAt",
  setSortBy: (sort) => set({ sortBy: sort }),
}));

export type { VideoItem, CategoryItem, WatchHistoryItem, PlaylistItem };