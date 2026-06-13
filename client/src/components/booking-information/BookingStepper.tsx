export function BookingStepper() {
  return (
    <div className="flex items-center justify-between mb-8 w-full font-be-vietnam select-none">
      {/* Step 1 */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="material-symbols-outlined text-secondary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Your selection
        </span>
      </div>

      {/* Horizontal Line 1: stretches from Step 1 to Step 2 */}
      <div className="h-0.5 grow bg-outline-variant mx-4"></div>

      {/* Step 2 (Centered exactly in the middle of the screen!) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs shadow-md">
          2
        </div>
        <span className="text-xs text-secondary font-bold uppercase tracking-wider">
          Your details
        </span>
      </div>

      {/* Horizontal Line 2: stretches from Step 2 to Step 3 */}
      <div className="h-0.5 grow bg-outline-variant/35 mx-4"></div>

      {/* Step 3 */}
      <div className="flex items-center gap-3 opacity-40 shrink-0">
        <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold text-xs">
          3
        </div>
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Final step
        </span>
      </div>
    </div>
  );
}
