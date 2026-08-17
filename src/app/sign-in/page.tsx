"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/button";
import { inputClass, labelClass } from "@/components/field";
import { EMAIL_MAX_LENGTH } from "@/lib/field-limits";

const PASSWORD_MAX_LENGTH = 128;
const MFA_CODE_MAX_LENGTH = 10;

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
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <h1 className="font-display text-2xl font-bold text-ink">
          Verify this device
        </h1>
        <form
          onSubmit={handleVerify}
          className="flex w-full max-w-xs flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className={labelClass}>
              Verification code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              maxLength={MFA_CODE_MAX_LENGTH}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={inputClass}
            />
            {errors?.fields.code && (
              <p className="text-sm text-coral">
                {errors.fields.code.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={fetchStatus === "fetching" || !deviceCodeSent}
          >
            Verify
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-display text-2xl font-bold text-ink">Sign in</h1>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xs flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={EMAIL_MAX_LENGTH}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
          {errors?.fields.identifier && (
            <p className="text-sm text-coral">
              {errors.fields.identifier.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            maxLength={PASSWORD_MAX_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
          {errors?.fields.password && (
            <p className="text-sm text-coral">
              {errors.fields.password.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={fetchStatus === "fetching"}>
          Continue
        </Button>
      </form>
      {errors?.global && errors.global.length > 0 && (
        <p className="text-sm text-coral">
          {errors.global[0]?.message ?? "Something went wrong."}
        </p>
      )}
    </main>
  );
}
