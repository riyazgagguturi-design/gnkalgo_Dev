import Link from "next/link";

type LogoProps = {
  href?: string;
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

export function Logo({ href = "/", size = 40, showWordmark = true, className = "" }: LogoProps) {
  const mark = (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img src="/logo.svg" alt="GNK ALGO" width={size} height={size} className="shrink-0" />
      {showWordmark && (
        <span className="leading-tight">
          <span className="block text-lg font-semibold tracking-wide text-white">
            GNK <span className="bg-gradient-to-b from-[#2ee6a6] to-[#3aa0ff] bg-clip-text text-transparent">ALGO</span>
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-400 sm:block">
            Intelligence behind every trade
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="inline-flex shrink-0">
      {mark}
    </Link>
  );
}
