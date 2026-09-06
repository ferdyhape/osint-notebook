import { Skel } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Skel className="h-3 w-20" />
          <Skel className="h-8 w-56" />
        </div>
        <div className="flex gap-2">
          <Skel className="h-8 w-20" />
          <Skel className="h-8 w-20" />
          <Skel className="h-8 w-20" />
        </div>
      </div>

      <div className="space-y-3">
        <Skel className="h-5 w-32" />
        <div className="card p-4 space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skel className="h-4 w-16 rounded-full" />
              <Skel className="h-4 flex-1 max-w-xs" />
              <Skel className="h-4 w-24" />
              <Skel className="h-3 w-14 ml-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Skel className="h-5 w-24" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card p-3.5 space-y-2">
              <Skel className="h-3 w-full" />
              <Skel className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
