"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { error } = await signUp.password({
      emailAddress: email,
      password,
    });
    if (error) return;

    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          const url = decorateUrl(session?.currentTask ? "/sign-up" : "/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
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
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-semibold">Verify your account</h1>
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
            disabled={fetchStatus === "fetching"}
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
      <h1 className="text-2xl font-semibold">Create an account</h1>
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
        {errors?.fields.emailAddress && (
          <p className="text-sm text-red-600">
            {errors.fields.emailAddress.message}
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
      {/* Required for sign-up flows — Clerk's bot sign-up protection is enabled by default */}
      <div id="clerk-captcha" />
    </main>
  );
}
