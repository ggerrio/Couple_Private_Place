// ─── Types ────────────────────────────────────────────────────────────

export interface LyricLine {
  time: number;
  text: string;
}

export interface PlaylistTrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

export type SortMode = "recent" | "oldest" | "az" | "za";
export type RepeatMode = "off" | "one" | "all";

// ─── ISO Duration Parser ──────────────────────────────────────────────

export function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  return (h * 3600 + m * 60 + s) * 1000;
}

// ─── Time Formatting ──────────────────────────────────────────────────

export const formatTime = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

// ─── LRC Parser ─────────────────────────────────────────────────────

export function parseLrc(raw: string): LyricLine[] {
  const timeTag = /\[(\d{2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  const lines: LyricLine[] = [];
  for (const rawLine of raw.split("\n")) {
    const tags = [...rawLine.matchAll(timeTag)];
    if (tags.length === 0) continue;
    const text = rawLine.replace(timeTag, "").trim();
    for (const tag of tags) {
      const min = parseInt(tag[1], 10);
      const sec = parseInt(tag[2], 10);
      const frac = tag[3] ? parseInt(tag[3].padEnd(3, "0").slice(0, 3), 10) : 0;
      lines.push({ time: min * 60000 + sec * 1000 + frac, text: text || "♪" });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

// ─── Search Term Cleaner ──────────────────────────────────────────────

export function cleanSearchTerm(
  title: string,
  artist: string
): { cleanTitle: string; cleanArtist: string } {
  let t = title;
  let a = artist;
  t = t.replace(/\(.*?\)/g, "");
  t = t.replace(/\[.*?\]/g, "");
  t = t.replace(
    /(official video|official audio|official lyric video|official music video|music video|lyric video|official|mv|audio|video)/gi,
    ""
  );
  if (t.includes(" - ")) {
    const parts = t.split(" - ");
    if (parts.length === 2) {
      if (
        !a ||
        a.toLowerCase() === "unknown artist" ||
        a.toLowerCase() === parts[0].trim().toLowerCase() ||
        parts[0].trim().toLowerCase().includes(a.toLowerCase())
      ) {
        a = parts[0].trim();
      }
      t = parts[1];
    }
  }
  if (a.toLowerCase() === "unknown artist") a = "";
  return { cleanTitle: t.trim(), cleanArtist: a.trim() };
}

// ─── YouTube API Helpers ──────────────────────────────────────────────

export async function fetchVideoDuration(videoId: string): Promise<number> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
  if (!apiKey || !videoId) return 0;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
    );
    const json = await res.json();
    const iso = json.items?.[0]?.contentDetails?.duration;
    return iso ? parseIsoDuration(iso) : 0;
  } catch {
    return 0;
  }
}

export async function fetchVideoMeta(
  videoId: string
): Promise<{ title: string; artist: string; artwork: string; durationMs: number } | null> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
  if (!apiKey || !videoId) return null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
    );
    const json = await res.json();
    const item = json.items?.[0];
    if (!item) return null;
    return {
      title: item.snippet?.title || "YouTube Track",
      artist: item.snippet?.channelTitle || "",
      artwork: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      durationMs: item.contentDetails?.duration ? parseIsoDuration(item.contentDetails.duration) : 0,
    };
  } catch {
    return null;
  }
}

export async function fetchLyrics(
  title: string,
  artist: string,
  signal: AbortSignal
): Promise<{ lines: LyricLine[]; synced: boolean } | null> {
  if (!title.trim()) return null;
  const { cleanTitle, cleanArtist } = cleanSearchTerm(title, artist);
  const tryFetch = async (
    tName: string,
    aName: string
  ): Promise<{ lines: LyricLine[]; synced: boolean } | null> => {
    try {
      const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(tName)}&artist_name=${encodeURIComponent(aName)}`;
      const res = await fetch(url, { signal });
      if (!res.ok) return null;
      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) return null;
      const best = results.find((r: any) => r.syncedLyrics) || results.find((r: any) => r.plainLyrics) || null;
      if (!best) return null;
      if (best.syncedLyrics) {
        const lines = parseLrc(best.syncedLyrics);
        return lines.length > 0 ? { lines, synced: true } : null;
      }
      if (best.plainLyrics) {
        const lines = best.plainLyrics.split("\n").filter((l: string) => l.trim()).map((text: string) => ({ time: 0, text }));
        return lines.length > 0 ? { lines, synced: false } : null;
      }
      return null;
    } catch {
      return null;
    }
  };
  let result = await tryFetch(cleanTitle, cleanArtist);
  if (!result && (cleanTitle !== title || cleanArtist !== artist)) {
    result = await tryFetch(title, artist);
  }
  return result;
}

// ─── YouTube Playlist Fetcher ─────────────────────────────────────────

export async function fetchPlaylist(
  playlistId: string,
  apiKey: string,
  signal: AbortSignal
): Promise<PlaylistTrack[]> {
  const allTracks: PlaylistTrack[] = [];
  let nextPageToken = "";
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;
    const res = await fetch(url, { signal });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || "Playlist request failed");
    const pageTracks: PlaylistTrack[] = (json.items || [])
      .filter((it: any) => it.snippet?.title && it.snippet.title !== "Deleted video" && it.snippet.title !== "Private video")
      .map((it: any) => ({
        videoId: it.snippet.resourceId?.videoId,
        title: it.snippet.title,
        artist: it.snippet.videoOwnerChannelTitle || it.snippet.channelTitle || "Unknown Artist",
        thumbnail: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || "",
      }))
      .filter((t: PlaylistTrack) => !!t.videoId);
    allTracks.push(...pageTracks);
    nextPageToken = json.nextPageToken || "";
  } while (nextPageToken);
  return allTracks;
}

// ─── Video ID Extraction ──────────────────────────────────────────────

export function extractVideoId(url: string): string {
  if (!url.trim()) return "";
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|watch\?v=|\?v=)([\w-]{11})/);
  if (match) return match[1];
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return "";
}

// ─── Haptic ───────────────────────────────────────────────────────────

export { triggerHaptic } from "../../lib/haptics";
