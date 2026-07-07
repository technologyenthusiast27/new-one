/**
 * Decorative soft purple ambient glows. Purely presentational, rendered
 * behind content. Kept lightweight (blurred gradients, GPU-friendly).
 */
export function AmbientGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-40 left-1/4 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-violet-deep/25 blur-[130px] animate-pulse-glow" />
      <div className="absolute top-1/3 -right-24 h-[30rem] w-[30rem] rounded-full bg-violet-glow/20 blur-[120px] animate-float" />
      <div className="absolute bottom-0 left-0 h-[26rem] w-[26rem] rounded-full bg-violet-soft/10 blur-[110px]" />
    </div>
  );
}
