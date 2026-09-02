"use client";

import { usePathname } from "next/navigation";

export default function BrandMark() {
  const pathname = usePathname();
  if (pathname?.startsWith("/auth")) return null;

  return (
    <div className="hidden md:block fixed top-4 right-4 z-40 h-11 w-11 rounded-full overflow-hidden shadow-md ring-1 ring-border pointer-events-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.jpg"
        alt="SEL"
        width={44}
        height={44}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
