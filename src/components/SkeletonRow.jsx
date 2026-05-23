export default function SkeletonRow() {
  return (
    <div className="px-4 py-3 border-b border-stone-200">
      <div className="animate-pulse flex gap-3">
        <div className="h-4 bg-stone-200 rounded w-24" />
        <div className="h-4 bg-stone-200 rounded w-32 flex-1" />
        <div className="h-4 bg-stone-200 rounded w-20" />
      </div>
    </div>
  )
}
