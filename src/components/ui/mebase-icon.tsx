interface MeBaseIconProps {
  className?: string;
  size?: number;
}

export function MeBaseIcon({ className, size = 16 }: MeBaseIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-label="MeBase icon"
    >
      {/* Row 3: narrow top — biała twardówka */}
      <rect x="6" y="3" width="4" height="1" fill="#e2e8f0" />
      {/* Row 4: szersza twardówka */}
      <rect x="4" y="4" width="8" height="1" fill="#e2e8f0" />
      {/* Row 5: twardówka + tęczówka (z błyskiem) */}
      <rect x="3" y="5" width="2" height="1" fill="#e2e8f0" />
      <rect x="5" y="5" width="1" height="1" fill="#86efac" /> {/* highlight */}
      <rect x="6" y="5" width="5" height="1" fill="#22c55e" />
      <rect x="11" y="5" width="2" height="1" fill="#e2e8f0" />
      {/* Row 6: twardówka + tęczówka + ciemna obwódka tęczówki */}
      <rect x="2" y="6" width="2" height="1" fill="#e2e8f0" />
      <rect x="4" y="6" width="2" height="1" fill="#22c55e" />
      <rect x="6" y="6" width="4" height="1" fill="#15803d" />
      <rect x="10" y="6" width="2" height="1" fill="#22c55e" />
      <rect x="12" y="6" width="2" height="1" fill="#e2e8f0" />
      {/* Row 7: centrum — źrenica (top) */}
      <rect x="2" y="7" width="1" height="1" fill="#e2e8f0" />
      <rect x="3" y="7" width="2" height="1" fill="#22c55e" />
      <rect x="5" y="7" width="2" height="1" fill="#15803d" />
      <rect x="7" y="7" width="2" height="1" fill="#000000" />
      <rect x="9" y="7" width="2" height="1" fill="#15803d" />
      <rect x="11" y="7" width="2" height="1" fill="#22c55e" />
      <rect x="13" y="7" width="1" height="1" fill="#e2e8f0" />
      {/* Row 8: centrum — źrenica (bottom) */}
      <rect x="2" y="8" width="1" height="1" fill="#e2e8f0" />
      <rect x="3" y="8" width="2" height="1" fill="#22c55e" />
      <rect x="5" y="8" width="2" height="1" fill="#15803d" />
      <rect x="7" y="8" width="2" height="1" fill="#000000" />
      <rect x="9" y="8" width="2" height="1" fill="#15803d" />
      <rect x="11" y="8" width="2" height="1" fill="#22c55e" />
      <rect x="13" y="8" width="1" height="1" fill="#e2e8f0" />
      {/* Row 9: mirror row 6 */}
      <rect x="2" y="9" width="2" height="1" fill="#e2e8f0" />
      <rect x="4" y="9" width="2" height="1" fill="#22c55e" />
      <rect x="6" y="9" width="4" height="1" fill="#15803d" />
      <rect x="10" y="9" width="2" height="1" fill="#22c55e" />
      <rect x="12" y="9" width="2" height="1" fill="#e2e8f0" />
      {/* Row 10: mirror row 5 */}
      <rect x="3" y="10" width="2" height="1" fill="#e2e8f0" />
      <rect x="5" y="10" width="6" height="1" fill="#22c55e" />
      <rect x="11" y="10" width="2" height="1" fill="#e2e8f0" />
      {/* Row 11: mirror row 4 */}
      <rect x="4" y="11" width="8" height="1" fill="#e2e8f0" />
      {/* Row 12: narrow bottom — mirror row 3 */}
      <rect x="6" y="12" width="4" height="1" fill="#e2e8f0" />
    </svg>
  );
}
