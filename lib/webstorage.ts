/**
 * Provides a wrapper around localStorage(and sessionStorage(TODO when needed)) to avoid errors in case of restricted storage access.
 *
 * TODO: In case of an embed if localStorage is not available(third party), use localStorage of parent(first party) that contains the iframe.
 */

/**
 * Every persisted key, named once. Call sites reference these rather than
 * spelling a string, so renaming a key is a change in one file.
 */
export const StorageKey = {
  /** Viewer's email, prefilled into the access form on return visits. */
  viewerEmail: "dataroom.email",
  /** Viewer's name, prefilled into the access form on return visits. */
  viewerName: "dataroom.name",
  /** Which auth method the user signed in with last. */
  lastLogin: "dataroom.last_login",
  /** Whether the links table renders collapsed. */
  linksCollapsed: "dataroom.links_collapsed",
} as const;

/**
 * Keys this fork inherited under upstream's brand. A returning visitor still
 * has their email and name under these names, so a read of the current key
 * falls back to the old one, moves the value across, and drops the old entry.
 * Migration happens on read, so it needs no boot-order hook and cannot run
 * before the value it is meant to carry has been asked for.
 *
 * Removing an entry here forgets whatever visitors had stored under it.
 */
const LEGACY_KEYS: Record<string, string> = {
  [StorageKey.viewerEmail]: "papermark.email",
  [StorageKey.viewerName]: "papermark.name",
  [StorageKey.lastLogin]: "last_papermark_login",
  [StorageKey.linksCollapsed]: "papermark-all-links-collapsed",
};

export const localStorage = {
  getItem(key: string) {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) return value;

      const legacyKey = LEGACY_KEYS[key];
      if (!legacyKey) return null;

      const legacyValue = window.localStorage.getItem(legacyKey);
      if (legacyValue === null) return null;

      window.localStorage.setItem(key, legacyValue);
      window.localStorage.removeItem(legacyKey);
      return legacyValue;
    } catch (e) {
      // In case storage is restricted. Possible reasons
      // 1. Third Party Context in Chrome Incognito mode.
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
      const legacyKey = LEGACY_KEYS[key];
      if (legacyKey) window.localStorage.removeItem(legacyKey);
    } catch (e) {
      // In case storage is restricted. Possible reasons
      // 1. Third Party Context in Chrome Incognito mode.
      // 2. Storage limit reached
      return;
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
      const legacyKey = LEGACY_KEYS[key];
      if (legacyKey) window.localStorage.removeItem(legacyKey);
    } catch (e) {
      return;
    }
  },
};
