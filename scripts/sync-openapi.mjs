#!/usr/bin/env node
// Writes src/resources/generated.ts: one command per Tella API operation that no hand-written command covers.
// Usage: node scripts/sync-openapi.mjs [openapi url or file]  (default https://api.tella.com/openapi.json)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = process.argv[2] || 'https://api.tella.com/openapi.json';
const spec = src.startsWith('http') ? await (await fetch(src)).json() : JSON.parse(fs.readFileSync(src, 'utf8'));

// operationId -> [resource, command]. Resources that do not exist yet are created by the generated file.
const NAMES = {
  getWorkspaceAnalytics: ['analytics', 'workspace'],
  getVideoAnalytics: ['analytics', 'video'],
  listBackgrounds: ['backgrounds', 'list'],
  listLibraryItems: ['library', 'list'],
  createLibraryItem: ['library', 'create'],
  createGeneration: ['library', 'generate'],
  getGeneration: ['library', 'get-generation'],
  captureScreenshot: ['library', 'screenshot'],
  deleteLibraryItem: ['library', 'delete'],
  listSocialAccounts: ['videos', 'social-accounts'],
  getSource: ['sources', 'get'],
  getSourceStoryboard: ['sources', 'storyboard'],
  getStandaloneSourceThumbnail: ['sources', 'thumbnail'],
  getStandaloneSourceWaveform: ['sources', 'waveform'],
  listSubtitlePresets: ['presets', 'list-subtitles'],
  saveSubtitlePreset: ['presets', 'save-subtitles'],
  listTextPresets: ['presets', 'list-text'],
  saveTextPreset: ['presets', 'save-text'],
  deleteTextPreset: ['presets', 'delete-text'],
  listTags: ['tags', 'list'],
  createTag: ['tags', 'create'],
  deleteTag: ['tags', 'delete'],
  updateTag: ['tags', 'update'],
  listVideoTags: ['tags', 'list-video'],
  addVideoTag: ['tags', 'add-video'],
  removeVideoTag: ['tags', 'remove-video'],
  searchVideos: ['videos', 'search'],
  removeBackgroundMusic: ['videos', 'remove-background-music'],
  setBackgroundMusic: ['videos', 'set-background-music'],
  getVideoCaptions: ['videos', 'captions'],
  applyVideoEdits: ['videos', 'edits'],
  cancelScheduledPublication: ['videos', 'cancel-publish'],
  listVideoPublications: ['videos', 'list-publications'],
  publishVideo: ['videos', 'publish'],
  getVideoStoryboard: ['videos', 'storyboard'],
  applySubtitlePreset: ['videos', 'apply-subtitle-preset'],
  getClipAudioLevels: ['clips', 'audio-levels'],
  autoCropClip: ['clips', 'auto-crop'],
  getClipFilters: ['clips', 'filters'],
  setClipFilters: ['clips', 'set-filters'],
  listClipMouseEvents: ['clips', 'mouse-events'],
  getClipStoryboard: ['clips', 'storyboard'],
  listClipTextOverlays: ['clips', 'list-text-overlays'],
  addClipTextOverlay: ['clips', 'add-text-overlay'],
  removeClipTextOverlay: ['clips', 'remove-text-overlay'],
  updateClipTextOverlay: ['clips', 'update-text-overlay'],
  updateClipTranscriptWords: ['clips', 'update-transcript-words'],
  listVideoExports: ['videos', 'list-exports'],
  setVideoThumbnail: ['videos', 'set-thumbnail'],
  removeVideoThumbnail: ['videos', 'remove-thumbnail'],
  updateWebhookEndpoint: ['webhooks', 'update-endpoint'],
  listWebhookEndpoints: ['webhooks', 'list-endpoints'],
  createVideo: ['videos', 'create'],
};
const DESCRIPTIONS = {
  analytics: 'Workspace and video analytics',
  backgrounds: 'Background images available to clips',
  library: 'Workspace media library: uploads, AI generations, screenshots',
  presets: 'Saved subtitle and text presets',
  tags: 'Workspace tags and the tags on each video',
};

const handWritten = fs
  .readdirSync(path.join(root, 'src/resources'))
  .filter((f) => f.endsWith('.ts') && f !== 'generated.ts')
  .map((f) => fs.readFileSync(path.join(root, 'src/resources', f), 'utf8'))
  .join('\n');
const covered = (method, p) => {
  const pathRe = p.replace(/[/.]/g, '\\$&').replace(/\\\{[^}]+\\\}|\{[^}]+\}/g, '\\$\\{[^}]+\\}');
  const re = new RegExp(`client\\.${method}(<[^>]*>)?\\(\\s*[\`"']${pathRe}(\\?[^\`"']*)?[\`"']`);
  return re.test(handWritten);
};
const resolve = (s) => (s?.$ref ? resolve(spec.components.schemas[s.$ref.split('/').pop()]) : s);
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const q = (s) => JSON.stringify(String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 160));

const commands = [];
const unnamed = [];
for (const [p, item] of Object.entries(spec.paths)) {
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const op = item[method];
    if (!op || covered(method, p)) continue;
    const name = NAMES[op.operationId];
    if (!name) { unnamed.push(`${method.toUpperCase()} ${p} (${op.operationId})`); continue; }
    const pathParams = [...p.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
    const RESERVED = new Set(['json', 'format', 'body']);
    const query = (op.parameters || []).filter((x) => x.in === 'query' && !RESERVED.has(x.name));
    const body = resolve(op.requestBody?.content?.['application/json']?.schema);
    const taken = new Set(query.map((x) => kebab(x.name)));
    const props = Object.entries(body?.properties || {})
      .filter(([k]) => !RESERVED.has(k) && !taken.has(kebab(k)))
      .map(([k, v]) => [k, resolve(v)]);
    const required = new Set(body?.required || []);
    commands.push({ method, p, op, name, pathParams, query, props, required, hasBody: !!body });
  }
}

const resources = [...new Set(commands.map((c) => c.name[0]))];
const existing = { videos: "videosResource", clips: "clipsResource", sources: "sourcesResource", playlists: "playlistsResource", webhooks: "webhooksResource" };
let out = `// Generated by scripts/sync-openapi.mjs from ${src}. Do not edit: change NAMES there and rerun.
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";
${resources.filter((r) => existing[r]).map((r) => `import { ${existing[r]} } from "./${r}.js";`).join('\n')}

type Opts = Record<string, string | boolean | undefined>;
const coerce = (v: string, type?: string): unknown =>
  type === "object" || type === "array" ? JSON.parse(v) : type === "integer" || type === "number" ? Number(v) : type === "boolean" ? v === "true" : v;
const run = async (opts: Opts, fn: () => Promise<unknown>) => {
  try {
    output(await fn(), { json: opts.json as boolean, format: opts.format as string });
  } catch (err) {
    handleError(err, opts.json as boolean);
  }
};

${resources.filter((r) => !existing[r]).map((r) => `export const ${camel(r)}Resource = new Command("${r}").description(${q(DESCRIPTIONS[r] || r)});`).join('\n')}
`;

for (const c of commands) {
  const target = existing[c.name[0]] || `${camel(c.name[0])}Resource`;
  const lines = [`\n${target}\n  .command("${c.name[1]}")\n  .description(${q(c.op.summary || c.op.description)})`];
  for (const a of c.pathParams) lines.push(`  .argument("<${a}>", "${a}")`);
  for (const x of c.query) lines.push(`  .option("--${kebab(x.name)} <v>", ${q(x.description || x.schema?.type)})`);
  for (const [k, v] of c.props) {
    const kind = v?.type === 'object' || v?.type === 'array' ? ' (JSON)' : '';
    lines.push(`  .option("--${kebab(k)} <v>", ${q((c.required.has(k) ? 'required. ' : '') + (v?.description || v?.type || '') + kind)})`);
  }
  if (c.hasBody) lines.push(`  .option("--body <json>", "Whole JSON body (merged under the flags)")`);
  lines.push(`  .option("--json", "Output as JSON")\n  .option("--format <fmt>", "Output format: text, json, csv, yaml")`);
  const args = c.pathParams.map((a) => `${camel(a)}: string`).concat('opts: Opts').join(', ');
  const url = '`' + c.p.replace(/\{([^}]+)\}/g, (_, a) => `\${encodeURIComponent(${camel(a)})}`) + '`';
  let fn;
  if (c.method === 'get' || c.method === 'delete') {
    const params = c.query.map((x) => `${JSON.stringify(x.name)}: opts.${camel(kebab(x.name))} as string`).join(', ');
    fn = c.method === 'get' ? `client.get(${url}, { ${params} })` : `client.delete(${url})`;
  } else {
    const types = Object.fromEntries(c.props.map(([k, v]) => [k, v?.type]));
    fn = `(() => {
      const body: Record<string, unknown> = opts.body ? JSON.parse(opts.body as string) : {};
      const types: Record<string, string | undefined> = ${JSON.stringify(types)};
      for (const k of Object.keys(types)) {
        const v = opts[k.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase())];
        if (typeof v === "string") body[k] = coerce(v, types[k]);
      }
      return client.${c.method}(${url}, body);
    })()`;
  }
  lines.push(`  .action(async (${args}) => run(opts, () => ${fn}));`);
  out += lines.join('\n') + '\n';
}

fs.writeFileSync(path.join(root, 'src/resources/generated.ts'), out);
const created = resources.filter((r) => !existing[r]).map((r) => `${camel(r)}Resource`);
console.log(JSON.stringify({ generated: commands.length, newResources: created, unnamed }, null, 2));
