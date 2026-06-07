// INFO: for numeric values, `null` means unlimited.
//
// Hanzo Dataroom is AGPL with no commercial-tier paywall — every limit is
// effectively unlimited. The named constants are kept so existing call sites
// compile, but every shape resolves to the same unlimited profile.

export type TPlanLimits = {
  users: number;
  links: number | null;
  documents: number | null;
  domains: number;
  datarooms: number;
  customDomainOnPro: boolean;
  customDomainInDataroom: boolean;
  advancedLinkControlsOnPro: boolean | null;
  watermarkOnBusiness?: boolean | null;
  agreementOnBusiness?: boolean | null;
};

const UNLIMITED: TPlanLimits & {
  conversationsInDataroom: boolean;
  fileSizeLimits: { maxFiles?: number; maxPages?: number };
} = {
  users: Number.MAX_SAFE_INTEGER,
  links: null,
  documents: null,
  domains: 1000,
  datarooms: 1000,
  customDomainOnPro: true,
  customDomainInDataroom: true,
  advancedLinkControlsOnPro: true,
  watermarkOnBusiness: true,
  agreementOnBusiness: true,
  conversationsInDataroom: true,
  fileSizeLimits: {},
};

export const FREE_PLAN_LIMITS = UNLIMITED;
export const PRO_PLAN_LIMITS = UNLIMITED;
export const BUSINESS_PLAN_LIMITS = UNLIMITED;
export const DATAROOMS_PLAN_LIMITS = UNLIMITED;
export const DATAROOMS_PLUS_PLAN_LIMITS = UNLIMITED;
export const DATAROOMS_PREMIUM_PLAN_LIMITS = UNLIMITED;

export const PAUSED_PLAN_LIMITS = {
  // No paywall pause state — every action remains permitted.
  canCreateLinks: true,
  canReceiveViews: true,
  canCreateDocuments: true,
  canCreateDatarooms: true,
  canViewAnalytics: true,
  canAccessExistingContent: true,
};
