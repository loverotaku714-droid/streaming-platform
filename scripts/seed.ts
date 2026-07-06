import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding database...");

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Movies", description: "Feature films and short films", color: "#ef4444", order: 0 },
    }),
    prisma.category.create({
      data: { name: "Tutorials", description: "Educational and how-to content", color: "#22c55e", order: 1 },
    }),
    prisma.category.create({
      data: { name: "Music", description: "Music videos and concerts", color: "#a855f7", order: 2 },
    }),
    prisma.category.create({
      data: { name: "Travel", description: "Travel vlogs and documentaries", color: "#06b6d4", order: 3 },
    }),
    prisma.category.create({
      data: { name: "Tech", description: "Technology reviews and demos", color: "#f59e0b", order: 4 },
    }),
  ]);

  // Create sample videos
  const sampleVideos = [
    { title: "Ocean Sunset Timelapse", desc: "Beautiful 4K timelapse of a sunset over the Pacific Ocean", catId: categories[3].id, dur: 180, size: 52000000, views: 42, fav: true },
    { title: "Introduction to TypeScript", desc: "A comprehensive beginner's guide to TypeScript programming", catId: categories[1].id, dur: 2400, size: 380000000, views: 128, fav: true },
    { title: "Lo-fi Beats Compilation", desc: "Relaxing lo-fi hip hop beats for studying and working", catId: categories[2].id, dur: 3600, size: 120000000, views: 256, fav: false },
    { title: "Tokyo Street Food Tour", desc: "Exploring the best street food in Shibuya and Shinjuku", catId: categories[3].id, dur: 900, size: 68000000, views: 87, fav: true },
    { title: "Mountain Trail Documentary", desc: "Following the Appalachian Trail through changing seasons", catId: categories[3].id, dur: 4800, size: 750000000, views: 34, fav: false },
    { title: "Building a React App from Scratch", desc: "Step-by-step tutorial on building a modern React application", catId: categories[1].id, dur: 1800, size: 290000000, views: 195, fav: false },
    { title: "MacBook Pro 2025 Review", desc: "Honest review of the latest MacBook Pro with M5 chip", catId: categories[4].id, dur: 1200, size: 190000000, views: 73, fav: false },
    { title: "Piano Concerto No. 21", desc: "Mozart's Piano Concerto No. 21 performed live", catId: categories[2].id, dur: 2100, size: 320000000, views: 61, fav: true },
    { title: "Indie Film: The Last Light", desc: "Award-winning short film about hope in a post-apocalyptic world", catId: categories[0].id, dur: 2700, size: 420000000, views: 156, fav: true },
    { title: "CSS Grid Masterclass", desc: "Advanced CSS Grid techniques for modern layouts", catId: categories[1].id, dur: 1500, size: 240000000, views: 89, fav: false },
    { title: "Northern Lights in Iceland", desc: "Capturing the aurora borealis across Iceland's wilderness", catId: categories[3].id, dur: 600, size: 95000000, views: 112, fav: true },
    { title: "Smart Home Setup Guide", desc: "Complete guide to setting up a smart home system", catId: categories[4].id, dur: 2100, size: 330000000, views: 45, fav: false },
  ];

  const createdVideos = [];
  for (const v of sampleVideos) {
    const video = await prisma.video.create({
      data: {
        title: v.title,
        description: v.desc,
        filePath: "/uploads/sample.mp4",
        duration: v.dur,
        size: v.size,
        mimeType: "video/mp4",
        categoryId: v.catId,
        isFavorite: v.fav,
        views: v.views,
      },
    });
    createdVideos.push(video);
  }

  // Create some watch history
  await Promise.all([
    prisma.watchHistory.create({ data: { videoId: createdVideos[0].id, progress: 0.65 } }),
    prisma.watchHistory.create({ data: { videoId: createdVideos[1].id, progress: 0.3 } }),
    prisma.watchHistory.create({ data: { videoId: createdVideos[2].id, progress: 0.85 } }),
    prisma.watchHistory.create({ data: { videoId: createdVideos[4].id, progress: 0.12 } }),
    prisma.watchHistory.create({ data: { videoId: createdVideos[8].id, progress: 0.5 } }),
  ]);

  // Create a sample playlist
  const playlist = await prisma.playlist.create({
    data: {
      name: "Weekend Watch",
      description: "Videos to watch over the weekend",
    },
  });

  await Promise.all([
    prisma.playlistItem.create({ data: { playlistId: playlist.id, videoId: createdVideos[0].id, order: 0 } }),
    prisma.playlistItem.create({ data: { playlistId: playlist.id, videoId: createdVideos[8].id, order: 1 } }),
    prisma.playlistItem.create({ data: { playlistId: playlist.id, videoId: createdVideos[10].id, order: 2 } }),
  ]);

  console.log("Seeded " + categories.length + " categories, " + createdVideos.length + " videos, and sample data.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });