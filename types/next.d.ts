/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Next writes these same two references into next-env.d.ts at build time, and
// that file is gitignored — so a typecheck that runs before a build has no
// declaration for `*.svg` and every static image import fails to resolve.
// Committing them makes `tsc --noEmit` stand on its own.
