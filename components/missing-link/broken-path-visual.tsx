/** Decorative route map that ends in empty space — missing short link. */
export function BrokenPathVisual() {
  return (
    <svg
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-full max-w-md"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="path-fade"
          x1="40"
          y1="100"
          x2="280"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--signal)" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="var(--signal)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--signal)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Soft ground plane */}
      <ellipse
        cx="160"
        cy="168"
        rx="118"
        ry="18"
        fill="var(--signal)"
        opacity="0.06"
        className="motion-safe:animate-[missing-glow_4.5s_ease-in-out_infinite]"
      />

      {/* Main route — solid then dissolving */}
      <path
        d="M36 118 C70 118, 78 72, 112 72 S154 118, 188 118"
        stroke="url(#path-fade)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="280"
        className="motion-safe:animate-[missing-draw_1.1s_cubic-bezier(0.23,1,0.32,1)_both]"
      />

      {/* Fading dashed continuation into nowhere */}
      <path
        d="M188 118 C214 118, 228 96, 248 92 S278 98, 292 88"
        stroke="var(--signal)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 10"
        opacity="0.35"
        className="motion-safe:animate-[missing-dash_1.8s_cubic-bezier(0.23,1,0.32,1)_0.35s_both]"
      />

      {/* Start node */}
      <circle
        cx="36"
        cy="118"
        r="7"
        fill="var(--surface)"
        stroke="var(--signal)"
        strokeWidth="2.5"
        className="motion-safe:animate-[missing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_both]"
      />
      <circle cx="36" cy="118" r="2.5" fill="var(--signal)" />

      {/* Mid node */}
      <circle
        cx="112"
        cy="72"
        r="7"
        fill="var(--surface)"
        stroke="var(--signal)"
        strokeWidth="2.5"
        className="motion-safe:animate-[missing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_0.12s_both]"
      />
      <circle cx="112" cy="72" r="2.5" fill="var(--signal)" />

      {/* Last solid node — the break point */}
      <g className="motion-safe:animate-[missing-fade-up_0.7s_cubic-bezier(0.23,1,0.32,1)_0.24s_both]">
        <circle
          cx="188"
          cy="118"
          r="9"
          fill="var(--surface)"
          stroke="var(--signal)"
          strokeWidth="2.5"
        />
        <circle
          cx="188"
          cy="118"
          r="3"
          fill="var(--signal)"
          className="motion-safe:animate-[missing-pulse_2.4s_ease-in-out_0.8s_infinite]"
        />
      </g>

      {/* Ghost nodes drifting into void */}
      <circle
        cx="236"
        cy="96"
        r="4.5"
        fill="var(--signal)"
        opacity="0.28"
        className="motion-safe:animate-[missing-drift_3.2s_ease-in-out_0.5s_infinite]"
      />
      <circle
        cx="268"
        cy="90"
        r="3"
        fill="var(--signal)"
        opacity="0.16"
        className="motion-safe:animate-[missing-drift_3.8s_ease-in-out_0.9s_infinite_reverse]"
      />
      <circle
        cx="294"
        cy="84"
        r="2"
        fill="var(--signal)"
        opacity="0.1"
        className="motion-safe:animate-[missing-drift_4.2s_ease-in-out_1.1s_infinite]"
      />
    </svg>
  );
}
