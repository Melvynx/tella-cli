import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface BaseOpts {
  json?: boolean;
  format?: string;
  fields?: string;
}

interface UpdateClipOpts extends BaseOpts {
  name?: string;
  order?: string;
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
  fromMs: string;
  toMs: string;
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
  layout: string;
  startTimeMs?: string;
  durationMs?: string;
  transitionStyle?: string;
}

interface LayoutUpdateOpts extends BaseOpts {
  layout?: string;
  startTimeMs?: string;
  durationMs?: string;
  transitionStyle?: string;
}

interface ZoomOpts extends BaseOpts {
  type: string;
  startTimeMs: string;
  durationMs: string;
  scale?: string;
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
  .description("Rename or reorder a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .option("--name <name>", "New clip name")
  .option("--order <n>", "New position (0 = first)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: UpdateClipOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name !== undefined) body.name = opts.name;
      if (opts.order !== undefined) body.order = Number(opts.order);
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
  .description("Cut a time range from a clip")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .requiredOption("--from-ms <ms>", "Start of cut range (ms)")
  .requiredOption("--to-ms <ms>", "End of cut range (ms)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: CutOpts) => {
    try {
      const data = await client.post(`/v1/videos/${videoId}/clips/${clipId}/cut`, {
        fromMs: Number(opts.fromMs),
        toMs: Number(opts.toMs),
      });
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
    body.point = { x: Number(opts.pointX), y: Number(opts.pointY) };
  }
  if (opts.dimWidth !== undefined && opts.dimHeight !== undefined) {
    body.dimensions = {
      width: Number(opts.dimWidth),
      height: Number(opts.dimHeight),
    };
  }
  return body;
};

const maskAddOptions = (cmd: Command) =>
  cmd
    .requiredOption("--start-time-ms <ms>", "Start time in ms")
    .requiredOption("--duration-ms <ms>", "Duration in ms")
    .requiredOption("--point-x <x>", "Top-left X coordinate (0-1 normalized)")
    .requiredOption("--point-y <y>", "Top-left Y coordinate (0-1 normalized)")
    .requiredOption("--dim-width <w>", "Mask width (0-1 normalized)")
    .requiredOption("--dim-height <h>", "Mask height (0-1 normalized)")
    .option("--json", "Output as JSON")
    .option("--format <fmt>", "Output format: text, json, csv, yaml");

const maskUpdateOptions = (cmd: Command) =>
  cmd
    .option("--start-time-ms <ms>", "Start time in ms")
    .option("--duration-ms <ms>", "Duration in ms")
    .option("--point-x <x>", "Top-left X coordinate (0-1 normalized)")
    .option("--point-y <y>", "Top-left Y coordinate (0-1 normalized)")
    .option("--dim-width <w>", "Mask width (0-1 normalized)")
    .option("--dim-height <h>", "Mask height (0-1 normalized)")
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
  .description("Add a layout to a clip (use --start-time-ms + --duration-ms for time-ranged)")
  .argument("<videoId>", "Video ID")
  .argument("<clipId>", "Clip ID")
  .requiredOption(
    "--layout <json>",
    "Layout shape as JSON (see Tella docs: ClipLayoutShape)",
  )
  .option("--start-time-ms <ms>", "Start time for time-ranged layout")
  .option("--duration-ms <ms>", "Duration for time-ranged layout")
  .option("--transition-style <style>", "Transition style (cut, crossfade, etc.)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .action(async (videoId: string, clipId: string, opts: LayoutOpts) => {
    try {
      const body: Record<string, unknown> = {
        layout: JSON.parse(opts.layout),
      };
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
        if (opts.layout) body.layout = JSON.parse(opts.layout);
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
  .option("--scale <n>", "Magnification factor (1 = none, max 3.5)")
  .option("--focus-x <x>", "Focus point X (0-1, for manualZoom)")
  .option("--focus-y <y>", "Focus point Y (0-1, for manualZoom)")
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
        body.focusPoint = { x: Number(opts.focusX), y: Number(opts.focusY) };
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
  .option("--focus-x <x>", "Focus point X (0-1)")
  .option("--focus-y <y>", "Focus point Y (0-1)")
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
          body.focusPoint = { x: Number(opts.focusX), y: Number(opts.focusY) };
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
