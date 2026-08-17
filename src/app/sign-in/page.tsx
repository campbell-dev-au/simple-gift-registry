"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/button";
import { IconGoogle } from "@/components/icons";
import { inputClass, labelClass } from "@/components/field";
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/field-limits";

const MFA_CODE_MAX_LENGTH = 10;
const RESET_CODE_MAX_LENGTH = 10;

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

  const [view, setView] = useState<"sign-in" | "forgot-password">("sign-in");
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetCodeSent, setResetCodeSent] = useState(false);

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

  // signIn.create() (called when requesting a reset code) leaves the
  // attempt pending a "reset_password_email_code" first factor until it's
  // completed. Without resetting here, backing out and trying Google or a
  // normal password sign-in silently no-ops — Clerk won't switch strategies
  // on an attempt that already has one in flight.
  const handleBackToSignIn = () => {
    signIn.reset();
    setView("sign-in");
  };

  const handleGoogleSignIn = async () => {
    await signIn.sso({
      strategy: "oauth_google",
      redirectUrl,
      redirectCallbackUrl: "/sso-callback",
    });
  };

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { error } = await signIn.create({ identifier: resetEmail });
    if (error) return;

    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) return;

    setResetCodeSent(true);
    setResetStep("verify");
  };

  // On success signIn.status flips to "complete" and the finalize effect
  // above takes over, same as the password and device-verification flows.
  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({
      code: resetCode,
    });
    if (error) return;

    await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
    });
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

  if (view === "forgot-password") {
    if (resetStep === "request") {
      return (
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <h1 className="font-display text-2xl font-bold text-ink">
            Reset your password
          </h1>
          <form
            onSubmit={handleRequestReset}
            className="flex w-full max-w-xs flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="resetEmail" className={labelClass}>
                Email address
              </label>
              <input
                id="resetEmail"
                name="resetEmail"
                type="email"
                maxLength={EMAIL_MAX_LENGTH}
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                className={inputClass}
              />
              {errors?.fields.identifier && (
                <p className="text-sm text-coral">
                  {errors.fields.identifier.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={fetchStatus === "fetching"}>
              Send reset code
            </Button>
          </form>
          {errors?.global && errors.global.length > 0 && (
            <p className="text-sm text-coral">
              {errors.global[0]?.message ?? "Something went wrong."}
            </p>
          )}
          <Button
            type="button"
            variant="text"
            onClick={handleBackToSignIn}
          >
            Back to sign in
          </Button>
        </main>
      );
    }

    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <h1 className="font-display text-2xl font-bold text-ink">
          Check your email
        </h1>
        <form
          onSubmit={handleResetPassword}
          className="flex w-full max-w-xs flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="resetCode" className={labelClass}>
              Verification code
            </label>
            <input
              id="resetCode"
              name="resetCode"
              type="text"
              maxLength={RESET_CODE_MAX_LENGTH}
              value={resetCode}
              onChange={(event) => setResetCode(event.target.value)}
              className={inputClass}
            />
            {errors?.fields.code && (
              <p className="text-sm text-coral">
                {errors.fields.code.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="newPassword" className={labelClass}>
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              maxLength={PASSWORD_MAX_LENGTH}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={inputClass}
            />
            {errors?.fields.password && (
              <p className="text-sm text-coral">
                {errors.fields.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={fetchStatus === "fetching" || !resetCodeSent}
          >
            Reset password
          </Button>
        </form>
        {errors?.global && errors.global.length > 0 && (
          <p className="text-sm text-coral">
            {errors.global[0]?.message ?? "Something went wrong."}
          </p>
        )}
        <Button
          type="button"
          variant="text"
          onClick={() => setView("sign-in")}
        >
          Back to sign in
        </Button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-display text-2xl font-bold text-ink">Sign in</h1>
      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleGoogleSignIn}
          disabled={fetchStatus === "fetching"}
          className="w-full gap-2"
        >
          <IconGoogle className="h-4 w-4" />
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs font-medium uppercase tracking-wide text-ink-dim">
            or
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>
      </div>
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
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="text"
          onClick={() => {
            setResetEmail(email);
            setResetStep("request");
            setResetCodeSent(false);
            setView("forgot-password");
          }}
        >
          Forgot password?
        </Button>
        <Link
          href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
          className="text-sm font-semibold text-violet hover:underline underline-offset-2"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
