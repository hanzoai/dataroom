import { tenant } from "@teamhanko/passkeys-next-auth-provider";

let _hanko: ReturnType<typeof tenant> | null = null;

function getHanko(): ReturnType<typeof tenant> | null {
  if (!_hanko) {
    if (!process.env.HANKO_API_KEY || !process.env.NEXT_PUBLIC_HANKO_TENANT_ID) {
      return null;
    }
    _hanko = tenant({
      apiKey: process.env.HANKO_API_KEY,
      tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID,
    });
  }
  return _hanko;
}

export default getHanko;
