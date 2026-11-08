// Reads /gallery and writes gallery.json.
// File name format: YYYY-MM-DD_Title-of-work_Medium.ext  (dashes become spaces)
// Example: 2025-03-14_Cuisine-nuit_Painting.jpg
const fs = require("fs");

const media = /\.(jpe?g|png|webp|gif|mp4|webm)$/i;
const video = /\.(mp4|webm)$/i;
const words = s => (s || "").replace(/-/g, " ").trim();

const items = fs.readdirSync("gallery")
  .filter(f => media.test(f))
  .map(f => {
    const [date, title, medium] = f.replace(/\.[^.]+$/, "").split("_");
    return { file: "gallery/" + f, date, title: words(title), medium: words(medium), video: video.test(f) };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync("gallery.json", JSON.stringify(items, null, 1));
console.log(`gallery.json: ${items.length} items`);
