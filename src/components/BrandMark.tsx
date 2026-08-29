"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

export default function BrandMark() {
  const pathname = usePathname();
  if (pathname?.startsWith("/auth")) return null;

  return (
    <div className="hidden md:block fixed top-4 right-4 z-40 h-11 w-11 rounded-full overflow-hidden shadow-md ring-1 ring-border">
      <Image
        src="/logo-light.png"
        alt="SEL"
        width={44}
        height={44}
        className="h-full w-full object-cover"
        priority
      />
    </div>
  );
}
