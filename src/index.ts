#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { videosResource } from "./resources/videos.js";
import { clipsResource } from "./resources/clips.js";
import { playlistsResource } from "./resources/playlists.js";
import { sourcesResource } from "./resources/sources.js";
import { webhooksResource } from "./resources/webhooks.js";

const program = new Command();

program
  .name("tella-cli")
  .description("CLI for the Tella video API")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

program.addCommand(authCommand);
program.addCommand(videosResource);
program.addCommand(clipsResource);
program.addCommand(playlistsResource);
program.addCommand(sourcesResource);
program.addCommand(webhooksResource);

program.parse();
