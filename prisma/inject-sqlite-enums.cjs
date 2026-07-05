#!/usr/bin/env node
/**
 * SQLite has no Prisma enum support, so the schema stores these as String.
 * The app, however, imports the enum *objects* (e.g. `LinkType.DOCUMENT_LINK`)
 * from `@prisma/client` at runtime. This re-injects those objects into the
 * generated client after `prisma generate`, so no app code changes are needed.
 * Values are the original enum members (kept identical to the pre-sqlite schema).
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
      return `export type ${name} = ${union};\nexport declare const ${name}: { ${obj} };`;
    })
    .join("\n") + "\n";

// Candidate generated-client roots (@prisma/client re-exports .prisma/client)
const roots = [
  path.join(process.cwd(), "node_modules/.prisma/client"),
  path.join(process.cwd(), "node_modules/@prisma/client"),
];

let injected = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const [file, payload] of [
    ["index.js", jsPayload],
    ["default.js", jsPayload],
    ["index.d.ts", dtsPayload],
    ["default.d.ts", dtsPayload],
  ]) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    const cur = fs.readFileSync(p, "utf8");
    if (cur.includes(MARK)) continue;
    fs.appendFileSync(p, payload);
    injected++;
    console.log("injected sqlite enum shim ->", p);
  }
}
if (injected === 0) {
  console.error("ERROR: no generated Prisma client found to inject enums into");
  process.exit(1);
}
console.log(`sqlite enum shim: injected into ${injected} file(s), ${Object.keys(ENUMS).length} enums`);
