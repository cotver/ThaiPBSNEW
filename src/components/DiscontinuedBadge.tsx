export function DiscontinuedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[4px] border border-red-200/45 bg-red-500/82 px-2 py-1 text-[10px] font-black uppercase leading-none text-white shadow-lg shadow-black/30 ${className}`}
    >
      Discontinued
    </span>
  );
}
