import { NextApiRequest, NextApiResponse } from "next";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { type NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";


const IAM_URL = process.env.IAM_URL;
const IAM_CLIENT_ID = process.env.IAM_CLIENT_ID;
const IAM_CLIENT_SECRET = process.env.IAM_CLIENT_SECRET;

function HanzoIAMProvider(): OAuthConfig<any> {
  const issuer = IAM_URL || "https://hanzo.id";
  return {
    id: "hanzo-iam",
    name: process.env.IAM_PROVIDER_NAME || "Hanzo",
    type: "oauth",
    wellKnown: `${issuer}/.well-known/openid-configuration`,
    clientId: IAM_CLIENT_ID || "",
    clientSecret: IAM_CLIENT_SECRET || "",
    authorization: { params: { scope: "openid profile email" } },
    // IAM is an OIDC provider and the `openid` scope above makes its token
    // response carry an id_token. openid-client refuses to read such a response
    // through the plain OAuth2 path — "id_token detected in the response, you
    // must use client.callback() instead of client.oauthCallback()" — so this
    // flag is what picks the reader, and false could never complete a sign-in
    // here. With it true the claims below come from the verified id_token
    // (signature, iss, aud, nonce all checked) and userinfo is not fetched.
    idToken: true,
    profile(profile) {
      return {
        id: profile.sub,
        name:
          profile.displayName ||
          profile.name ||
          profile.preferred_username,
        email: profile.email,
        image: profile.avatar || profile.picture,
        // The org claim rides the TOKEN, never the user row. next-auth hands
        // whatever profile() returns straight to prisma.user.create, and the
        // User model has no `organization` column — so returning it made every
        // first sign-in fail with PrismaClientValidationError, surfacing as
        // ?error=OAuthCreateAccount. The jwt callback below already lifts the
        // claim out of `profile` into the token, which is where the session
        // reads it from, so nothing downstream loses the organization.
      };
    },
    allowDangerousEmailAccountLinking: true,
  };
}

export const authOptions: NextAuthOptions = {
  pages: {
    error: "/login",
  },
  providers: [HanzoIAMProvider()],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // No cookie override. The name carries a `__Secure-` prefix over https, and
  // NextAuth derives that from NEXTAUTH_URL in BOTH directions — here when it
  // writes the cookie, and in `getToken` when the middleware reads it.
  //
  // Naming it here broke that agreement. The name was keyed to VERCEL_URL, which
  // is unset off Vercel, so this wrote the bare `next-auth.session-token` while
  // the middleware went on looking for `__Secure-next-auth.session-token` under
  // an https NEXTAUTH_URL. Signing in worked perfectly — a real session, a real
  // cookie, `/api/auth/session` returning the user — and every guarded route
  // still bounced to /login, which is indistinguishable from a rejected password.
  callbacks: {
    jwt: async (params) => {
      const { token, user, trigger, profile } = params;
      if (!token.email) {
        return {};
      }
      if (user) {
        token.user = user;
        // Persist IAM organization claim from initial sign-in. Read from the
        // PROFILE — the user row never carries it (see profile() above).
        const org = (profile as any)?.owner || (profile as any)?.organization || (profile as any)?.org
        if (org) {
          token.organization = org;
        }
      }
      // refresh the user data
      if (trigger === "update") {
        const user = token?.user as CustomUser;
        const refreshedUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        if (refreshedUser) {
          token.user = refreshedUser;
        } else {
          return {};
        }

        if (refreshedUser?.email !== user.email) {
          if (user.id && refreshedUser.email) {
            await prisma.account.deleteMany({
              where: { userId: user.id },
            });
          }
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      (session.user as CustomUser) = {
        id: token.sub,
        // @ts-ignore
        ...(token || session).user,
        organization: token.organization as string | undefined,
      };
      return session;
    },
  },
  events: {
    async createUser(message) {
      await identifyUser(message.user.email ?? message.user.id);
      await trackAnalytics({
        event: "User Signed Up",
        email: message.user.email,
        userId: message.user.id,
      });
    },
  },
};

const getAuthOptions = (req: NextApiRequest): NextAuthOptions => {
  return {
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      signIn: async ({ user }) => {
        if (!user.email) {
          return false;
        }
        return true;
      },
    },
    events: {
      ...authOptions.events,
      signIn: async (message) => {
        await Promise.allSettled([
          identifyUser(message.user.email ?? message.user.id),
          trackAnalytics({
            event: "User Signed In",
            email: message.user.email,
          }),
        ]);
      },
    },
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return NextAuth(req, res, getAuthOptions(req));
}
