"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useSignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only allow same-origin relative paths — a bare redirect_url query param
  // is attacker-controlled, and "//evil.com" is browser-parsed as an
  // external absolute URL despite not starting with "http".
  const rawRedirect = searchParams.get("redirect_url");
  const redirectUrl =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [deviceCodeSent, setDeviceCodeSent] = useState(false);
  const codeSentRef = useRef(false);
  const finalizedRef = useRef(false);

  const needsDeviceVerification = signIn.status === "needs_client_trust";

  // signIn.status only reflects the latest server response once this
  // component re-renders — checking it synchronously right after an
  // `await signIn.password()` inside a handler reads a stale value. Driving
  // side effects off the rendered status via useEffect is reliable instead.
  //
  // The verify form becomes interactable as soon as needsDeviceVerification
  // flips true, which is *before* sendEmailCode() has actually completed —
  // submitting the code that early gets rejected with "verification_not_sent".
  // deviceCodeSent gates the Verify button until the send has resolved.
  useEffect(() => {
    if (needsDeviceVerification && !codeSentRef.current) {
      codeSentRef.current = true;
      signIn.mfa.sendEmailCode().then(() => setDeviceCodeSent(true));
    }
  }, [needsDeviceVerification, signIn]);

  useEffect(() => {
    // signIn is mutated in place, not replaced, so depending on the object
    // itself would never re-trigger this effect — track the primitive
    // `status` value instead, which does change between renders.
    if (signIn.status === "complete" && !finalizedRef.current) {
      finalizedRef.current = true;
      signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          const url = decorateUrl(session?.currentTask ? "/sign-in" : redirectUrl);
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
    }
  }, [signIn, signIn.status, router, redirectUrl]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await signIn.password({ identifier: email, password });
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await signIn.mfa.verifyEmailCode({ code });
  };

  if (signIn.status === "complete" || isSignedIn) {
    return null;
  }

  // A new device/browser has no trust history with Clerk, so a fresh sign-in
  // needs a one-time email code even though MFA isn't otherwise enabled.
  if (needsDeviceVerification) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-semibold">Verify this device</h1>
        <form
          onSubmit={handleVerify}
          className="flex w-full max-w-xs flex-col gap-3"
        >
          <label htmlFor="code" className="text-sm font-medium">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="rounded border px-3 py-2"
          />
          {errors?.fields.code && (
            <p className="text-sm text-red-600">{errors.fields.code.message}</p>
          )}
          <button
            type="submit"
            disabled={fetchStatus === "fetching" || !deviceCodeSent}
            className="rounded bg-black py-2 text-white"
          >
            Verify
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xs flex-col gap-3"
      >
        <label htmlFor="email" className="text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded border px-3 py-2"
        />
        {errors?.fields.identifier && (
          <p className="text-sm text-red-600">
            {errors.fields.identifier.message}
          </p>
        )}

        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded border px-3 py-2"
        />
        {errors?.fields.password && (
          <p className="text-sm text-red-600">{errors.fields.password.message}</p>
        )}

        <button
          type="submit"
          disabled={fetchStatus === "fetching"}
          className="rounded bg-black py-2 text-white"
        >
          Continue
        </button>
      </form>
      {errors?.global && errors.global.length > 0 && (
        <p className="text-sm text-red-600">
          {errors.global[0]?.message ?? "Something went wrong."}
        </p>
      )}
    </main>
  );
}
