import { Skel } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <Skel className="h-10 w-10 rounded-lg" />
          <Skel className="h-7 w-48" />
          <Skel className="h-3 w-40" />
        </div>
        <div className="card p-4 space-y-3">
          <Skel className="h-9 w-full" />
          <Skel className="h-9 w-full" />
          <Skel className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
