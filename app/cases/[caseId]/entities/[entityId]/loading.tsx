import { Skel } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Skel className="h-3 w-24" />
          <Skel className="h-6 w-72" />
        </div>
        <Skel className="h-8 w-20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Skel className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-3.5 space-y-2">
              <Skel className="h-3 w-1/2" />
              <Skel className="h-3 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-8">
          <div className="space-y-3">
            <Skel className="h-5 w-36" />
            <div className="card border-dashed p-8">
              <Skel className="h-3 w-40 mx-auto" />
            </div>
          </div>
          <div className="space-y-3">
            <Skel className="h-5 w-20" />
            <div className="card p-3.5 space-y-2">
              <Skel className="h-3 w-full" />
              <Skel className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
