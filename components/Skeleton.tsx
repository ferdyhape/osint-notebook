/** A single pulsing placeholder bar/block — the building piece every
 *  route's `loading.tsx` composes into a rough outline of its real layout,
 *  so navigating never looks abruptly blank or stuck mid-request. */
export function Skel({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-subtle ${className}`} />;
}
