#!/usr/bin/env node
/**
 * personalize-birthday-captions.mjs
 *
 * Tiny CLI for swapping the 15 [GER: refine] placeholder captions in
 * src/experiences/birthday/birthday.data.ts with Ger's actual
 * inside-jokes / memories.
 *
 * The script operates on the data file as text (no TypeScript runtime
 * dependency) — it locates the BIRTHDAY_PHOTO_CAPTIONS block and
 * patches caption strings in place, keeping comments, type annotations,
 * and surrounding structure intact.
 *
 * Usage:
 *   node scripts/personalize-birthday-captions.mjs --list
 *     → prints every slot number + current caption + the [GER: refine]
 *       hint comment as a markdown grid in stdout. Also dumps to
 *       ./personalize-captions.md for easy editing.
 *
 *   node scripts/personalize-birthday-captions.mjs --apply <json>
 *     → reads the given JSON file (format below), patches the data
 *       file, writes it back. Saves a backup as
 *       birthday.data.ts.bak in case you want to revert.
 *
 *   node scripts/personalize-birthday-captions.mjs --suggest
 *     → copies ./personalize-suggestions.json (if present) into a
 *       fresh ./personalize-captions-edits.json for editing. If the
 *       suggestions file is missing, exits with a helpful error.
 *
 * JSON format (JSON object, keys are slot numbers 1..16):
 *   {
 *     "1": "the night you fell asleep on my shoulder at Sudirman",
 *     "2": "the café in Bandung where you ordered three es teh manis",
 *     ...
 *   }
 *
 * Why this script?
 *   - Avoids hand-editing 16 lines across a 280-line TypeScript data
 *     file. Lower chance of breaking JSDoc, Record keys, or commas.
 *   - Lets Ger write/revise captions in a JSON sidecar (any editor)
 *     and apply them in one command.
 *   - Provides --list so Ger can see ALL 16 current captions + the
 *     [GER: refine] hints in one place.
 */

import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(process.cwd());
const DATA = path.join(
  REPO,
  "src/experiences/birthday/birthday.data.ts",
);
const SUGGESTIONS = path.join(REPO, "personalize-suggestions.json");
const EDITS_TEMPLATE = path.join(REPO, "personalize-captions-edits.json");
const MARKDOWN_OUT = path.join(REPO, "personalize-captions.md");

// ── args parsing ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const positional = args.find((a) => !a.startsWith("--")) ?? null;

function usage(label) {
  console.log(
    `[personalize-birthday-captions.mjs] ${label}\n\n` +
      `Usage:\n` +
      `  --list             Print all 16 captions + [GER: refine] hints.\n` +
      `  --apply <json>     Apply caption swaps from a JSON sidecar.\n` +
      `  --suggest          Copy personalize-suggestions.json → edits.json.\n` +
      `  --help             Show this message.\n`,
  );
  process.exit(label === "error" ? 1 : 0);
}

if (flag("--help") || args.length === 0) usage("ok");

// ── helpers ──────────────────────────────────────────────────────────
function readData() {
  if (!fs.existsSync(DATA)) {
    console.error(`[err] not found: ${path.relative(REPO, DATA)}`);
    process.exit(1);
  }
  return fs.readFileSync(DATA, "utf8");
}

/**
 * Parse caption lines out of BIRTHDAY_PHOTO_CAPTIONS block.
 * Returns array of objects: { slot: number, caption: string, refine: string }
 * refine = text of the // [GER: refine …] comment immediately following
 * the caption line, or "" if no marker.
 */
function parseCaptions(src) {
  const blockMatch = src.match(
    /BIRTHDAY_PHOTO_CAPTIONS:\s*Record<number,\s*string>\s*=\s*\{([\s\S]*?)\n\};/,
  );
  if (!blockMatch) {
    console.error("[err] BIRTHDAY_PHOTO_CAPTIONS block not found");
    process.exit(1);
  }
  const block = blockMatch[1];
  const slots = [];
  // Match each "<n>: "..." line, optionally followed by an INLINE
  // `// [GER: refine …]` comment on the same line. The 3rd capture group
  // `(?:\/\/\s*(.*?))?$` is the critical part — it extracts the comment
  // text so the listing can show Ger the per-slot refine hint. Without
  // that capture (and listening only to a separate-line pattern),
  // birthday.data.ts's inline comment style would silently drop.
  const lines = block.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const slotMatch = line.match(
      /^\s*(\d+):\s*"((?:\\.|[^"\\])*)",?\s*(?:\/\/\s*(.*?))?\s*$/,
    );
    if (slotMatch) {
      slots.push({
        slot: parseInt(slotMatch[1], 10),
        caption: slotMatch[2]
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\"),
        refine: (slotMatch[3] ?? "").trim(),
      });
    }
  }
  return slots;
}

// ── --list ────────────────────────────────────────────────────────────
function cmdList() {
  const src = readData();
  const slots = parseCaptions(src);
  // markdown grid
  const md = [
    "# Birthday Experience — Personalize Captions",
    "",
    "Edit `personalize-captions-edits.json` (or any JSON of the same shape)",
    "and run: `node scripts/personalize-birthday-captions.mjs --apply personalize-captions-edits.json`",
    "",
    "| slot | current caption | [GER: refine] hint |",
    "|------|-----------------|---------------------|",
    ...slots.map(
      (s) =>
        `| ${s.slot} | ${s.caption.replace(/\|/g, "\\|")} | ${s.refine.replace(/\|/g, "\\|")} |`,
    ),
    "",
    "Cities assigned per slot (from BIRTHDAY_PHOTO_VARIANTS so the postmark stays authentic):",
    "1=Jakarta · 2=Bandung · 3=Yogyakarta · 4=Bali · 5=Semarang · 6=Malang",
    "7=Bogor · 8=Surabaya · 9=Manila · 10=Singapore · 11=Kuala Lumpur · 12=Bangkok",
    "13=Tokyo · 14=Osaka · 15=Kyoto · 16=Jakarta (finale)",
    "",
  ].join("\n");
  fs.writeFileSync(MARKDOWN_OUT, md);
  console.log(md);
  console.log(`[ok] wrote ${path.relative(REPO, MARKDOWN_OUT)}`);
}

// ── --apply ───────────────────────────────────────────────────────────
function cmdApply(jsonPath) {
  const jsonAbs = path.isAbsolute(jsonPath)
    ? jsonPath
    : path.join(REPO, jsonPath);
  if (!fs.existsSync(jsonAbs)) {
    console.error(`[err] --apply needs a JSON file. Not found: ${jsonPath}`);
    usage("error");
  }
  let edits;
  try {
    edits = JSON.parse(fs.readFileSync(jsonAbs, "utf8"));
  } catch (e) {
    console.error(`[err] cannot parse JSON from ${jsonPath}: ${e.message}`);
    process.exit(1);
  }
  if (typeof edits !== "object" || edits === null || Array.isArray(edits)) {
    console.error("[err] JSON must be an object: { \"1\": \"...\", \"2\": \"...\" }");
    process.exit(1);
  }

  const src = readData();
  let patched = src;
  let applied = 0;
  let skipped = [];
  for (const [keyRaw, valueRaw] of Object.entries(edits)) {
    const key = keyRaw;
    if (!/^\d+$/.test(key)) {
      skipped.push(`slot ${key}: key not numeric`);
      continue;
    }
    if (typeof valueRaw !== "string") {
      skipped.push(`slot ${key}: value not string`);
      continue;
    }
    const escaped = valueRaw.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    // Match the original slot line. Capture the slot number, allowing for
    // whitespace variation, and replace just the quoted string content.
    // Capture the trailing comma so the Record<number, string> literal does
    // NOT collapse adjacent entries into a syntax error. The `,?` group is
    // optional so we also handle the LAST slot (no trailing comma).
    const re = new RegExp(
      `(\\b${key}:\\s*)"((?:\\\\.|[^"\\\\])*)"(,?)`,
    );
    if (!re.test(patched)) {
      skipped.push(`slot ${key}: line not found`);
      continue;
    }
    patched = patched.replace(
      re,
      (_, prefix, _oldStr, comma) => `${prefix}"${escaped}"${comma ?? ""}`,
    );
    applied++;
  }

  // Backup + write. Timestamp suffix prevents stale .bak from previous
  // runs overwriting each other — Ger can restore from any of them.
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  fs.writeFileSync(`${DATA}.bak.${ts}`, src);
  fs.writeFileSync(DATA, patched);
  console.log(`[ok] applied ${applied} caption swap${applied === 1 ? "" : "s"}`);
  if (skipped.length) {
    console.log(`[warn] skipped ${skipped.length}:`);
    for (const s of skipped) console.log(`        - ${s}`);
  }
  console.log(`[ok] backup saved at ${path.relative(REPO, DATA + ".bak." + ts)}`);
  console.log(`[i] next: \`npx tsc --noEmit\` to verify, then re-run dev server`);
}

// ── --suggest ─────────────────────────────────────────────────────────
function cmdSuggest() {
  if (!fs.existsSync(SUGGESTIONS)) {
    console.error(
      `[err] ${path.relative(REPO, SUGGESTIONS)} not found.\n` +
        `Run \`--list\` first to see current captions, then write your edits JSON manually.`,
    );
    process.exit(1);
  }
  fs.copyFileSync(SUGGESTIONS, EDITS_TEMPLATE);
  console.log(
    `[ok] copied \n        ${path.relative(REPO, SUGGESTIONS)}\n      → \n        ${path.relative(REPO, EDITS_TEMPLATE)}\n` +
      `[i] edit personalize-captions-edits.json (replace any slot you want),\n` +
      `    then run: --apply personalize-captions-edits.json`,
  );
}

// ── dispatch ──────────────────────────────────────────────────────────
if (flag("--list")) cmdList();
else if (flag("--apply")) {
  if (!positional) {
    console.error("[err] --apply requires a JSON file path argument");
    usage("error");
  }
  cmdApply(positional);
} else if (flag("--suggest")) cmdSuggest();
else usage("error");
