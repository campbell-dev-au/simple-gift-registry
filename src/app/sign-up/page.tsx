"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/button";
import { inputClass, labelClass } from "@/components/field";

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

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await finalize();
    }
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
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-display text-2xl font-bold text-ink">
        Create an account
      </h1>
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
      {/* Required for sign-up flows — Clerk's bot sign-up protection is enabled by default */}
      <div id="clerk-captcha" />
    </main>
  );
}
