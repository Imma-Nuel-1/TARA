import { SiteContent } from "../models/SiteContent.js";
import { ContentItem } from "../models/ContentItem.js";
import { contentSchema } from "../validation/contentSchema.js";

const LEGACY_BASE = "http://localhost:5000/legacy";

const CODED_LOVE_LETTER = {
  heading: "Hi my love 💕",
  paragraphs: [
    "It's your day today, and I just want to talk to you properly, not in any rushed or half way way.",
    "First of all, happy birthday Halimah 💕 22 looks good on you already, and I hope you actually pause today and take in what this year means for you, Ajoke. I know I'm older, so I'll do a little bit of \"older person talk\" 😌",
    "22 is a beautiful age, but it is also a serious one. It is that stage where life starts to feel a bit more intentional. Things begin to matter more, decisions start shaping your direction, and you start seeing yourself more clearly. But honestly, I don't worry about you, Tara. You've always had something about you... focus, depth, and that quiet strength you carry even when you don't say much.",
    "And I trust you. I trust God over your life as well, Halimah. So I already know this year will not just be good for you, it will be meaningful for you.",
    "I'm genuinely glad I get to do life with you. Not in a perfect, romanticised way, but in a real way, Ajoke. The kind where we talk, we laugh, we disagree sometimes, we understand each other better over time, and we still choose each other in all of it.",
    "Today is not just another date. It is the day someone I deeply care about came into the world. And over time, that \"someone\" became my person... Halimah....",
    "You've changed my life in ways I don't always know how to explain properly. It's not loud or dramatic. It's in the small things... the way I think differently now, the way I care more, the way I plan more seriously about the future. You've influenced my life more than you probably realise.",
    "And I'll be honest with you, sometimes I just look at you and think... you're actually quite amazing, not in a perfect way, but in a real, human way that makes you even more special.",
    "I like how you love, Ajoke. You don't do things halfway. When you care, you care fully. When you're present, you're present properly. There's no pretending with you, and I respect that a lot.",
    "I also like how you push yourself, even when it's not easy. Even when you're tired or unsure, you still try, Tara. You don't always see how much I notice these things, but I do.",
    "And yes, I'll still tease you sometimes and act like I'm not impressed... but you already know the truth 😌",
    "Thank you for being patient with me, even when I'm not the easiest person to deal with.",
    "Thank you for understanding me even when I don't explain myself well, Halimah.",
    "Thank you for staying, even in moments where things could have gone differently, Ajoke.",
    "You don't just stand beside me, you grow with me, Tara. And I don't take that lightly.",
    "I want you to know something clearly today: you deserve a peaceful life. You deserve softness. You deserve to be celebrated properly, not just today, but in the way you are treated every day. You deserve consistency, care, and someone who shows up for you fully.",
    "And I will always try my best to be that person for you.",
    "I look forward to everything ahead of us, Halimah. Not just the big moments, but even the simple ones... the random conversations, the laughter, the quiet days, and everything in between. Those are the things that actually build something real.",
    "So as you celebrate today, I just hope you feel loved properly. Not just by me, but in general, by life, by people around you, by everything good coming your way, Ajoke.",
    "AJOKE MI💕",
    "I pray that this new year of your life brings you clarity, peace, and direction. I pray God surrounds you with genuine love, opens doors that align with your purpose, and strengthens you in every area where you feel unsure. I pray you don't struggle alone in silence, and that joy finds you easily this year. May your heart be settled, your mind be at peace, and your path be guided. And above all, may you continue to grow into everything God created you to be, with grace and confidence.",
    "You mean a lot to me, Halimah. More than I always say out loud.",
    "Happy birthday my love.",
    "To you, to your growth, and to everything ahead of you, Ajoke.",
    "Here's to you today.",
    "Here's to us.",
    "And here's to everything still coming. 💫",
    "I love you. Always.",
  ],
};

const defaultDocument = {
  singleton: "main",
  secretCode: "26022002",
  title: "Happy Birthday Halimah",
  loveLetter: {
    heading: CODED_LOVE_LETTER.heading,
    paragraphs: CODED_LOVE_LETTER.paragraphs,
  },
  playlist: [],
  notes: [],
  gallery: [],
};

export async function ensureDefaultContent() {
  const existing = await SiteContent.findOne({ singleton: "main" }).lean();
  if (!existing) {
    await SiteContent.create(defaultDocument);
    return;
  }

  if (!existing.playlist?.length) {
    await SiteContent.findOneAndUpdate(
      { singleton: "main" },
      {
        playlist: defaultDocument.playlist,
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

  const publishedItems = await ContentItem.find({ status: "published" })
    .sort({ createdAt: -1 })
    .lean();

  const contributedNotes = publishedItems
    .filter((item) => item.type === "message")
    .map((item) => ({
      name: item.createdBy || "Guest",
      role: item.data?.role || "Guest",
      avatarUrl:
        item.data?.avatarUrl ||
        `https://ui-avatars.com/api/?background=ffd6e8&color=a33665&name=${encodeURIComponent(
          item.createdBy || "Guest",
        )}`,
      message:
        typeof item.data === "string"
          ? item.data
          : item.data?.message || item.title || "",
    }));

  const contributedGallery = publishedItems
    .filter((item) => item.type === "image")
    .map((item) => {
      const data = item.data || {};
      const mediaUrl = String(data.url || "");
      const looksLikeVideo =
        mediaUrl.includes("/video/upload/") ||
        /(\.mp4|\.mov|\.webm|\.m4v|\.mkv)(\?|$)/i.test(mediaUrl);
      const originalFileName =
        data.originalFileName ||
        mediaUrl.split("/").pop()?.split("?")[0] ||
        "";
      return {
        imageUrl: mediaUrl,
        caption: data.caption || item.title || "Shared memory",
        mediaType:
          data.mediaType === "video" || data.mediaType === "image"
            ? data.mediaType
            : looksLikeVideo
              ? "video"
              : "image",
        originalFileName,
      };
    })
    .filter((item) => Boolean(item.imageUrl));

  const { _id, singleton, __v, createdAt, updatedAt, ...publicContent } =
    content;

  return res.json({
    ...publicContent,
    loveLetter: CODED_LOVE_LETTER,
    notes: contributedNotes,
    gallery: contributedGallery,
  });
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

export async function saveAdminMessage(req, res) {
  try {
    const { text, imageUrl, imageMediaType } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const adminMessage = {
      text: text.trim(),
      imageUrl: imageUrl || null,
      imageMediaType: imageMediaType || "image",
    };

    const updated = await SiteContent.findOneAndUpdate(
      { singleton: "main" },
      { adminMessage },
      { new: true },
    );

    return res.json({
      message: "Your message has been pinned!",
      adminMessage: updated.adminMessage,
    });
  } catch (err) {
    console.error("Failed to save admin message:", err);
    return res.status(500).json({ message: "Failed to save admin message" });
  }
}

export async function deleteAdminMessage(req, res) {
  try {
    const updated = await SiteContent.findOneAndUpdate(
      { singleton: "main" },
      { adminMessage: null },
      { new: true },
    );

    return res.json({ message: "Your message has been unpinned" });
  } catch (err) {
    console.error("Failed to delete admin message:", err);
    return res.status(500).json({ message: "Failed to delete admin message" });
  }
}
