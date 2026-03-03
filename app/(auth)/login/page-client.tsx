"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { LogoCloud } from "@/components/shared/logo-cloud";

export default function Login() {
  const { next } = useParams as { next?: string };

  return (
    <div className="flex h-screen w-full flex-wrap">
      {/* Left part */}
      <div className="flex w-full justify-center bg-gray-50 md:w-1/2 lg:w-1/2">
        <div
          className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          aria-hidden="true"
        ></div>
        <div className="z-10 mx-5 mt-[calc(1vh)] h-fit w-full max-w-md overflow-hidden rounded-lg sm:mx-0 sm:mt-[calc(2vh)] md:mt-[calc(3vh)]">
          <div className="items-left flex flex-col space-y-3 px-4 py-6 pt-8 sm:px-12">
            <Link href="https://dataroom.hanzo.ai" target="_blank">
              <img
                src="/_static/papermark-logo.svg"
                alt="Hanzo Dataroom Logo"
                className="md:mb-48s -mt-8 mb-36 h-7 w-auto self-start sm:mb-32"
              />
            </Link>
            <Link href="/">
              <span className="text-balance text-3xl font-semibold text-gray-900">
                Welcome to Hanzo Dataroom
              </span>
            </Link>
            <h3 className="text-balance text-sm text-gray-800">
              Share documents. Not attachments.
            </h3>
          </div>
          <div className="flex flex-col gap-4 px-4 pt-8 sm:px-12">
            <Button
              onClick={() => {
                signIn("hanzo-iam", {
                  ...(next && next.length > 0 ? { callbackUrl: next } : {}),
                });
              }}
              className="flex w-full items-center justify-center space-x-2 border border-red-500 bg-red-500 font-normal text-white hover:bg-red-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 67 67" fill="currentColor">
                <path d="M22.21 67V44.6369H0V67H22.21Z" />
                <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" />
                <path d="M22.21 0H0V22.3184H22.21V0Z" />
                <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" />
                <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" />
              </svg>
              <span>Sign in with Hanzo</span>
            </Button>
          </div>
          <p className="mt-10 w-full max-w-md px-4 text-xs text-muted-foreground sm:px-12">
            By clicking continue, you acknowledge that you have read and agree
            to Hanzo Dataroom&apos;s{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_MARKETING_URL}/terms`}
              target="_blank"
              className="underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_MARKETING_URL}/privacy`}
              target="_blank"
              className="underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
      <div className="relative hidden w-full justify-center overflow-hidden bg-black md:flex md:w-1/2 lg:w-1/2">
        <div className="relative m-0 flex h-full min-h-[700px] w-full p-0">
          <div
            className="relative flex h-full w-full flex-col justify-between"
            id="features"
          >
            {/* Testimonial top 2/3 */}
            <div
              className="flex w-full flex-col items-center justify-center"
              style={{ height: "66.6666%" }}
            >
              {/* Image container */}
              <div className="mb-4 h-64 w-80">
                <img
                  className="h-full w-full rounded-2xl object-cover shadow-2xl"
                  src="/_static/testimonials/backtrace.jpeg"
                  alt="Backtrace Capital"
                />
              </div>
              {/* Text content */}
              <div className="max-w-xl text-center">
                <blockquote className="text-balance font-normal leading-8 text-white sm:text-xl sm:leading-9">
                  <p>
                    &quot;We raised our &euro;30M Fund with Hanzo Dataroom Data Rooms.
                    Love the customization, security and ease of use.&quot;
                  </p>
                </blockquote>
                <figcaption className="mt-4">
                  <div className="text-balance font-normal text-white">
                    Michael M&uuml;nnix
                  </div>
                  <div className="text-balance font-light text-gray-400">
                    Partner, Backtrace Capital
                  </div>
                </figcaption>
              </div>
            </div>
            {/* White block with logos bottom 1/3, full width/height */}
            <div
              className="absolute bottom-0 left-0 flex w-full flex-col items-center justify-center bg-white"
              style={{ height: "33.3333%" }}
            >
              <div className="mb-4 max-w-xl text-balance text-center font-semibold text-gray-900">
                Trusted by teams at
              </div>
              <LogoCloud />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
