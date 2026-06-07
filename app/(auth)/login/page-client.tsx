"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || "Hanzo Dataroom";
const IAM_PROVIDER_NAME =
  process.env.NEXT_PUBLIC_IAM_PROVIDER_NAME || "Hanzo";
const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL || "";

export default function Login() {
  const { next } = useParams as { next?: string };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-12 block">
          <img
            src="/_static/hanzo-dataroom-logo-light.svg"
            alt={`${APP_NAME} Logo`}
            className="h-7 w-auto"
          />
        </Link>

        <h1 className="text-balance text-3xl font-semibold text-white">
          Welcome to {APP_NAME}
        </h1>
        <p className="mt-2 text-balance text-sm text-zinc-400">
          Share documents. Not attachments.
        </p>

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
