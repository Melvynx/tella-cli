import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ListOpts {
  visibility?: string;
  cursor?: string;
  limit?: string;
  fields?: string;
  json?: boolean;
  format?: string;
}

interface CreateOpts {
  name: string;
  description?: string;
  emoji?: string;
  linkScope?: string;
  password?: string;
  visibility?: string;
  searchEngineIndexingEnabled?: string;
  json?: boolean;
  format?: string;
}

interface UpdateOpts {
  name?: string;
  description?: string;
  linkScope?: string;
  password?: string;
  searchEngineIndexingEnabled?: string;
  json?: boolean;
  format?: string;
}

interface AddVideoOpts {
  videoId: string;
  json?: boolean;
  format?: string;
}

const parseBool = (v?: string): boolean | undefined => {
  if (v === undefined) return undefined;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
};

export const playlistsResource = new Command("playlists").description(
  "Manage Tella playlists",
);

playlistsResource
  .command("list")
  .description("List all playlists")
  .option("--visibility <v>", "Filter by visibility: personal or org")
  .option("--cursor <cursor>", "Pagination cursor")
  .option("--limit <n>", "Max number of playlists to return")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  tella-cli playlists list --visibility org --json")
  .action(async (opts: ListOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.visibility) params.visibility = opts.visibility;
      if (opts.cursor) params.cursor = opts.cursor;
      if (opts.limit) params.limit = opts.limit;
      const data = await client.get("/v1/playlists", params);
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

playlistsResource
  .command("get")
  .description("Get playlist details")
  .argument("<id>", "Playlist ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  tella-cli playlists get pl_abc123")
  .action(async (id: string, opts: ListOpts) => {
    try {
      const data = await client.get(`/v1/playlists/${id}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

playlistsResource
  .command("create")
  .description("Create a new playlist")
  .requiredOption("--name <name>", "Playlist name")
  .option("--description <text>", "Playlist description")
  .option("--emoji <emoji>", "Unicode emoji for the playlist")
  .option("--link-scope <scope>", "Access level: public, private, password")
  .option("--password <pw>", "Password (required when link-scope=password)")
  .option("--visibility <v>", "personal or org")
  .option(
    "--search-engine-indexing-enabled <bool>",
    "Allow SEO indexing (true/false)",
  )
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExample:\n  tella-cli playlists create --name "Tutorials" --visibility org',
  )
  .action(async (opts: CreateOpts) => {
    try {
      const body: Record<string, unknown> = { name: opts.name };
      if (opts.description) body.description = opts.description;
      if (opts.emoji) body.emoji = opts.emoji;
      if (opts.linkScope) body.linkScope = opts.linkScope;
      if (opts.password) body.password = opts.password;
      if (opts.visibility) body.visibility = opts.visibility;
      const seo = parseBool(opts.searchEngineIndexingEnabled);
      if (seo !== undefined) body.searchEngineIndexingEnabled = seo;
      const data = await client.post("/v1/playlists", body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

playlistsResource
  .command("update")
  .description("Update a playlist")
  .argument("<id>", "Playlist ID")
  .option("--name <name>", "New playlist name")
  .option("--description <text>", "New description")
  .option("--link-scope <scope>", "Access level: public, private, password")
  .option("--password <pw>", "Password (required when link-scope=password)")
  .option(
    "--search-engine-indexing-enabled <bool>",
    "Allow SEO indexing (true/false)",
  )
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExample:\n  tella-cli playlists update pl_abc123 --name "Updated"',
  )
  .action(async (id: string, opts: UpdateOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name !== undefined) body.name = opts.name;
      if (opts.description !== undefined) body.description = opts.description;
      if (opts.linkScope) body.linkScope = opts.linkScope;
      if (opts.password) body.password = opts.password;
      const seo = parseBool(opts.searchEngineIndexingEnabled);
      if (seo !== undefined) body.searchEngineIndexingEnabled = seo;
      const data = await client.patch(`/v1/playlists/${id}`, body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

playlistsResource
  .command("delete")
  .description("Delete a playlist")
  .argument("<id>", "Playlist ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  tella-cli playlists delete pl_abc123")
  .action(async (id: string, opts: ListOpts) => {
    try {
      await client.delete(`/v1/playlists/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

playlistsResource
  .command("add-video")
  .description("Add a video to a playlist")
  .argument("<id>", "Playlist ID")
  .requiredOption("--video-id <vid>", "Video ID to add")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli playlists add-video pl_abc123 --video-id vid_xyz",
  )
  .action(async (id: string, opts: AddVideoOpts) => {
    try {
      const data = await client.post(`/v1/playlists/${id}/videos`, {
        videoId: opts.videoId,
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

playlistsResource
  .command("remove-video")
  .description("Remove a video from a playlist")
  .argument("<id>", "Playlist ID")
  .argument("<videoId>", "Video ID to remove")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli playlists remove-video pl_abc123 vid_xyz",
  )
  .action(async (id: string, videoId: string, opts: ListOpts) => {
    try {
      await client.delete(`/v1/playlists/${id}/videos/${videoId}`);
      output({ removed: true, playlistId: id, videoId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
