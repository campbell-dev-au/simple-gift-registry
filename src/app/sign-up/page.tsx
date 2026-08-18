"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/button";
import { IconGoogle } from "@/components/icons";
import { inputClass, labelClass } from "@/components/field";
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@/lib/field-limits";

const EMAIL_CODE_MAX_LENGTH = 10;

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only allow same-origin relative paths — see the sign-in page for why.
  const rawRedirect = searchParams.get("redirect_url");
  const redirectUrl =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const finalize = async () => {
    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        const url = decorateUrl(session?.currentTask ? "/sign-up" : redirectUrl);
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { error } = await signUp.password({
      emailAddress: email,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    if (error) return;

    // The verify form can render as soon as signUp.status flips to
    // missing_requirements, which may happen before sendEmailCode() below
    // resolves — emailCodeSent gates the Verify button so a submission can't
    // race ahead of the code actually being sent (see sign-in page for the
    // same issue observed directly: "verification_not_sent").
    await signUp.verifications.sendEmailCode();
    setEmailCodeSent(true);
  };

  const handleGoogleSignUp = async () => {
    await signUp.sso({
      strategy: "oauth_google",
      redirectUrl,
      redirectCallbackUrl: "/sso-callback",
    });
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await finalize();
    }
  };

  const handleStartOver = async () => {
    // signUp persists across visits (Clerk client cookie), so without this
    // a stale in-progress attempt keeps reopening the verify screen for the
    // original email with no way back to a blank "Create an account" form.
    await signUp.reset();
    setCode("");
    setEmailCodeSent(false);
  };

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <h1 className="font-display text-2xl font-bold text-ink">
          Verify your account
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
              maxLength={EMAIL_CODE_MAX_LENGTH}
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
            disabled={fetchStatus === "fetching" || !emailCodeSent}
          >
            Verify
          </Button>
          <button
            type="button"
            onClick={handleStartOver}
            className="text-sm text-ink-dim underline underline-offset-2 hover:text-ink"
          >
            Use a different email
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-display text-2xl font-bold text-ink">
        Create an account
      </h1>
      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleGoogleSignUp}
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
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="firstName" className={labelClass}>
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              maxLength={NAME_MAX_LENGTH}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={inputClass}
            />
            {errors?.fields.firstName && (
              <p className="text-sm text-coral">
                {errors.fields.firstName.message}
              </p>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="lastName" className={labelClass}>
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              maxLength={NAME_MAX_LENGTH}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={inputClass}
            />
            {errors?.fields.lastName && (
              <p className="text-sm text-coral">
                {errors.fields.lastName.message}
              </p>
            )}
          </div>
        </div>

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
          {errors?.fields.emailAddress && (
            <p className="text-sm text-coral">
              {errors.fields.emailAddress.message}
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
      {/* Required for sign-up flows — Clerk's bot sign-up protection is enabled by default */}
      <div id="clerk-captcha" />
    </main>
  );
}
