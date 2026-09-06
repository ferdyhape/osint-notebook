import { Skel } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <Skel className="h-3 w-20" />
          <Skel className="h-8 w-56" />
        </div>
        <Skel className="h-8 w-32" />
      </div>
      <div className="board-grid-bg h-[70vh] card overflow-hidden relative">
        <Skel className="absolute top-[18%] left-[10%] h-24 w-56 opacity-70" />
        <Skel className="absolute top-[48%] left-[38%] h-24 w-56 opacity-70" />
        <Skel className="absolute top-[22%] left-[62%] h-24 w-56 opacity-70" />
        <Skel className="absolute top-[62%] left-[70%] h-24 w-56 opacity-70" />
      </div>
    </div>
  );
}
