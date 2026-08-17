"use client";

import { Suspense } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Google (and any future SSO strategy) redirects back here once the user
// authorizes on the provider's side. This component completes the sign-in
// or sign-up that signIn.sso()/signUp.sso() started and activates the
// resulting session.
export default function SSOCallbackPage() {
  return (
    <Suspense>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      />
    </Suspense>
  );
}
