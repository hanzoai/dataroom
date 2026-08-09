#!/usr/bin/env node
/**
 * Re-adds to the generated Prisma client the two things SQLite drops: enums and
 * scalar lists. Runs after `prisma generate`, so no app code changes are needed.
 *
 *   enums — the schema stores them as String, but the app imports the enum
 *     *objects* (e.g. `LinkType.DOCUMENT_LINK`) at runtime, so those objects and
 *     their types are appended. Members are identical to the pre-sqlite schema.
 *
 *   lists — `String[]` does not exist on SQLite, so fields like `Link.allowList`
 *     are declared `Json` and typed `Prisma.JsonValue`. Every value written to
 *     them is an array of strings and Prisma parses the column back into one, so
 *     the payload types are narrowed to `string[]` to match what is actually
 *     there. Without this, reads carry a type no caller can use: `.length` and
 *     `.some()` do not exist on JsonValue, and the array cannot even be spread.
 */
const fs = require("fs");
const path = require("path");

const ENUMS = {
  ConversationVisibility: ["PRIVATE", "PUBLIC_LINK", "PUBLIC_GROUP", "PUBLIC_DOCUMENT", "PUBLIC_DATAROOM"],
  ParticipantRole: ["OWNER", "PARTICIPANT"],
  FaqVisibility: ["PUBLIC_DATAROOM", "PUBLIC_LINK", "PUBLIC_DOCUMENT"],
  FaqStatus: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  ItemType: ["DATAROOM_DOCUMENT", "DATAROOM_FOLDER"],
  DefaultPermissionStrategy: ["INHERIT_FROM_PARENT", "ASK_EVERY_TIME", "HIDDEN_BY_DEFAULT"],
  DocumentStorageType: ["S3_PATH", "VERCEL_BLOB"],
  LinkType: ["DOCUMENT_LINK", "DATAROOM_LINK", "WORKFLOW_LINK"],
  LinkAudienceType: ["GENERAL", "GROUP", "TEAM"],
  CustomFieldType: ["SHORT_TEXT", "LONG_TEXT", "NUMBER", "PHONE_NUMBER", "URL", "CHECKBOX", "SELECT", "MULTI_SELECT"],
  ViewType: ["DOCUMENT_VIEW", "DATAROOM_VIEW"],
  DownloadType: ["SINGLE", "BULK", "FOLDER"],
  EmailType: ["FIRST_DAY_DOMAIN_REMINDER_EMAIL", "FIRST_DOMAIN_INVALID_EMAIL", "SECOND_DOMAIN_INVALID_EMAIL", "FIRST_TRIAL_END_REMINDER_EMAIL", "FINAL_TRIAL_END_REMINDER_EMAIL"],
  TagType: ["LINK_TAG", "DOCUMENT_TAG", "DATAROOM_TAG"],
  InvitationStatus: ["SENT", "FAILED", "BOUNCED"],
  Role: ["ADMIN", "MANAGER", "MEMBER"],
  WorkflowStepType: ["ROUTER"],
  ExecutionStatus: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "BLOCKED"],
};

// `String[]` fields, by the model that owns them. Model-scoped on purpose:
// `domains` is a list of strings on ViewerGroup but a `Domain[]` RELATION on
// Team and User, and narrowing those by field name alone would break them.
const LISTS = {
  Link: ["allowList", "denyList"],
  LinkPreset: ["allowList", "denyList"],
  VisitorGroup: ["emails"],
  ViewerGroup: ["domains"],
  Team: ["globalBlockList"],
};

/**
 * Narrow each listed field from `Prisma.JsonValue` to `string[]` inside its own
 * model's payload type. Throws if a field is neither already narrowed nor the
 * JsonValue it expects — a schema change that moves one of these fields should
 * fail the install, not silently stop being typed.
 */
function narrowLists(src) {
  let narrowed = 0;
  for (const [model, fields] of Object.entries(LISTS)) {
    const start = src.indexOf(`export type $${model}Payload`);
    if (start === -1) throw new Error(`no payload type for model ${model}`);
    const rest = src.indexOf("\nexport type $", start + 1);
    const end = rest === -1 ? src.length : rest;
    let block = src.slice(start, end);

    for (const field of fields) {
      if (new RegExp(`^\\s+${field}: string\\[\\]$`, "m").test(block)) continue;
      const json = new RegExp(`^(\\s+)${field}: Prisma\\.JsonValue$`, "m");
      if (!json.test(block)) {
        throw new Error(`${model}.${field} is not Prisma.JsonValue in the generated client`);
      }
      block = block.replace(json, `$1${field}: string[]`);
      narrowed++;
    }
    src = src.slice(0, start) + block + src.slice(end);
  }
  return [src, narrowed];
}

const enumObjects = {};
for (const [name, members] of Object.entries(ENUMS)) {
  enumObjects[name] = Object.freeze(Object.fromEntries(members.map((m) => [m, m])));
}

const MARK = "/* __sqlite_enum_shim__ */";
const jsPayload =
  "\n" + MARK + "\n" +
  "Object.assign(exports, " + JSON.stringify(enumObjects) + ");\n";

// type declarations so tsc-aware tooling still resolves the names
const dtsPayload =
  "\n" + MARK + "\n" +
  Object.entries(ENUMS)
    .map(([name, members]) => {
      const union = members.map((m) => JSON.stringify(m)).join(" | ");
      const obj = members.map((m) => `${m}: ${JSON.stringify(m)}`).join(", ");
      // `| (string & {})` because the COLUMN is a String now: sqlite has no
      // enum, so the generated client types these fields as plain `string`,
      // and a bare literal union rejects every read back out of the database
      // ("Type 'string' is not assignable to type 'DocumentStorageType'").
      // The intersection keeps the literals in autocomplete instead of
      // collapsing the whole thing to `string`.
      return `export type ${name} = ${union} | (string & {});\nexport declare const ${name}: { ${obj} };`;
    })
    .join("\n") + "\n";

// Candidate generated-client roots (@prisma/client re-exports .prisma/client)
const roots = [
  path.join(process.cwd(), "node_modules/.prisma/client"),
  path.join(process.cwd(), "node_modules/@prisma/client"),
];

let injected = 0;
let narrowed = 0;
let declared = 0;
let found = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;

  // Only the generated declarations carry payload types; @prisma/client just
  // re-exports them, so it has nothing to narrow.
  const decls = path.join(root, "index.d.ts");
  if (fs.existsSync(decls)) {
    const cur = fs.readFileSync(decls, "utf8");
    if (cur.includes("export type $LinkPayload")) {
      const [next, n] = narrowLists(cur);
      declared++;
      if (n > 0) {
        fs.writeFileSync(decls, next);
        narrowed += n;
        console.log(`narrowed ${n} sqlite list field(s) ->`, decls);
      }
    }
  }

  for (const [file, payload] of [
    ["index.js", jsPayload],
    ["default.js", jsPayload],
    ["index.d.ts", dtsPayload],
    ["default.d.ts", dtsPayload],
  ]) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    found++;
    const cur = fs.readFileSync(p, "utf8");
    if (cur.includes(MARK)) continue;
    fs.appendFileSync(p, payload);
    injected++;
    console.log("injected sqlite enum shim ->", p);
  }
}
// Nothing to inject is fine — a re-run over an already-shimmed client. Nothing
// to inject INTO is not: the client is missing and every enum import would be
// undefined at runtime.
if (found === 0) {
  console.error("ERROR: no generated Prisma client found to inject enums into");
  process.exit(1);
}
if (declared === 0) {
  console.error("ERROR: no generated Prisma declarations found to narrow list fields in");
  process.exit(1);
}
console.log(
  `sqlite shim: ${Object.keys(ENUMS).length} enums into ${injected} file(s), ${narrowed} list field(s) narrowed`,
);

