"use client";

import { useEffect } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

export function ViewTracker() {
  useEffect(() => {
    const key = "open-link-hub-view";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "view" }),
      keepalive: true,
    });
  }, []);
  return null;
}

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  targetId: string;
  children: ReactNode;
};

export function TrackedLink({ targetId, children, onClick, ...props }: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        void fetch("/api/analytics/event", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ eventType: "click", targetId }),
          keepalive: true,
        });
      }}
    >
      {children}
    </a>
  );
}
