import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SignOutButton } from "@/app/sign-out-button";
import { AccountForm } from "@/components/account-form";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/account");

  return (
    <main className="mx-auto flex w-full max-w-xs flex-1 flex-col gap-6 px-6 py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Account" }]}
      />

      <h1 className="font-display text-2xl font-bold text-ink">Account</h1>

      <AccountForm />

      <div className="border-t border-line pt-4">
        <SignOutButton />
      </div>
    </main>
  );
}
