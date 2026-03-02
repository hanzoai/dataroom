import { Metadata } from "next";
import { Suspense } from "react";

import SAMLCallbackClient from "./page-client";

export const metadata: Metadata = {
  title: "SSO Login | Hanzo Dataroom",
  description: "Completing SSO login",
};

export default function SAMLCallbackPage() {
  return (
    <Suspense>
      <SAMLCallbackClient />
    </Suspense>
  );
}
