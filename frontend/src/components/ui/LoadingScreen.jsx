function LoadingScreen({
  title = "Loading...",
  description = "Please wait a moment while we get everything ready.",
  compact = false,
  className = "",
}) {
  return (
    <div className={`${compact ? "px-4 py-6" : "min-h-[60vh] px-6 py-16"} flex items-center justify-center ${className}`}>
      <div
        className={`w-full ${
          compact
            ? "max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left"
            : "max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-md"
        }`}
      >
        <div className={`flex ${compact ? "items-center gap-4" : "flex-col items-center"}`}>
          <div className="grid h-14 w-14 place-items-center rounded-full border border-orange-400/25 bg-orange-500/10">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-300/25 border-t-orange-400" />
          </div>

          <div className={compact ? "min-w-0" : "mt-5"}>
            <h2 className="text-lg font-black text-white">{title}</h2>
            <p className={`mt-2 text-sm leading-6 text-slate-400 ${compact ? "max-w-none" : "mx-auto max-w-sm"}`}>
              {description}
            </p>
          </div>
        </div>

        {!compact && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-300 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-200 [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;