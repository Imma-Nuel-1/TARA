import { SiteContent } from "../models/SiteContent.js";
import { contentSchema } from "../validation/contentSchema.js";

const LEGACY_BASE = "http://localhost:5000/legacy";

const defaultDocument = {
  singleton: "main",
  secretCode: "26022002",
  title: "Happy Birthday Temini",
  loveLetter: {
    heading: "My Dearest Temini",
    paragraphs: [
      "Hi my MI MI 💕",
      "As per I’m older than you, let me give you tips. 24 is lovely and at the same time tasking. 24 is not for the weak but for the strong like you.",
      "I trust God and I trust you to have a lovely 24 years of age. Happy birthday MI MI I LOVE YOU.",
      "Today is not just another date on the calendar. It’s the day the world was blessed with you.",
      "I admire the way you love. You love intentionally. You love deeply. You love without keeping score.",
      "Thank you for being patient with me and believing in me even when I doubted myself.",
      "You deserve soft love, peace, celebration, and joy. Here’s to forever. Happy Birthday, my love.",
    ],
  },
  playlist: [
    {
      name: "Need Me",
      artist: "Fireboy DML",
      duration: 210,
      url: `${LEGACY_BASE}/music/Fireboy-DML-Need-Me-.mp3`,
    },
    {
      name: "Nana",
      artist: "Peruzzi",
      duration: 212,
      url: `${LEGACY_BASE}/music/Peruzzi-Nana-Audio-.mp3`,
    },
    {
      name: "By You",
      artist: "Simi ft. Adekunle Gold",
      duration: 220,
      url: `${LEGACY_BASE}/music/Simi_ft_Adekunle_Gold_-_-_By_You.mp3`,
    },
    {
      name: "Complete Me",
      artist: "Simi",
      duration: 210,
      url: `${LEGACY_BASE}/music/Simi-Complete-Me-(JustNaija.com).mp3`,
    },
    {
      name: "Special Message",
      artist: "From Me",
      duration: 180,
      url: `${LEGACY_BASE}/music/special message.mp3`,
    },
  ],
  notes: [
    {
      name: "Christian",
      role: "Friend",
      avatarUrl: `${LEGACY_BASE}/images/man1.jpg`,
      message:
        "Happy Birthday, Imisioluwa! I’m truly grateful to have you as a friend. May this new year bring you happiness, progress, health, and success.",
    },
    {
      name: "Precious (smallie)",
      role: "Close Friend",
      avatarUrl: `${LEGACY_BASE}/images/girl.jpg`,
      message:
        "From 100 level till now, you’ve been amazing. I hope this birthday reminds you how special and loved you are.",
    },
    {
      name: "Feyinti",
      role: "Brother",
      avatarUrl: `${LEGACY_BASE}/images/fiy.jpg`,
      message:
        "Wishing you abundance, clarity, growth, and continued success. You deserve nothing but the best.",
    },
    {
      name: "ABIMBOLA",
      role: "Close friend",
      avatarUrl: `${LEGACY_BASE}/images/bimbo.jpg`,
      message:
        "Happy Birthday imisioluwa, may your days be filled with love and favor.",
    },
    {
      name: "Dare",
      role: "Brother",
      avatarUrl: `${LEGACY_BASE}/images/dare.jpg`,
      message:
        "Happy birthday to my sweet girl, my go-to person and safe space.",
    },
    {
      name: "Sis Lizzy",
      role: "Sister",
      avatarUrl: `${LEGACY_BASE}/images/sislizzy.jpg`,
      message:
        "Happy birthday to a kind and beautiful soul. May life reward your kindness with happiness and peace.",
    },
    {
      name: "Mary",
      role: "Close friend",
      avatarUrl: `${LEGACY_BASE}/images/marry.jpg`,
      message:
        "Happy birthday to my sweet girl, thank you for being my best girl and safe space.",
    },
    {
      name: "Busayo o",
      role: "Friend",
      avatarUrl: `${LEGACY_BASE}/images/busayo.jpg`,
      message:
        "Happy Birthday to my chocomillo, a sister by heart. Wishing you joy, peace, and everything beautiful.",
    },
    {
      name: "Temilorun",
      role: "Sister",
      avatarUrl: `${LEGACY_BASE}/images/temilorun.jpg`,
      message:
        "Wishing you a day filled with joy, laughter, and love. Enjoy your special day and have an amazing year ahead.",
    },
  ],
  gallery: [
    { imageUrl: `${LEGACY_BASE}/images/img2.jpg`, caption: "Our Love" },
    { imageUrl: `${LEGACY_BASE}/images/img8.jpg`, caption: "Beautiful Bloom" },
    { imageUrl: `${LEGACY_BASE}/images/img555.jpg`, caption: "Sweet Moments" },
    { imageUrl: `${LEGACY_BASE}/images/img9.jpg`, caption: "Sunset Love" },
    { imageUrl: `${LEGACY_BASE}/images/img1.jpg`, caption: "Heart of Mine" },
    { imageUrl: `${LEGACY_BASE}/images/img333.jpg`, caption: "Blooming Love" },
    { imageUrl: `${LEGACY_BASE}/images/img3.jpg`, caption: "Together Forever" },
    { imageUrl: `${LEGACY_BASE}/images/img4.jpg`, caption: "Your Beauty" },
    { imageUrl: `${LEGACY_BASE}/images/img5.jpg`, caption: "Pure Love" },
    { imageUrl: `${LEGACY_BASE}/images/img6.jpg`, caption: "Happiness" },
    { imageUrl: `${LEGACY_BASE}/images/img7.jpg`, caption: "Cherished Times" },
    { imageUrl: `${LEGACY_BASE}/images/img11.jpg`, caption: "Forever Mine" },
  ],
};

export async function ensureDefaultContent() {
  const existing = await SiteContent.findOne({ singleton: "main" }).lean();
  if (!existing) {
    await SiteContent.create(defaultDocument);
    return;
  }

  const shouldBackfill =
    (existing.loveLetter?.paragraphs?.length || 0) <
      defaultDocument.loveLetter.paragraphs.length ||
    !existing.playlist?.length ||
    !existing.notes?.length ||
    !existing.gallery?.length;

  if (shouldBackfill) {
    await SiteContent.findOneAndUpdate(
      { singleton: "main" },
      {
        secretCode: existing.secretCode || defaultDocument.secretCode,
        title: existing.title || defaultDocument.title,
        loveLetter:
          (existing.loveLetter?.paragraphs?.length || 0) >=
          defaultDocument.loveLetter.paragraphs.length
            ? existing.loveLetter
            : defaultDocument.loveLetter,
        playlist:
          existing.playlist?.length > 0
            ? existing.playlist
            : defaultDocument.playlist,
        notes:
          existing.notes?.length > 0 ? existing.notes : defaultDocument.notes,
        gallery:
          existing.gallery?.length > 0
            ? existing.gallery
            : defaultDocument.gallery,
      },
      { new: true },
    );
  }
}

export async function getPublicContent(req, res) {
  const content = await SiteContent.findOne({ singleton: "main" }).lean();
  if (!content) {
    return res.status(404).json({ message: "Content not found" });
  }

  const { _id, singleton, __v, createdAt, updatedAt, ...publicContent } =
    content;
  return res.json(publicContent);
}

export async function getAdminContent(req, res) {
  const content = await SiteContent.findOne({ singleton: "main" }).lean();
  if (!content) {
    return res.status(404).json({ message: "Content not found" });
  }

  return res.json(content);
}

export async function updateAdminContent(req, res) {
  const parsed = contentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.flatten(),
    });
  }

  const updated = await SiteContent.findOneAndUpdate(
    { singleton: "main" },
    { ...parsed.data, singleton: "main" },
    { new: true, upsert: true },
  ).lean();

  return res.json(updated);
}
