import { Skel } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <Skel className="h-8 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skel className="h-5 w-24" />
            <div className="card p-4 space-y-3">
              <Skel className="h-3 w-16" />
              <Skel className="h-8 w-full" />
              <Skel className="h-3 w-16" />
              <Skel className="h-8 w-full" />
              <Skel className="h-8 w-24 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
