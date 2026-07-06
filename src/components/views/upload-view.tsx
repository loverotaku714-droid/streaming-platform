"use client";

import { useState } from "react";
import { useAppStore, type CategoryItem } from "@/store/app";
import { UploadDialog } from "@/components/upload-dialog";
import { Film, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadViewProps {
  categories: CategoryItem[];
  onRefresh: () => void;
}

export function UploadView({ categories, onRefresh }: UploadViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Upload Videos</h1>

      {/* Main upload zone */}
      <div
        className="border-2 border-dashed border-border rounded-2xl p-12 sm:p-16 text-center hover:border-primary/50 transition-colors cursor-pointer group"
        onClick={() => setDialogOpen(true)}
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
          <Upload className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Upload Video Files</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Drag and drop your video files or click to browse. Supports MP4, WebM, MKV, AVI, and MOV formats.
        </p>
        <Button size="lg" className="gap-2">
          <Upload className="w-5 h-5" />
          Select Files
        </Button>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-medium mb-1">Multiple Formats</h3>
          <p className="text-sm text-muted-foreground">
            Upload videos in MP4, WebM, MKV, AVI, or MOV format. The player handles them all.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-medium mb-1">Custom Thumbnails</h3>
          <p className="text-sm text-muted-foreground">
            Add custom thumbnails to make your videos easily recognizable in the library.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-medium mb-1">Organize</h3>
          <p className="text-sm text-muted-foreground">
            Categorize your videos and add descriptions to keep everything organized.
          </p>
        </div>
      </div>

      <UploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        onUploadComplete={onRefresh}
      />
    </div>
  );
}