import { Metadata } from "next";

import EmailVerificationClient from "./page-client";

const data = {
  description: "Verify your login to Hanzo Dataroom",
  title: "Verify Login | Hanzo Dataroom",
  url: "/auth/email",
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

export default async function EmailVerificationPage() {
  return <EmailVerificationClient />;
}
