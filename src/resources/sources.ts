import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface CreateSourceOpts {
  kind?: string;
  width: string;
  height: string;
  duration: string;
  json?: boolean;
  format?: string;
}

export const sourcesResource = new Command("sources").description(
  "Create upload sources for clips, B-roll, overlays, and sound effects",
);

sourcesResource
  .command("create")
  .description("Create a source upload and return a sourceId plus pre-signed uploadUrl")
  .option("--kind <kind>", "Source kind (currently video)", "video")
  .requiredOption("--width <px>", "Source width in pixels")
  .requiredOption("--height <px>", "Source height in pixels")
  .requiredOption("--duration <seconds>", "Source duration in seconds")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli sources create --width 1920 --height 1080 --duration 42.5 --json",
  )
  .action(async (opts: CreateSourceOpts) => {
    try {
      const data = await client.post("/v1/sources", {
        kind: opts.kind,
        width: Number(opts.width),
        height: Number(opts.height),
        duration: Number(opts.duration),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
