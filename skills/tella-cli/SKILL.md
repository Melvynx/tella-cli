---
name: tella
description: "Manage Tella videos via CLI. Use for Tella videos, sources, clips, transcripts, thumbnails, exports, filler-word removal, zooms, blurs, highlights, overlays, sound effects, playlists, webhooks, or video edits."
category: video
---

# tella-cli

## When To Use This Skill

Use the `tella-cli` skill when you need to:

- List, fetch, update, or delete videos in a Tella workspace
- Pull transcripts (cut or uncut) for a clip with word-level timestamps
- Generate video or clip thumbnails (jpg/png/webp/gif/mp4) at custom sizes/timestamps
- Trigger video exports at 1080p or 4k, 30/60fps, with optional burned-in subtitles
- Duplicate a video or clip, optionally trimmed
- Create upload sources for clips, B-roll videos, overlays, and sound effects
- Edit clips: upload, cut time ranges, cut by transcript word indices, reorder, remove filler words, find silent ranges
- Add or update visual edits: blurs, highlights, layouts, B-roll media, auto layouts, zooms (manual/tracking/auto), overlays, and sound effects
- Manage playlists, sidebar groups, and add/remove videos from them
- Add, update, or remove workspace collaborators (editor or viewer) on a video
- Create webhook endpoints, fetch signing secrets, and inspect recent deliveries

## Capabilities

- Read every video and playlist in the workspace, including metadata, view counts, and share links
- Push fine-grained edits to clips (cuts, transcript cuts, backgrounds, blurs, highlights, layouts, B-roll, zooms, overlays, sound effects) without opening the Tella editor
- Pull transcripts for downstream search, summarization, or accessibility workflows
- Start exports and poll/list webhook deliveries to know when files are ready
- Manage sharing: `linkScope`, password, allowed embed domains, search-engine indexing
- Manage Studio Sound at video level and per-clip opt-out
- Subscribe to events (`video.created`, `export.ready`, `transcript.ready`, etc.) and recover delivery messages

## Common Use Cases

- "List my last 20 Tella videos and dump them as JSON for a content audit"
- "Get the uncut transcript for clip X so I can generate chapter timestamps"
- "Export video Y at 4k 60fps with subtitles burned in"
- "Add a blur over the credentials shown between 4.2s and 7.8s on this clip"
- "Create a playlist 'Tutorials' and add these 5 videos to it"
- "Upload this product demo as a clip, then add a logo overlay and a whoosh sound effect"
- "Generate auto layouts and auto zooms for this demo clip"
- "Wire up a webhook so I get notified when an export is ready"
- "Remove filler words from this clip and then fetch the cleaned transcript"

## Setup

If `tella-cli` is not found, install and build it:
```bash
bun --version || curl -fsSL https://bun.sh/install | bash
npx api2cli bundle tella
npx api2cli link tella
```

`api2cli link` adds `~/.local/bin` to PATH automatically. The CLI is available in the next command.

Always use `--json` when calling commands programmatically.

## Working Rules

- Always use `--json` for agent-driven calls so downstream steps can parse the result
- Run `<resource> --help` or `<resource> <action> --help` when unsure of flags rather than guessing
- For destructive actions (`delete`, `remove-*`), read first with `get`/`list` to confirm the target
- Most clip mutations require both `<videoId>` and `<clipId>` as positional args (in that order)
- Coordinates for masks (blurs, highlights) and zoom focus points use percentages `0-100` (`xPct`/`yPct`, `widthPct`/`heightPct`)
- Times are in milliseconds (`*-ms` flags) unless the docs say otherwise
- Structured MCP fields (`cuts`, `wordRanges`, `layout`, `media`, `background`, `point`, `dimensions`) are passed as JSON strings on CLI flags

## Authentication

```bash
tella-cli auth set "tella_pk_xxx..."   # API key from https://www.tella.tv/settings/api-keys
tella-cli auth test                     # Verify the key works
tella-cli auth show                     # Show masked token
tella-cli auth remove                   # Delete stored token
```

Token is stored at `~/.config/tokens/tella-cli.txt` (chmod 600).

## Resources

### videos

| Action | Description | Key Flags |
|--------|-------------|-----------|
| `list` | List videos in the workspace | `--cursor`, `--limit`, `--playlist-id`, `--fields` |
| `get <id>` | Get a single video's metadata | `--include-transcript`, `--include-chapters`, `--include-thumbnails`, `--include-exports` |
| `update <id>` | Update title, description, sharing, playback, dimensions, Studio Sound | `--name`, `--description`, `--link-scope`, `--password`, `--allowed-embed-domains`, `--custom-thumbnail-url`, `--default-playback-rate`, `--dimensions`, `--studio-sound`, boolean settings |
| `delete <id>` | Delete a video | - |
| `duplicate <id>` | Duplicate, optionally trimmed | `--name`, `--start-time`, `--end-time`, `--chapter-index`, legacy `--trim-start-ms`, `--trim-end-ms` |
| `export <id>` | Start an export job | `--resolution` (1080p/4k), `--fps` (30/60), `--speed`, `--granularity` (video/clips/raw), `--subtitles` |
| `thumbnail <id>` | Get thumbnail/animated preview | `--format` (jpg/png/webp/gif/mp4), `--inpoint-ms`, `--duration-ms`, `--width`, `--height`, `--download`, `--response json` |
| `add-collaborator <id>` | Add a workspace member | `--email` (required), `--role editor\|viewer` (required) |
| `update-collaborator <id> <userId>` | Change collaborator role | `--role editor\|viewer` |
| `remove-collaborator <id> <userId>` | Remove a collaborator | - |

### sources

| Action | Description | Key Flags |
|--------|-------------|-----------|
| `create` | Create a source upload and return `sourceId` + `uploadUrl` | `--kind video`, `--width`, `--height`, `--duration` |

### clips

Most clip commands take `<videoId> <clipId>` as positional args.
`upload` only takes `<videoId>` and a `--source-id`.

| Action | Description | Key Flags |
|--------|-------------|-----------|
| `upload <videoId>` | Add a new clip from an uploaded source | `--source-id` (req), `--name` |
| `list <videoId>` | List clips for a video | `--fields` |
| `get <videoId> <clipId>` | Get a single clip | - |
| `update <videoId> <clipId>` | Rename, reorder, replace cuts/background, Studio Sound opt-out | `--name`, `--order`, `--cuts` JSON, `--background` JSON, `--studio-sound` |
| `delete <videoId> <clipId>` | Delete a clip | - |
| `duplicate <videoId> <clipId>` | Duplicate the clip | `--name`, `--order` |
| `cut <videoId> <clipId>` | Cut one or more time ranges out | `--from-ms` + `--to-ms`, or `--cuts` JSON |
| `cut-by-transcript <videoId> <clipId>` | Cut by uncut transcript word indices | `--word-ranges` JSON |
| `reorder <videoId> <clipId>` | Move to new position | `--order` (req) |
| `remove-fillers <videoId> <clipId>` | Auto-remove filler words | - |
| `silences <videoId> <clipId>` | List silent ranges | `--min-duration-ms` |
| `transcript-cut <videoId> <clipId>` | Edited transcript (post-cuts) | - |
| `transcript-uncut <videoId> <clipId>` | Original transcript | - |
| `thumbnail <videoId> <clipId>` | Clip thumbnail/preview | `--format`, `--inpoint-ms`, `--duration-ms`, `--width`, `--height`, `--download`, `--response` |
| `list-sources <videoId> <clipId>` | List recording sources | `--fields` |
| `source-thumbnail <videoId> <clipId> <sourceId>` | Source thumbnail | same as clip `thumbnail` |
| `source-waveform <videoId> <clipId> <sourceId>` | Audio waveform JSON | - |
| `list-blurs <videoId> <clipId>` | List blur masks | - |
| `add-blur <videoId> <clipId>` | Add a blur mask | `--start-time-ms`, `--duration-ms`, `--point-x`, `--point-y`, `--dim-width`, `--dim-height` (all required) |
| `update-blur <videoId> <clipId> <maskId>` | Update a blur | any of the mask flags above |
| `remove-blur <videoId> <clipId> <maskId>` | Remove a blur | - |
| `list-highlights <videoId> <clipId>` | List highlight masks | - |
| `add-highlight <videoId> <clipId>` | Add a highlight | same mask flags as `add-blur` |
| `update-highlight <videoId> <clipId> <maskId>` | Update a highlight | mask flags |
| `remove-highlight <videoId> <clipId> <maskId>` | Remove a highlight | - |
| `list-layouts <videoId> <clipId>` | List layouts | - |
| `add-layout <videoId> <clipId>` | Add a layout or B-roll media section | `--layout` JSON, `--media` JSON, `--start-time-ms`, `--duration-ms`, `--transition-style spring\|hardCut` |
| `update-layout <videoId> <clipId> <layoutId>` | Update a layout | `--layout`, `--media`, time flags, `--transition-style` |
| `remove-layout <videoId> <clipId> <layoutId>` | Remove a layout | - |
| `generate-auto-layouts <videoId> <clipId>` | Generate AI auto layouts | `--style`, `--instructions` |
| `list-zooms <videoId> <clipId>` | List zooms | - |
| `add-zoom <videoId> <clipId>` | Add a zoom | `--type manualZoom\|trackingZoom` (req), `--start-time-ms` (req), `--duration-ms` (req), `--scale` (req), `--focus-x`, `--focus-y` |
| `update-zoom <videoId> <clipId> <zoomId>` | Update a zoom | same as `add-zoom` |
| `generate-auto-zooms <videoId> <clipId>` | Generate tracking zooms from clicks | `--intensity slow\|medium\|fast`, `--scale`, `--replace-existing` |
| `remove-zoom <videoId> <clipId> <zoomId>` | Remove a zoom | - |
| `list-overlays <videoId> <clipId>` | List image/video overlays | - |
| `add-overlay <videoId> <clipId>` | Add an image or video overlay | `--start-time-ms`, `--duration-ms`, `--source-id` or `--image-url`, `--width`, `--height`, `--name`, `--point` JSON, `--dimensions` JSON |
| `update-overlay <videoId> <clipId> <overlayId>` | Update an overlay | time flags, `--name`, `--point`, `--dimensions` |
| `remove-overlay <videoId> <clipId> <overlayId>` | Remove an overlay | - |
| `list-sound-effects <videoId> <clipId>` | List sound effects | - |
| `add-sound-effect <videoId> <clipId>` | Add a sound effect from an uploaded source | `--source-id`, `--start-time-ms`, `--duration-ms`, `--name`, `--volume` |
| `update-sound-effect <videoId> <clipId> <soundEffectId>` | Update a sound effect | time flags, `--name`, `--volume` |
| `remove-sound-effect <videoId> <clipId> <soundEffectId>` | Remove a sound effect | - |

Mask coordinates (`--point-*`, `--dim-*`, `--focus-*`) are percentages `0-100` of the canvas/screen.

### playlists

| Action | Description | Key Flags |
|--------|-------------|-----------|
| `list` | List all playlists | `--visibility` (personal/org), `--cursor`, `--limit`, `--fields` |
| `get <id>` | Get playlist details | - |
| `create` | Create a new playlist | `--name` (req), `--description`, `--emoji`, `--link-scope`, `--password`, `--visibility`, `--search-engine-indexing-enabled` |
| `update <id>` | Update a playlist | `--name`, `--description`, `--emoji`, `--link-scope`, `--password`, `--search-engine-indexing-enabled` |
| `delete <id>` | Delete a playlist | - |
| `add-video <id>` | Add a video to it | `--video-id` (req) |
| `remove-video <id> <videoId>` | Remove a video from it | - |
| `list-groups` | List sidebar playlist groups | `--visibility` |
| `create-group` | Create a sidebar playlist group | `--name`, `--emoji`, `--visibility` |
| `update-group <id>` | Rename, re-icon, or reorder a group | `--name`, `--emoji`, `--position` |
| `delete-group <id>` | Delete a group without deleting playlists | - |
| `move-to-group <playlistId>` | Move/ungroup a playlist | `--group-id`, `--position` |

### webhooks

| Action | Description | Key Flags |
|--------|-------------|-----------|
| `create-endpoint` | Subscribe to events | `--url` (req), `--filter-types` (req, comma-separated, e.g. `video.created,export.ready`) |
| `delete-endpoint <id>` | Delete an endpoint | - |
| `get-secret <id>` | Get the signing secret | - |
| `list-messages` | Recent delivery messages | `--event-types`, `--limit`, `--fields` |
| `get-message <id>` | Get a specific message | - |

Available event types include: `video.created`, `video.viewed`, `view.milestone`, `transcript.ready`, `export.ready`, `playlist.created`, `playlist.video_added`.

## Output Format

`--json` returns a standardized envelope:
```json
{ "ok": true, "data": { ... }, "meta": { "total": 42 } }
```

On error: `{ "ok": false, "error": { "message": "...", "status": 401 } }`

## Quick Reference

```bash
tella-cli --help                       # List all resources and global flags
tella-cli videos --help                # List actions on videos
tella-cli videos list --help           # Show flags for videos list
tella-cli clips add-zoom --help        # Show flags for add-zoom
```

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 = success, 1 = API error, 2 = usage error
