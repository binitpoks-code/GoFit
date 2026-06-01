export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-[#1e2231] rounded-lg w-48" />
      <div className="h-4 bg-[#1e2231] rounded w-96 max-w-full" />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="h-48 bg-[#1e2231] rounded-xl" />
        <div className="h-48 bg-[#1e2231] rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-32 bg-[#1e2231] rounded-xl" />
        <div className="h-32 bg-[#1e2231] rounded-xl" />
        <div className="h-32 bg-[#1e2231] rounded-xl" />
      </div>
    </div>
  )
}
