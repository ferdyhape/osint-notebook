import { Skel } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Skel className="h-8 w-40" />
          <Skel className="h-3 w-64" />
        </div>
        <Skel className="h-8 w-24" />
      </div>

      {Array.from({ length: 2 }).map((_, group) => (
        <div key={group} className="space-y-2">
          <Skel className="h-4 w-16 rounded-full" />
          <div className="card divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3.5 space-y-2">
                <Skel className="h-3 w-1/3" />
                <Skel className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
