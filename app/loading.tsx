import { Skel } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Skel className="h-8 w-40" />
          <Skel className="h-3 w-56" />
        </div>
        <Skel className="h-8 w-28" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <Skel className="h-4 w-2/3" />
              <Skel className="h-3 w-12" />
            </div>
            <Skel className="h-3 w-full" />
            <Skel className="h-3 w-4/5" />
            <div className="pt-3 border-t border-border flex justify-between">
              <Skel className="h-3 w-16" />
              <Skel className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
