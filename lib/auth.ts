/** Minimal shared-passcode gate for the admin dashboard. */
export function adminPasscode(): string {
  return process.env.ADMIN_PASSCODE || "wolves";
}

export function isAuthorized(req: Request): boolean {
  const provided =
    req.headers.get("x-admin-passcode") ||
    new URL(req.url).searchParams.get("passcode") ||
    "";
  return provided === adminPasscode();
}
