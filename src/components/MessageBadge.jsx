export default function MessageBadge({ count }) {
  if (!count) return null
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30">
      💬 {count}
    </span>
  )
}
