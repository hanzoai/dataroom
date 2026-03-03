import { Metadata } from "next";
import { Suspense } from "react";

import { APP_NAME, APP_URL } from "@/lib/branding";
import { GTMComponent } from "@/components/gtm-component";

import LoginClient from "./page-client";

const data = {
  description: `Login to ${APP_NAME}`,
  title: `Login | ${APP_NAME}`,
  url: "/login",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: APP_NAME,
    images: [
      {
        url: "/_static/meta-image.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: data.title,
    description: data.description,
    creator: "@hanzoai",
    images: ["/_static/meta-image.png"],
  },
};

export default function LoginPage() {
  return (
    <>
      <GTMComponent />
      <Suspense>
        <LoginClient />
      </Suspense>
    </>
  );
}
