import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface CreateOpts {
  url: string;
  filterTypes: string;
  json?: boolean;
  format?: string;
}

interface ListMessagesOpts {
  eventTypes?: string;
  limit?: string;
  fields?: string;
  json?: boolean;
  format?: string;
}

interface BaseOpts {
  json?: boolean;
  format?: string;
}

export const webhooksResource = new Command("webhooks").description(
  "Manage Tella webhook endpoints and view delivery messages",
);

webhooksResource
  .command("create-endpoint")
  .description("Create a webhook endpoint subscription")
  .requiredOption("--url <url>", "Destination URL for webhook deliveries")
  .requiredOption(
    "--filter-types <types>",
    "Comma-separated event types (e.g. video.created,export.ready)",
  )
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli webhooks create-endpoint --url https://hooks.example.com/tella --filter-types video.created,export.ready",
  )
  .action(async (opts: CreateOpts) => {
    try {
      const data = await client.post("/v1/webhooks/endpoints", {
        url: opts.url,
        filterTypes: opts.filterTypes.split(",").map((s) => s.trim()),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webhooksResource
  .command("delete-endpoint")
  .description("Delete a webhook endpoint")
  .argument("<id>", "Endpoint ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  tella-cli webhooks delete-endpoint wh_abc123")
  .action(async (id: string, opts: BaseOpts) => {
    try {
      await client.delete(`/v1/webhooks/endpoints/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webhooksResource
  .command("get-secret")
  .description("Get the signing secret for a webhook endpoint")
  .argument("<id>", "Endpoint ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  tella-cli webhooks get-secret wh_abc123")
  .action(async (id: string, opts: BaseOpts) => {
    try {
      const data = await client.get(`/v1/webhooks/endpoints/${id}/secret`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webhooksResource
  .command("list-messages")
  .description("List recent webhook delivery messages")
  .option("--event-types <types>", "Comma-separated event types to filter")
  .option("--limit <n>", "Max number of messages to return")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  tella-cli webhooks list-messages --event-types video.created --limit 20",
  )
  .action(async (opts: ListMessagesOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.eventTypes) params.event_types = opts.eventTypes;
      if (opts.limit) params.limit = opts.limit;
      const data = await client.get("/v1/webhooks/messages", params);
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

webhooksResource
  .command("get-message")
  .description("Get a specific webhook delivery message")
  .argument("<id>", "Message ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  tella-cli webhooks get-message msg_abc123")
  .action(async (id: string, opts: BaseOpts) => {
    try {
      const data = await client.get(`/v1/webhooks/messages/${id}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
