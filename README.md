# tella-cli

CLI for the [Tella](https://www.tella.tv) video API. Made with [api2cli.dev](https://api2cli.dev).

Manage videos, sources, clips, playlists, and webhooks from the terminal or any AI agent.

## Install

```bash
npx api2cli install Melvynx/tella-cli
```

This clones the repo, builds the CLI, links it to your PATH, and installs the AgentSkill.

### Install AgentSkill only

```bash
npx skills add Melvynx/tella-cli
```

## Quick Start

```bash
# Generate an API key at https://www.tella.tv/settings/api-keys
tella-cli auth set "tella_pk_xxx..."
tella-cli auth test

tella-cli videos list --json
tella-cli playlists list --json
tella-cli sources create --width 1920 --height 1080 --duration 12.5 --json
tella-cli clips list <videoId> --json
```

## Resources

- **videos** - list, get, update, delete, duplicate, export, thumbnail, add/update/remove collaborators
- **sources** - create upload sources for clips, B-roll, overlays, and sound effects
- **clips** - upload, full CRUD plus cut, cut-by-transcript, reorder, remove-fillers, silences, transcripts, thumbnails, sources, waveforms, blurs, highlights, layouts, auto layouts, zooms, auto zooms, overlays, and sound effects
- **playlists** - list, get, create, update, delete, add-video, remove-video, and sidebar group management
- **webhooks** - create/delete endpoints, get signing secret, list/get delivery messages

Run `tella-cli <resource> --help` to see every action and its flags.

## Examples

```bash
# Export a video at 4k 60fps with subtitles
tella-cli videos export vid_abc123 --resolution 4k --fps 60 --subtitles --json

# Get the uncut transcript for a clip
tella-cli clips transcript-uncut vid_abc123 cl_xyz --json

# Blur a region between 4.2s and 7.8s
tella-cli clips add-blur vid_abc123 cl_xyz \
  --start-time-ms 4200 --duration-ms 3600 \
  --point-x 30 --point-y 20 \
  --dim-width 20 --dim-height 10

# Upload a source, then add it as a new clip
tella-cli sources create --width 1920 --height 1080 --duration 42.5 --json
tella-cli clips upload vid_abc123 --source-id su_xyz --name Intro --json

# Generate layouts and zooms from the editor automation tools
tella-cli clips generate-auto-layouts vid_abc123 cl_xyz --style tutorial-round --json
tella-cli clips generate-auto-zooms vid_abc123 cl_xyz --intensity fast --json

# Add an overlay and a sound effect
tella-cli clips add-overlay vid_abc123 cl_xyz \
  --image-url https://example.com/logo.png --width 512 --height 512 \
  --start-time-ms 5000 --duration-ms 4000 --json
tella-cli clips add-sound-effect vid_abc123 cl_xyz \
  --source-id su_audio --start-time-ms 8000 --duration-ms 1200 --json

# Create a webhook for export.ready events
tella-cli webhooks create-endpoint \
  --url https://hooks.example.com/tella \
  --filter-types export.ready,transcript.ready
```

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

`--json` returns a standardized envelope: `{ "ok": true, "data": ..., "meta": { ... } }`

Token is stored at `~/.config/tokens/tella-cli.txt` (chmod 600).

## API Docs

- Tella API reference: https://www.tella.com/docs/introduction
- Tella MCP server tools: https://www.tella.com/docs/mcp-server
- OpenAPI spec: https://www.tella.com/docs/openapi.json
