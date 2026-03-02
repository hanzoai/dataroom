import { Metadata } from "next";
import { Suspense } from "react";

import { GTMComponent } from "@/components/gtm-component";

import LoginClient from "./page-client";

const data = {
  description: "Login to Hanzo Dataroom",
  title: "Login | Hanzo Dataroom",
  url: "/login",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dataroom.hanzo.ai"),
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: "Hanzo Dataroom",
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
