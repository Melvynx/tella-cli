import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ListOpts {
  cursor?: string;
  limit?: string;
  playlistId?: string;
  fields?: string;
  json?: boolean;
  format?: string;
}

interface UpdateOpts {
  name?: string;
  description?: string;
  linkScope?: string;
  password?: string;
  allowedEmbedDomains?: string;
  customThumbnailUrl?: string;
  defaultPlaybackRate?: string;
  captionsDefaultEnabled?: string;
  commentEmailsEnabled?: string;
  commentsEnabled?: string;
  downloadsEnabled?: string;
  publishDateEnabled?: string;
  rawDownloadsEnabled?: string;
  searchEngineIndexingEnabled?: string;
  transcriptsEnabled?: string;
  viewCountEnabled?: string;
  json?: boolean;
  format?: string;
}

interface ThumbOpts {
  format?: string;
  inpointMs?: string;
  durationMs?: string;
  width?: string;
  height?: string;
  download?: boolean;
  response?: string;
  json?: boolean;
}

interface ExportOpts {
  resolution?: string;
  fps?: string;
  speed?: string;
  granularity?: string;
  subtitles?: boolean;
  json?: boolean;
  format?: string;
}

interface DuplicateOpts {
  name?: string;
  trimStartTimeMs?: string;
  trimEndTimeMs?: string;
  json?: boolean;
  format?: string;
}

interface CollabOpts {
  email: string;
  role: string;
  json?: boolean;
  format?: string;
}

const parseBool = (v?: string): boolean | undefined => {
  if (v === undefined) return undefined;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
};

export const videosResource = new Command("videos").description("Manage Tella videos");

videosResource
  .command("list")
  .description("List all videos in the workspace")
  .option("--cursor <cursor>", "Pagination cursor from a previous response")
  .option("--limit <n>", "Max number of videos to return")
  .option("--playlist-id <id>", "Only return videos in this playlist")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tella-cli videos list\n  tella-cli videos list --limit 50 --json\n  tella-cli videos list --playlist-id pl_abc123",
  )
  .action(async (opts: ListOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.cursor) params.cursor = opts.cursor;
      if (opts.limit) params.limit = opts.limit;
      if (opts.playlistId) params.playlistId = opts.playlistId;
      const data = await client.get("/v1/videos", params);
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

videosResource
  .command("get")
  .description("Get a single video's metadata")
  .argument("<id>", "Video ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  tella-cli videos get vid_abc123")
  .action(async (id: string, opts: ListOpts) => {
    try {
      const data = await client.get(`/v1/videos/${id}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

videosResource
  .command("update")
  .description("Update video metadata, sharing, or playback settings")
  .argument("<id>", "Video ID")
  .option("--name <name>", "Video title")
  .option("--description <text>", "Video description")
  .option(
    "--link-scope <scope>",
    "Access level: public, private, password, embedonly",
  )
  .option("--password <pw>", "Password (required when link-scope=password)")
  .option(
    "--allowed-embed-domains <list>",
    "Comma-separated domains permitted to embed (Premium)",
  )
  .option("--custom-thumbnail-url <url>", "Custom thumbnail image URL")
  .option("--default-playback-rate <rate>", "Default playback rate (0.5-2.0)")
  .option("--captions-default-enabled <bool>", "Show captions by default (true/false)")
  .option("--comment-emails-enabled <bool>", "Notify on new comments (true/false)")
  .option("--comments-enabled <bool>", "Allow comments (true/false)")
  .option("--downloads-enabled <bool>", "Allow viewer downloads (true/false)")
  .option("--publish-date-enabled <bool>", "Show publish date (true/false)")
  .option("--raw-downloads-enabled <bool>", "Allow raw source downloads (true/false)")
  .option("--search-engine-indexing-enabled <bool>", "Allow SEO indexing (true/false)")
  .option("--transcripts-enabled <bool>", "Show transcript panel (true/false)")
  .option("--view-count-enabled <bool>", "Show view count (true/false)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExample:\n  tella-cli videos update vid_abc123 --name "New Title" --link-scope private',
  )
  .action(async (id: string, opts: UpdateOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name !== undefined) body.name = opts.name;
      if (opts.description !== undefined) body.description = opts.description;
      if (opts.linkScope) body.linkScope = opts.linkScope;
      if (opts.password) body.password = opts.password;
      if (opts.allowedEmbedDomains)
        body.allowedEmbedDomains = opts.allowedEmbedDomains.split(",").map((s) => s.trim());
      if (opts.customThumbnailUrl) body.customThumbnailURL = opts.customThumbnailUrl;
      if (opts.defaultPlaybackRate)
        body.defaultPlaybackRate = Number(opts.defaultPlaybackRate);
      const bools: [string, string | undefined][] = [
        ["captionsDefaultEnabled", opts.captionsDefaultEnabled],
        ["commentEmailsEnabled", opts.commentEmailsEnabled],
        ["commentsEnabled", opts.commentsEnabled],
        ["downloadsEnabled", opts.downloadsEnabled],
        ["publishDateEnabled", opts.publishDateEnabled],
        ["rawDownloadsEnabled", opts.rawDownloadsEnabled],
        ["searchEngineIndexingEnabled", opts.searchEngineIndexingEnabled],
        ["transcriptsEnabled", opts.transcriptsEnabled],
        ["viewCountEnabled", opts.viewCountEnabled],
      ];
      for (const [k, v] of bools) {
        const parsed = parseBool(v);
        if (parsed !== undefined) body[k] = parsed;
      }
      const data = await client.patch(`/v1/videos/${id}`, body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

videosResource
  .command("delete")
  .description("Delete a video")
  .argument("<id>", "Video ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  tella-cli videos delete vid_abc123")
  .action(async (id: string, opts: ListOpts) => {
    try {
      await client.delete(`/v1/videos/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

videosResource
  .command("duplicate")
  .description("Duplicate a video (optionally trimmed)")
  .argument("<id>", "Video ID")
  .option("--name <name>", "Name for the duplicate")
  .option("--trim-start-ms <ms>", "Trim start time (milliseconds)")
  .option("--trim-end-ms <ms>", "Trim end time (milliseconds)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExample:\n  tella-cli videos duplicate vid_abc123 --name "My Copy"',
  )
  .action(async (id: string, opts: DuplicateOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.trimStartTimeMs && opts.trimEndTimeMs) {
        body.trim = {
          startTimeMs: Number(opts.trimStartTimeMs),
          endTimeMs: Number(opts.trimEndTimeMs),
        };
      }
      const data = await client.post(`/v1/videos/${id}/duplicate`, body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

videosResource
  .command("export")
  .description("Start an export job for a video")
  .argument("<id>", "Video ID")
  .option("--resolution <res>", "1080p or 4k", "1080p")
  .option("--fps <fps>", "30 or 60")
  .option("--speed <speed>", "Playback speed multiplier: 0.5, 0.75, 1, 1.25, 1.5, 2")
  .option("--granularity <g>", "video, clips, or raw")
  .option("--subtitles", "Burn subtitles into the export")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli videos export vid_abc123 --resolution 4k --fps 60",
  )
  .action(async (id: string, opts: ExportOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.resolution) body.resolution = opts.resolution;
      if (opts.fps) body.fps = opts.fps;
      if (opts.speed) body.speed = opts.speed;
      if (opts.granularity) body.granularity = opts.granularity;
      if (opts.subtitles) body.subtitles = true;
      const data = await client.post(`/v1/videos/${id}/exports`, body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

videosResource
  .command("thumbnail")
  .description("Get a video thumbnail or animated preview")
  .argument("<id>", "Video ID")
  .option("--format <fmt>", "jpg, png, webp, gif, or mp4")
  .option("--inpoint-ms <ms>", "Frame in-point time (ms)")
  .option("--duration-ms <ms>", "Duration for animated formats (ms)")
  .option("--width <px>", "Output width in pixels")
  .option("--height <px>", "Output height in pixels")
  .option("--download", "Force download disposition")
  .option("--response <type>", "Set to 'json' to get URL metadata instead of binary")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli videos thumbnail vid_abc123 --format jpg --width 640 --response json",
  )
  .action(async (id: string, opts: ThumbOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.format) params.format = opts.format;
      if (opts.inpointMs) params.inpointMs = opts.inpointMs;
      if (opts.durationMs) params.durationMs = opts.durationMs;
      if (opts.width) params.width = opts.width;
      if (opts.height) params.height = opts.height;
      if (opts.download) params.download = "true";
      if (opts.response) params.response = opts.response;
      const data = await client.get(`/v1/videos/${id}/thumbnail`, params);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

videosResource
  .command("add-collaborator")
  .description("Add a workspace member as a collaborator on a video")
  .argument("<id>", "Video ID")
  .requiredOption("--email <email>", "Collaborator email (must be in workspace)")
  .requiredOption("--role <role>", "editor or viewer")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli videos add-collaborator vid_abc123 --email teammate@acme.com --role editor",
  )
  .action(async (id: string, opts: CollabOpts) => {
    try {
      const data = await client.post(`/v1/videos/${id}/collaborators`, {
        email: opts.email,
        role: opts.role,
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
