"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { inputClass } from "@/components/field";

// The share URL with a one-click copy — copying this link is the main thing
// an owner does on the registry page, so it shouldn't require manually
// selecting text in a truncated input.
export function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (e.g. insecure context); the
      // selected text below still lets the user copy manually.
    }
  }

  return (
    <div className="flex gap-2">
      <label htmlFor="share-link" className="sr-only">
        Share link
      </label>
      <input
        id="share-link"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className={`${inputClass} font-mono text-xs`}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-live="polite"
        className="shrink-0"
      >
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
