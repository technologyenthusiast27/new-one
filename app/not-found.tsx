import Link from "next/link";
import { AmbientGlow } from "@/components/ui/AmbientGlow";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-6 text-center">
      <AmbientGlow />
      <div>
        <p className="section-eyebrow justify-center">Lost the thread</p>
        <h1 className="mt-4 font-display text-7xl font-semibold text-gradient-violet">404</h1>
        <p className="mx-auto mt-4 max-w-sm text-neutral-400">
          This page floated away. The ticket or page you&apos;re looking for
          doesn&apos;t exist.
        </p>
        <Link href="/" className="btn-primary mt-8">
          Back to NovaLabs
        </Link>
      </div>
    </main>
  );
}
