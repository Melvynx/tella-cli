import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface BaseOpts {
  json?: boolean;
  format?: string;
  fields?: string;
}

const parseJson = (value: string): unknown => JSON.parse(value);

const parseBool = (v?: string): boolean | undefined => {
  if (v === undefined) return undefined;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
};

const addJsonIfSet = (
  body: Record<string, unknown>,
  key: string,
  value?: string,
): void => {
  if (value !== undefined) body[key] = parseJson(value);
};

interface UpdateClipOpts extends BaseOpts {
  name?: string;
  order?: string;
  cuts?: string;
  background?: string;
  studioSound?: string;
}

interface MaskOpts extends BaseOpts {
  startTimeMs: string;
  durationMs: string;
  pointX: string;
  pointY: string;
  dimWidth: string;
  dimHeight: string;
}

interface MaskUpdateOpts extends BaseOpts {
  startTimeMs?: string;
  durationMs?: string;
  pointX?: string;
  pointY?: string;
  dimWidth?: string;
  dimHeight?: string;
}

interface CutOpts extends BaseOpts {
  fromMs?: string;
  toMs?: string;
  cuts?: string;
}

interface CutTranscriptOpts extends BaseOpts {
  wordRanges: string;
}

interface UploadClipOpts extends BaseOpts {
  sourceId: string;
  name?: string;
}

interface DuplicateOpts extends BaseOpts {
  name?: string;
  order?: string;
}

interface ReorderOpts extends BaseOpts {
  order: string;
}

interface SilenceOpts extends BaseOpts {
  minDurationMs?: string;
}

interface LayoutOpts extends BaseOpts {
  layout?: string;
  media?: string;
  startTimeMs?: string;
  durationMs?: string;
  transitionStyle?: string;
}

interface LayoutUpdateOpts extends BaseOpts {
  layout?: string;
  media?: string;
  startTimeMs?: string;
  durationMs?: string;
  transitionStyle?: string;
}

interface AutoLayoutOpts extends BaseOpts {
  style?: string;
  instructions?: string;
}

interface ZoomOpts extends BaseOpts {
  type: string;
  startTimeMs: string;
  durationMs: string;
  scale: string;
  focusX?: string;
  focusY?: string;
}

interface ZoomUpdateOpts extends BaseOpts {
  type?: string;
  startTimeMs?: string;
  durationMs?: string;
  scale?: string;
  focusX?: string;
  focusY?: string;
}

interface AutoZoomOpts extends BaseOpts {
  intensity?: string;
  scale?: string;
  replaceExisting?: string;
}

interface OverlayOpts extends BaseOpts {
  startTimeMs: string;
  durationMs: string;
  sourceId?: string;
  imageUrl?: string;
  width?: string;
  height?: string;
  name?: string;
  point?: string;
  dimensions?: string;
}

interface OverlayUpdateOpts extends BaseOpts {
  startTimeMs?: string;
  durationMs?: string;
  name?: string;
  point?: string;
  dimensions?: string;
}

interface SoundEffectOpts extends BaseOpts {
  sourceId: string;
  startTimeMs: string;
  durationMs: string;
  name?: string;
  volume?: string;
}

interface SoundEffectUpdateOpts extends BaseOpts {
  startTimeMs?: string;
  durationMs?: string;
  name?: string;
  volume?: string;
}

interface ThumbOpts extends BaseOpts {
  format?: string;
  inpointMs?: string;
  durationMs?: string;
  width?: string;
  height?: string;
  download?: boolean;
  response?: string;
}

export const clipsResource = new Command("clips").description(
  "Manage clips within a Tella video (edits, masks, layouts, zooms, transcripts)",
);

clipsResource
  .command("upload")
  .description("Add a new clip to a video from an uploaded source")
  .argument("<videoId>", "Video ID")
  .requiredOption("--source-id <id>", "Source ID returned by tella-cli sources create")
  .option("--name <name>", "Clip name")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli clips upload vid_abc123 --source-id su_xyz --name Intro",
  )
  .action(async (videoId: string, opts: UploadClipOpts) => {
    try {
      const body: Record<string, unknown> = { sourceId: opts.sourceId };
      if (opts.name) body.name = opts.name;
      const data = await client.post(`/v1/videos/${videoId}/clips`, body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("list")
  .description("List clips for a video")
  .argument("<videoId>", "Video ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  tella-cli clips list vid_abc123 --json")
  .action(async (videoId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(`/v1/videos/${videoId}/clips`);
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("get")
  .description("Get a single clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(`/v1/videos/${videoId}/clips/${clipId}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("update")
  .description("Update a clip's name, order, cuts, background, or Studio Sound")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--name <name>", "New clip name")
  .option("--order <n>", "New position (0 = first)")
  .option("--cuts <json>", 'Replace cuts with JSON, e.g. \'[{"startTimeMs":1000,"durationMs":500}]\'')
  .option("--background <json>", "Background JSON object")
  .option("--studio-sound <bool>", "Per-clip Studio Sound opt-out (true/false)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: UpdateClipOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name !== undefined) body.name = opts.name;
      if (opts.order !== undefined) body.order = Number(opts.order);
      addJsonIfSet(body, "cuts", opts.cuts);
      addJsonIfSet(body, "background", opts.background);
      const studioSound = parseBool(opts.studioSound);
      if (studioSound !== undefined) body.studioSound = studioSound;
      const data = await client.patch(`/v1/videos/${videoId}/clips/${clipId}`, body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("delete")
  .description("Delete a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      await client.delete(`/v1/videos/${videoId}/clips/${clipId}`);
      output({ deleted: true, videoId, clipId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("duplicate")
  .description("Duplicate a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--name <name>", "Name for the duplicate")
  .option("--order <n>", "Insert position (defaults to right after source)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: DuplicateOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.order !== undefined) body.order = Number(opts.order);
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/duplicate`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("cut")
  .description("Cut one or more time ranges from a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--from-ms <ms>", "Start of a single cut range (ms)")
  .option("--to-ms <ms>", "End of a single cut range (ms)")
  .option("--cuts <json>", 'Array of cut ranges, e.g. \'[{"fromMs":1000,"toMs":1800}]\'')
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: CutOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.cuts) {
        body.cuts = parseJson(opts.cuts);
      } else if (opts.fromMs !== undefined && opts.toMs !== undefined) {
        body.fromMs = Number(opts.fromMs);
        body.toMs = Number(opts.toMs);
      }
      const data = await client.post(`/v1/videos/${videoId}/clips/${clipId}/cut`, body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("cut-by-transcript")
  .description("Cut ranges from a clip by uncut transcript word indices")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .requiredOption(
    "--word-ranges <json>",
    'Array of word ranges, e.g. \'[{"fromWordIndex":12,"toWordIndex":17}]\'',
  )
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: CutTranscriptOpts) => {
    try {
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/cut-by-transcript`,
        { wordRanges: parseJson(opts.wordRanges) },
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("reorder")
  .description("Move a clip to a new position")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .requiredOption("--order <n>", "New position (0 = first)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: ReorderOpts) => {
    try {
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/reorder`,
        { order: Number(opts.order) },
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("remove-fillers")
  .description("Automatically remove filler words from a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/remove-fillers`,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("silences")
  .description("List silent ranges in a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--min-duration-ms <ms>", "Minimum silence duration to include")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: SilenceOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.minDurationMs) params.minDurationMs = opts.minDurationMs;
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/silences`,
        params,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("transcript-cut")
  .description("Get the cut (edited) transcript for a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/transcript/cut`,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("transcript-uncut")
  .description("Get the uncut (original) transcript for a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/transcript/uncut`,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("thumbnail")
  .description("Get a clip thumbnail or animated preview")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--format <fmt>", "jpg, png, webp, gif, or mp4")
  .option("--inpoint-ms <ms>", "Frame in-point time (ms)")
  .option("--duration-ms <ms>", "Duration for animated formats (ms)")
  .option("--width <px>", "Output width in pixels")
  .option("--height <px>", "Output height in pixels")
  .option("--download", "Force download disposition")
  .option("--response <type>", "Set to 'json' for URL metadata instead of binary")
  .option("--json", "Output as JSON")
  .action(async (videoId: string, clipId: string, opts: ThumbOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.format) params.format = opts.format;
      if (opts.inpointMs) params.inpointMs = opts.inpointMs;
      if (opts.durationMs) params.durationMs = opts.durationMs;
      if (opts.width) params.width = opts.width;
      if (opts.height) params.height = opts.height;
      if (opts.download) params.download = "true";
      if (opts.response) params.response = opts.response;
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/thumbnail`,
        params,
      );
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("list-sources")
  .description("List sources (recording tracks) for a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/sources`,
      );
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("source-thumbnail")
  .description("Get a source thumbnail or preview")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<sourceId>", "Source ID")
  .option("--format <fmt>", "jpg, png, webp, gif, or mp4")
  .option("--inpoint-ms <ms>", "Frame in-point time (ms)")
  .option("--duration-ms <ms>", "Duration for animated formats (ms)")
  .option("--width <px>", "Output width in pixels")
  .option("--height <px>", "Output height in pixels")
  .option("--download", "Force download disposition")
  .option("--response <type>", "Set to 'json' for URL metadata instead of binary")
  .option("--json", "Output as JSON")
  .action(
    async (
      videoId: string,
      clipId: string,
      sourceId: string,
      opts: ThumbOpts,
    ) => {
      try {
        const params: Record<string, string> = {};
        if (opts.format) params.format = opts.format;
        if (opts.inpointMs) params.inpointMs = opts.inpointMs;
        if (opts.durationMs) params.durationMs = opts.durationMs;
        if (opts.width) params.width = opts.width;
        if (opts.height) params.height = opts.height;
        if (opts.download) params.download = "true";
        if (opts.response) params.response = opts.response;
        const data = await client.get(
          `/v1/videos/${videoId}/clips/${clipId}/sources/${sourceId}/thumbnail`,
          params,
        );
        output(data, { json: opts.json });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

clipsResource
  .command("source-waveform")
  .description("Get the audio waveform JSON for a source")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<sourceId>", "Source ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(
    async (
      videoId: string,
      clipId: string,
      sourceId: string,
      opts: BaseOpts,
    ) => {
      try {
        const data = await client.get(
          `/v1/videos/${videoId}/clips/${clipId}/sources/${sourceId}/waveform`,
        );
        output(data, { json: opts.json, format: opts.format });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

const buildMaskBody = (opts: MaskOpts | MaskUpdateOpts): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (opts.startTimeMs !== undefined) body.startTimeMs = Number(opts.startTimeMs);
  if (opts.durationMs !== undefined) body.durationMs = Number(opts.durationMs);
  if (opts.pointX !== undefined && opts.pointY !== undefined) {
    body.point = { xPct: Number(opts.pointX), yPct: Number(opts.pointY) };
  }
  if (opts.dimWidth !== undefined && opts.dimHeight !== undefined) {
    body.dimensions = {
      widthPct: Number(opts.dimWidth),
      heightPct: Number(opts.dimHeight),
    };
  }
  return body;
};

const maskAddOptions = (cmd: Command) =>
  cmd
    .requiredOption("--start-time-ms <ms>", "Start time in ms")
    .requiredOption("--duration-ms <ms>", "Duration in ms")
    .requiredOption("--point-x <pct>", "Top-left X percentage (0-100)")
    .requiredOption("--point-y <pct>", "Top-left Y percentage (0-100)")
    .requiredOption("--dim-width <pct>", "Mask width percentage (0-100)")
    .requiredOption("--dim-height <pct>", "Mask height percentage (0-100)")
    .option("--json", "Output as JSON")
    .option("--format <fmt>", "Output format: text, json, csv, yaml");

const maskUpdateOptions = (cmd: Command) =>
  cmd
    .option("--start-time-ms <ms>", "Start time in ms")
    .option("--duration-ms <ms>", "Duration in ms")
    .option("--point-x <pct>", "Top-left X percentage (0-100)")
    .option("--point-y <pct>", "Top-left Y percentage (0-100)")
    .option("--dim-width <pct>", "Mask width percentage (0-100)")
    .option("--dim-height <pct>", "Mask height percentage (0-100)")
    .option("--json", "Output as JSON")
    .option("--format <fmt>", "Output format: text, json, csv, yaml");

// Blurs
clipsResource
  .command("list-blurs")
  .description("List blurs on a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/blurs`,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

maskAddOptions(
  clipsResource
    .command("add-blur")
    .description("Add a blur mask to a clip")
    .argument("<videoId>", "Video ID")
    .argument("<clipId>", "Clip ID"),
).action(async (videoId: string, clipId: string, opts: MaskOpts) => {
  try {
    const data = await client.post(
      `/v1/videos/${videoId}/clips/${clipId}/blurs`,
      buildMaskBody(opts),
    );
    output(data, { json: opts.json, format: opts.format });
  } catch (err) {
    handleError(err, opts.json);
  }
});

maskUpdateOptions(
  clipsResource
    .command("update-blur")
    .description("Update a blur mask")
    .argument("<videoId>", "Video ID")
    .argument("<clipId>", "Clip ID")
    .argument("<maskId>", "Mask ID"),
).action(
  async (videoId: string, clipId: string, maskId: string, opts: MaskUpdateOpts) => {
    try {
      const data = await client.patch(
        `/v1/videos/${videoId}/clips/${clipId}/blurs/${maskId}`,
        buildMaskBody(opts),
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  },
);

clipsResource
  .command("remove-blur")
  .description("Remove a blur mask")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<maskId>", "Mask ID")
  .option("--json", "Output as JSON")
  .action(async (videoId: string, clipId: string, maskId: string, opts: BaseOpts) => {
    try {
      await client.delete(
        `/v1/videos/${videoId}/clips/${clipId}/blurs/${maskId}`,
      );
      output({ removed: true, maskId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// Highlights
clipsResource
  .command("list-highlights")
  .description("List highlights on a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/highlights`,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

maskAddOptions(
  clipsResource
    .command("add-highlight")
    .description("Add a highlight mask to a clip")
    .argument("<videoId>", "Video ID")
    .argument("<clipId>", "Clip ID"),
).action(async (videoId: string, clipId: string, opts: MaskOpts) => {
  try {
    const data = await client.post(
      `/v1/videos/${videoId}/clips/${clipId}/highlights`,
      buildMaskBody(opts),
    );
    output(data, { json: opts.json, format: opts.format });
  } catch (err) {
    handleError(err, opts.json);
  }
});

maskUpdateOptions(
  clipsResource
    .command("update-highlight")
    .description("Update a highlight mask")
    .argument("<videoId>", "Video ID")
    .argument("<clipId>", "Clip ID")
    .argument("<maskId>", "Mask ID"),
).action(
  async (videoId: string, clipId: string, maskId: string, opts: MaskUpdateOpts) => {
    try {
      const data = await client.patch(
        `/v1/videos/${videoId}/clips/${clipId}/highlights/${maskId}`,
        buildMaskBody(opts),
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  },
);

clipsResource
  .command("remove-highlight")
  .description("Remove a highlight mask")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<maskId>", "Mask ID")
  .option("--json", "Output as JSON")
  .action(async (videoId: string, clipId: string, maskId: string, opts: BaseOpts) => {
    try {
      await client.delete(
        `/v1/videos/${videoId}/clips/${clipId}/highlights/${maskId}`,
      );
      output({ removed: true, maskId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// Layouts
clipsResource
  .command("list-layouts")
  .description("List layouts on a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/layouts`,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("add-layout")
  .description("Add a layout or B-roll media section to a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option(
    "--layout <json>",
    "Layout shape as JSON (see Tella docs: ClipLayoutShape)",
  )
  .option("--media <json>", "Optional B-roll media JSON")
  .option("--start-time-ms <ms>", "Start time for time-ranged layout")
  .option("--duration-ms <ms>", "Duration for time-ranged layout")
  .option("--transition-style <style>", "Transition style: spring or hardCut")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: LayoutOpts) => {
    try {
      const body: Record<string, unknown> = {};
      addJsonIfSet(body, "layout", opts.layout);
      addJsonIfSet(body, "media", opts.media);
      if (opts.startTimeMs) body.startTimeMs = Number(opts.startTimeMs);
      if (opts.durationMs) body.durationMs = Number(opts.durationMs);
      if (opts.transitionStyle) body.transitionStyle = opts.transitionStyle;
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/layouts`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("update-layout")
  .description("Update a clip layout")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<layoutId>", "Layout ID")
  .option("--layout <json>", "Layout shape as JSON")
  .option("--media <json>", "Optional B-roll media JSON")
  .option("--start-time-ms <ms>", "Start time for time-ranged layout")
  .option("--duration-ms <ms>", "Duration for time-ranged layout")
  .option("--transition-style <style>", "Transition style")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(
    async (
      videoId: string,
      clipId: string,
      layoutId: string,
      opts: LayoutUpdateOpts,
    ) => {
      try {
        const body: Record<string, unknown> = {};
        addJsonIfSet(body, "layout", opts.layout);
        addJsonIfSet(body, "media", opts.media);
        if (opts.startTimeMs) body.startTimeMs = Number(opts.startTimeMs);
        if (opts.durationMs) body.durationMs = Number(opts.durationMs);
        if (opts.transitionStyle) body.transitionStyle = opts.transitionStyle;
        const data = await client.patch(
          `/v1/videos/${videoId}/clips/${clipId}/layouts/${layoutId}`,
          body,
        );
        output(data, { json: opts.json, format: opts.format });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

clipsResource
  .command("generate-auto-layouts")
  .description("Generate AI auto layouts for a clip, replacing existing layouts")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--style <style>", "Auto layout style preset")
  .option("--instructions <text>", "Free-form layout guidance")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExample:\n  tella-cli clips generate-auto-layouts vid_abc123 cl_xyz --style tutorial-round --instructions "keep camera visible"',
  )
  .action(async (videoId: string, clipId: string, opts: AutoLayoutOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.style) body.style = opts.style;
      if (opts.instructions) body.instructions = opts.instructions;
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/layouts/auto`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("remove-layout")
  .description("Remove a clip layout")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<layoutId>", "Layout ID")
  .option("--json", "Output as JSON")
  .action(
    async (videoId: string, clipId: string, layoutId: string, opts: BaseOpts) => {
      try {
        await client.delete(
          `/v1/videos/${videoId}/clips/${clipId}/layouts/${layoutId}`,
        );
        output({ removed: true, layoutId }, { json: opts.json });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

// Zooms
clipsResource
  .command("list-zooms")
  .description("List zooms on a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/zooms`,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("add-zoom")
  .description("Add a zoom to a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .requiredOption("--type <type>", "manualZoom or trackingZoom")
  .requiredOption("--start-time-ms <ms>", "Start time in ms")
  .requiredOption("--duration-ms <ms>", "Duration in ms")
  .requiredOption("--scale <n>", "Magnification factor (1 = none, max 3.5)")
  .option("--focus-x <pct>", "Focus point X percentage (0-100, for manualZoom)")
  .option("--focus-y <pct>", "Focus point Y percentage (0-100, for manualZoom)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: ZoomOpts) => {
    try {
      const body: Record<string, unknown> = {
        type: opts.type,
        startTimeMs: Number(opts.startTimeMs),
        durationMs: Number(opts.durationMs),
      };
      if (opts.scale) body.scale = Number(opts.scale);
      if (opts.focusX && opts.focusY) {
        body.focusPoint = { xPct: Number(opts.focusX), yPct: Number(opts.focusY) };
      }
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/zooms`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("update-zoom")
  .description("Update a zoom")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<zoomId>", "Zoom ID")
  .option("--type <type>", "manualZoom or trackingZoom")
  .option("--start-time-ms <ms>", "Start time in ms")
  .option("--duration-ms <ms>", "Duration in ms")
  .option("--scale <n>", "Magnification factor")
  .option("--focus-x <pct>", "Focus point X percentage (0-100)")
  .option("--focus-y <pct>", "Focus point Y percentage (0-100)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(
    async (
      videoId: string,
      clipId: string,
      zoomId: string,
      opts: ZoomUpdateOpts,
    ) => {
      try {
        const body: Record<string, unknown> = {};
        if (opts.type) body.type = opts.type;
        if (opts.startTimeMs) body.startTimeMs = Number(opts.startTimeMs);
        if (opts.durationMs) body.durationMs = Number(opts.durationMs);
        if (opts.scale) body.scale = Number(opts.scale);
        if (opts.focusX && opts.focusY) {
          body.focusPoint = { xPct: Number(opts.focusX), yPct: Number(opts.focusY) };
        }
        const data = await client.patch(
          `/v1/videos/${videoId}/clips/${clipId}/zooms/${zoomId}`,
          body,
        );
        output(data, { json: opts.json, format: opts.format });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

clipsResource
  .command("generate-auto-zooms")
  .description("Generate tracking zooms from mouse clicks in the clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--intensity <level>", "slow, medium, or fast")
  .option("--scale <n>", "Override magnification factor (1-3.5)")
  .option("--replace-existing <bool>", "Replace existing tracking zooms (true/false)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli clips generate-auto-zooms vid_abc123 cl_xyz --intensity fast --replace-existing false",
  )
  .action(async (videoId: string, clipId: string, opts: AutoZoomOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.intensity) body.intensity = opts.intensity;
      if (opts.scale) body.scale = Number(opts.scale);
      const replaceExisting = parseBool(opts.replaceExisting);
      if (replaceExisting !== undefined) body.replaceExisting = replaceExisting;
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/zooms/auto`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("remove-zoom")
  .description("Remove a zoom")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<zoomId>", "Zoom ID")
  .option("--json", "Output as JSON")
  .action(
    async (videoId: string, clipId: string, zoomId: string, opts: BaseOpts) => {
      try {
        await client.delete(
          `/v1/videos/${videoId}/clips/${clipId}/zooms/${zoomId}`,
        );
        output({ removed: true, zoomId }, { json: opts.json });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

// Overlays
clipsResource
  .command("list-overlays")
  .description("List image and video overlays on a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/overlays`,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("add-overlay")
  .description("Add an image or video overlay to a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .requiredOption("--start-time-ms <ms>", "Start time in ms")
  .requiredOption("--duration-ms <ms>", "Duration in ms")
  .option("--source-id <id>", "Source ID for a video overlay")
  .option("--image-url <url>", "Image URL for an image overlay")
  .option("--width <px>", "Source image width in pixels")
  .option("--height <px>", "Source image height in pixels")
  .option("--name <name>", "Overlay name")
  .option("--point <json>", 'Top-left percentage JSON, e.g. \'{"xPct":80,"yPct":8}\'')
  .option("--dimensions <json>", 'Artboard size JSON, e.g. \'{"width":320,"height":180}\'')
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli clips add-overlay vid_abc123 cl_xyz --image-url https://example.com/logo.png --width 512 --height 512 --start-time-ms 5000 --duration-ms 4000",
  )
  .action(async (videoId: string, clipId: string, opts: OverlayOpts) => {
    try {
      const body: Record<string, unknown> = {
        startTimeMs: Number(opts.startTimeMs),
        durationMs: Number(opts.durationMs),
      };
      if (opts.sourceId) body.sourceId = opts.sourceId;
      if (opts.imageUrl) body.imageUrl = opts.imageUrl;
      if (opts.width) body.width = Number(opts.width);
      if (opts.height) body.height = Number(opts.height);
      if (opts.name) body.name = opts.name;
      addJsonIfSet(body, "point", opts.point);
      addJsonIfSet(body, "dimensions", opts.dimensions);
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/overlays`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("update-overlay")
  .description("Update an overlay on a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<overlayId>", "Overlay ID")
  .option("--start-time-ms <ms>", "New start time in ms")
  .option("--duration-ms <ms>", "New duration in ms")
  .option("--name <name>", "Overlay name")
  .option("--point <json>", "New top-left percentage JSON")
  .option("--dimensions <json>", "New artboard size JSON")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(
    async (
      videoId: string,
      clipId: string,
      overlayId: string,
      opts: OverlayUpdateOpts,
    ) => {
      try {
        const body: Record<string, unknown> = {};
        if (opts.startTimeMs) body.startTimeMs = Number(opts.startTimeMs);
        if (opts.durationMs) body.durationMs = Number(opts.durationMs);
        if (opts.name !== undefined) body.name = opts.name;
        addJsonIfSet(body, "point", opts.point);
        addJsonIfSet(body, "dimensions", opts.dimensions);
        const data = await client.patch(
          `/v1/videos/${videoId}/clips/${clipId}/overlays/${overlayId}`,
          body,
        );
        output(data, { json: opts.json, format: opts.format });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

clipsResource
  .command("remove-overlay")
  .description("Remove an overlay from a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<overlayId>", "Overlay ID")
  .option("--json", "Output as JSON")
  .action(
    async (videoId: string, clipId: string, overlayId: string, opts: BaseOpts) => {
      try {
        await client.delete(
          `/v1/videos/${videoId}/clips/${clipId}/overlays/${overlayId}`,
        );
        output({ removed: true, overlayId }, { json: opts.json });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

// Sound effects
clipsResource
  .command("list-sound-effects")
  .description("List sound effects on a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: BaseOpts) => {
    try {
      const data = await client.get(
        `/v1/videos/${videoId}/clips/${clipId}/sound-effects`,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("add-sound-effect")
  .description("Add a sound effect to a clip from an uploaded audio source")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .requiredOption("--source-id <id>", "Source ID for the audio")
  .requiredOption("--start-time-ms <ms>", "Start time in ms")
  .requiredOption("--duration-ms <ms>", "Duration in ms")
  .option("--name <name>", "Sound effect name")
  .option("--volume <n>", "Playback volume, defaults to 1")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli clips add-sound-effect vid_abc123 cl_xyz --source-id su_audio --start-time-ms 8000 --duration-ms 1200 --volume 0.8",
  )
  .action(async (videoId: string, clipId: string, opts: SoundEffectOpts) => {
    try {
      const body: Record<string, unknown> = {
        sourceId: opts.sourceId,
        startTimeMs: Number(opts.startTimeMs),
        durationMs: Number(opts.durationMs),
      };
      if (opts.name) body.name = opts.name;
      if (opts.volume) body.volume = Number(opts.volume);
      const data = await client.post(
        `/v1/videos/${videoId}/clips/${clipId}/sound-effects`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

clipsResource
  .command("update-sound-effect")
  .description("Update a sound effect on a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<soundEffectId>", "Sound effect ID")
  .option("--start-time-ms <ms>", "New start time in ms")
  .option("--duration-ms <ms>", "New duration in ms")
  .option("--name <name>", "Sound effect name")
  .option("--volume <n>", "Playback volume")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(
    async (
      videoId: string,
      clipId: string,
      soundEffectId: string,
      opts: SoundEffectUpdateOpts,
    ) => {
      try {
        const body: Record<string, unknown> = {};
        if (opts.startTimeMs) body.startTimeMs = Number(opts.startTimeMs);
        if (opts.durationMs) body.durationMs = Number(opts.durationMs);
        if (opts.name !== undefined) body.name = opts.name;
        if (opts.volume) body.volume = Number(opts.volume);
        const data = await client.patch(
          `/v1/videos/${videoId}/clips/${clipId}/sound-effects/${soundEffectId}`,
          body,
        );
        output(data, { json: opts.json, format: opts.format });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

clipsResource
  .command("remove-sound-effect")
  .description("Remove a sound effect from a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .argument("<soundEffectId>", "Sound effect ID")
  .option("--json", "Output as JSON")
  .action(
    async (
      videoId: string,
      clipId: string,
      soundEffectId: string,
      opts: BaseOpts,
    ) => {
      try {
        await client.delete(
          `/v1/videos/${videoId}/clips/${clipId}/sound-effects/${soundEffectId}`,
        );
        output({ removed: true, soundEffectId }, { json: opts.json });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );
