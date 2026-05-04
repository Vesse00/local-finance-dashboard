"use client";

import { useEffect } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

interface MeBaseIconAnimatedProps {
  size?: number;
}

export function MeBaseIconAnimated({ size = 32 }: MeBaseIconAnimatedProps) {
  const pupilX = useMotionValue(0);
  const pupilY = useMotionValue(0);
  const eyeScaleY = useMotionValue(1);

  useEffect(() => {
    let lookTimeout: ReturnType<typeof setTimeout>;
    let blinkTimeout: ReturnType<typeof setTimeout>;

    // Pozycje do których może patrzeć źrenica (w pikselach SVG)
    const gazePositions = [
      { x: 0, y: 0 },    // centrum
      { x: -1, y: 0 },   // lewo
      { x: 1, y: 0 },    // prawo
      { x: 0, y: -1 },   // góra
      { x: 0, y: 1 },    // dół
      { x: -1, y: -1 },  // lewo-góra
      { x: 1, y: -1 },   // prawo-góra
      { x: -1, y: 1 },   // lewo-dół
      { x: 1, y: 1 },    // prawo-dół
    ];

    const scheduleLook = () => {
      const pos = gazePositions[Math.floor(Math.random() * gazePositions.length)];
      animate(pupilX, pos.x, { duration: 0.22, ease: "easeInOut" });
      animate(pupilY, pos.y, { duration: 0.22, ease: "easeInOut" });
      // Losowy czas do następnego spojrzenia: 1.2s – 4s
      lookTimeout = setTimeout(scheduleLook, Math.random() * 2800 + 1200);
    };

    const scheduleBlink = () => {
      // Szybkie mrugnięcie — scaleY spada do 0.05 i wraca
      animate(eyeScaleY, [1, 0.05, 1], {
        duration: 0.16,
        ease: "easeInOut",
        times: [0, 0.45, 1],
      });
      // Losowy czas do następnego mrugnięcia: 3s – 8s
      blinkTimeout = setTimeout(scheduleBlink, Math.random() * 5000 + 3000);
    };

    // Opóźnienie startu żeby nie animować od razu przy mount
    lookTimeout = setTimeout(scheduleLook, 800);
    blinkTimeout = setTimeout(scheduleBlink, 2500);

    return () => {
      clearTimeout(lookTimeout);
      clearTimeout(blinkTimeout);
    };
  }, [pupilX, pupilY, eyeScaleY]);

  return (
    <motion.svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-label="MeBase"
      style={{ imageRendering: "pixelated" } as React.CSSProperties}
    >
      {/* Cała gałka oczna — animowana scaleY przy mrugnięciu */}
      <motion.g
        style={{
          scaleY: eyeScaleY,
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      >
        {/* === TWARDÓWKA (biała) === */}
        <rect x="6" y="3" width="4" height="1" fill="#e2e8f0" />
        <rect x="4" y="4" width="8" height="1" fill="#e2e8f0" />
        {/* row 5 */}
        <rect x="3" y="5" width="2" height="1" fill="#e2e8f0" />
        <rect x="11" y="5" width="2" height="1" fill="#e2e8f0" />
        {/* row 6 */}
        <rect x="2" y="6" width="2" height="1" fill="#e2e8f0" />
        <rect x="12" y="6" width="2" height="1" fill="#e2e8f0" />
        {/* row 7 */}
        <rect x="2" y="7" width="1" height="1" fill="#e2e8f0" />
        <rect x="13" y="7" width="1" height="1" fill="#e2e8f0" />
        {/* row 8 */}
        <rect x="2" y="8" width="1" height="1" fill="#e2e8f0" />
        <rect x="13" y="8" width="1" height="1" fill="#e2e8f0" />
        {/* row 9 */}
        <rect x="2" y="9" width="2" height="1" fill="#e2e8f0" />
        <rect x="12" y="9" width="2" height="1" fill="#e2e8f0" />
        {/* row 10 */}
        <rect x="3" y="10" width="2" height="1" fill="#e2e8f0" />
        <rect x="11" y="10" width="2" height="1" fill="#e2e8f0" />
        <rect x="4" y="11" width="8" height="1" fill="#e2e8f0" />
        <rect x="6" y="12" width="4" height="1" fill="#e2e8f0" />

        {/* === TĘCZÓWKA — jasna zieleń === */}
        {/* row 5 */}
        <rect x="5" y="5" width="1" height="1" fill="#86efac" /> {/* highlight */}
        <rect x="6" y="5" width="5" height="1" fill="#22c55e" />
        {/* row 6 */}
        <rect x="4" y="6" width="2" height="1" fill="#22c55e" />
        <rect x="10" y="6" width="2" height="1" fill="#22c55e" />
        {/* row 7 */}
        <rect x="3" y="7" width="2" height="1" fill="#22c55e" />
        <rect x="11" y="7" width="2" height="1" fill="#22c55e" />
        {/* row 8 */}
        <rect x="3" y="8" width="2" height="1" fill="#22c55e" />
        <rect x="11" y="8" width="2" height="1" fill="#22c55e" />
        {/* row 9 */}
        <rect x="4" y="9" width="2" height="1" fill="#22c55e" />
        <rect x="10" y="9" width="2" height="1" fill="#22c55e" />
        {/* row 10 */}
        <rect x="5" y="10" width="6" height="1" fill="#22c55e" />

        {/* === TĘCZÓWKA — ciemna zieleń (ring wokół źrenicy) === */}
        <rect x="6" y="6" width="4" height="1" fill="#15803d" />
        {/* row 7 */}
        <rect x="5" y="7" width="2" height="1" fill="#15803d" />
        <rect x="9" y="7" width="2" height="1" fill="#15803d" />
        {/* row 8 */}
        <rect x="5" y="8" width="2" height="1" fill="#15803d" />
        <rect x="9" y="8" width="2" height="1" fill="#15803d" />
        <rect x="6" y="9" width="4" height="1" fill="#15803d" />

        {/* === ŹRENICA — animowana osobno === */}
        <motion.g style={{ x: pupilX, y: pupilY }}>
          <rect x="7" y="7" width="2" height="1" fill="#000000" />
          <rect x="7" y="8" width="2" height="1" fill="#000000" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
