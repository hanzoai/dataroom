"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { HanzoMark } from "@/components/shared/icons/hanzo-mark";

// White-label hooks: every visible brand token comes from env so tenants
// drop in their own name/words/IAM provider without touching this file.
//
//   NEXT_PUBLIC_APP_NAME           e.g. "Hanzo Dataroom" | "Acme Rooms"
//   NEXT_PUBLIC_APP_NAME_PRIMARY   first word of wordmark; defaults to first
//                                  word of NEXT_PUBLIC_APP_NAME ("Hanzo")
//   NEXT_PUBLIC_APP_NAME_SUFFIX    second token of wordmark; defaults to
//                                  remainder of NEXT_PUBLIC_APP_NAME ("Dataroom")
//   NEXT_PUBLIC_APP_TAGLINE        one-line under the welcome headline
//   NEXT_PUBLIC_IAM_PROVIDER_NAME  IAM brand for the "Sign in with X" button
//   NEXT_PUBLIC_MARKETING_URL      base URL the Terms / Privacy links resolve against

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Hanzo Dataroom";
const [defaultPrimary, ...defaultSuffixParts] = APP_NAME.split(" ");
const APP_NAME_PRIMARY =
  process.env.NEXT_PUBLIC_APP_NAME_PRIMARY || defaultPrimary || APP_NAME;
const APP_NAME_SUFFIX =
  process.env.NEXT_PUBLIC_APP_NAME_SUFFIX || defaultSuffixParts.join(" ");
const APP_TAGLINE =
  process.env.NEXT_PUBLIC_APP_TAGLINE || "Share documents. Not attachments.";
const IAM_PROVIDER_NAME =
  process.env.NEXT_PUBLIC_IAM_PROVIDER_NAME || "Hanzo";
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL || "";

export default function Login() {
  const { next } = useParams as { next?: string };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-12 flex items-center gap-3">
          <HanzoMark size={28} className="text-white" />
          <span className="text-base font-medium tracking-tight">
            {APP_NAME_PRIMARY}
            {APP_NAME_SUFFIX && (
              <span className="text-zinc-400"> {APP_NAME_SUFFIX}</span>
            )}
          </span>
        </Link>

        <h1 className="text-balance text-3xl font-semibold text-white">
          Welcome to {APP_NAME}
        </h1>
        <p className="mt-2 text-balance text-sm text-zinc-400">{APP_TAGLINE}</p>

        <Button
          onClick={() =>
            signIn("hanzo-iam", {
              ...(next && next.length > 0 ? { callbackUrl: next } : {}),
            })
          }
          className="mt-8 flex w-full items-center justify-center bg-white font-normal text-black hover:bg-zinc-200"
        >
          <span>
            Sign in with <span className="font-bold">{IAM_PROVIDER_NAME}</span>
          </span>
        </Button>

        <p className="mt-8 text-xs text-zinc-500">
          By clicking continue, you acknowledge that you have read and agree to{" "}
          {APP_NAME}&apos;s{" "}
          <a
            href={`${MARKETING_URL}/terms`}
            target="_blank"
            className="text-zinc-300 underline hover:text-white"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href={`${MARKETING_URL}/privacy`}
            target="_blank"
            className="text-zinc-300 underline hover:text-white"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}
