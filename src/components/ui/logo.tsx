export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="22" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="7" />
      <path d="M32 10a22 22 0 1 1-20.9 28.8" fill="none" stroke="#C6F36B" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-none">
        <div className="text-[15px] font-semibold tracking-[0.18em]">FORMA</div>
        <div className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-lime">AI</div>
      </div>
    </div>
  );
}
