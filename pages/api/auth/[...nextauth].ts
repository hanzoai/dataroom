import { NextApiRequest, NextApiResponse } from "next";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { type NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

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
    idToken: false,
    userinfo: { url: `${issuer}/oauth/userinfo` },
    profile(profile) {
      return {
        id: profile.sub,
        name:
          profile.displayName ||
          profile.name ||
          profile.preferred_username,
        email: profile.email,
        image: profile.avatar || profile.picture,
        organization: profile.owner || profile.organization || profile.org,
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
  cookies: {
    sessionToken: {
      name: `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: VERCEL_DEPLOYMENT ? ".dataroom.hanzo.ai" : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  callbacks: {
    jwt: async (params) => {
      const { token, user, trigger } = params;
      if (!token.email) {
        return {};
      }
      if (user) {
        token.user = user;
        // Persist IAM organization claim from initial sign-in
        if ((user as any).organization) {
          token.organization = (user as any).organization;
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
