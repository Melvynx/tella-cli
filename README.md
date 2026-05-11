# tella-cli

CLI for the [Tella](https://www.tella.tv) video API. Made with [api2cli.dev](https://api2cli.dev).

Manage videos, clips, playlists, and webhooks from the terminal or any AI agent.

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
tella-cli clips list <videoId> --json
```

## Resources

- **videos** - list, get, update, delete, duplicate, export, thumbnail, add-collaborator
- **clips** - full CRUD plus cut, reorder, remove-fillers, silences, transcripts (cut/uncut), thumbnails, sources, waveforms, and visual edits: blurs, highlights, layouts, zooms
- **playlists** - list, get, create, update, delete, add-video, remove-video
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
  --point-x 0.3 --point-y 0.2 \
  --dim-width 0.2 --dim-height 0.1

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
- OpenAPI spec: https://www.tella.com/docs/openapi.json
