import { Skel } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Skel className="h-8 w-56" />
          <Skel className="h-3 w-40" />
        </div>
        <Skel className="h-8 w-32" />
      </div>
      <div className="board-grid-bg h-[70vh] card overflow-hidden relative">
        <Skel className="absolute top-[20%] left-[12%] h-24 w-56 opacity-70" />
        <Skel className="absolute top-[50%] left-[40%] h-24 w-56 opacity-70" />
        <Skel className="absolute top-[24%] left-[64%] h-24 w-56 opacity-70" />
      </div>
    </div>
  );
}
