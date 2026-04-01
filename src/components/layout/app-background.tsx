"use client";

import { useEffect, useRef } from "react";

class Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phaseX: number;
  phaseY: number;

  constructor(w: number, h: number) {
    this.originX = Math.random() * w;
    this.originY = Math.random() * h;
    this.x = this.originX;
    this.y = this.originY;
    this.vx = 0;
    this.vy = 0;
    this.size = Math.random() * 4 + 4; // Ramiona krzyżyka (promień) od 4 do 8
    this.alpha = Math.random() * 0.5 + 0.1; // Losowa widoczność, z uwzględnieniem bazowej przezroczystości
    this.phaseX = Math.random() * Math.PI * 2;
    this.phaseY = Math.random() * Math.PI * 2;
  }

  update(mouseX: number, mouseY: number, isHovering: boolean, time: number) {
    // Delikatne, losowe pływanie bez udziału myszki
    const wanderX = Math.cos(time * 0.001 + this.phaseX) * 0.07;
    const wanderY = Math.sin(time * 0.001 + this.phaseY) * 0.07;

    // Siła sprężyny ciągnąca krzyżyk do oryginalnej pozycji (aby nie uciekł na dobre z ekranu)
    const springX = (this.originX - this.x) * 0.01;
    const springY = (this.originY - this.y) * 0.01;

    this.vx += wanderX + springX;
    this.vy += wanderY + springY;

    // Fizyka uciekania (odpychania) od kursora
    if (isHovering) {
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Jeśli kursor jest bliżej niż 150px
      if (dist < 150 && dist > 1) {
        // Moc uciekania wzrasta, im bliżej jest kursor
        const force = (150 - dist) / 150;
        this.vx += (dx / dist) * force * 1;
        this.vy += (dy / dist) * force * 1;
      }
    }

    // Tarcie zatrzymujące prędkość od ucieczki w nieskończoność
    this.vx *= 0.82;
    this.vy *= 0.82;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx: CanvasRenderingContext2D, isDark: boolean) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4); // Zawsze obrócone o 45 stopni dla znaku 'X'
    
    // Bardziej jaskrawe biele w ciemnym trybie, mocniejsze węgle w jasnym
    const rgb = isDark ? '255, 255, 255' : '0, 0, 0';
    const finalAlpha = isDark ? this.alpha * 0.4 : this.alpha * 0.2;
    
    ctx.strokeStyle = `rgba(${rgb}, ${finalAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-this.size, 0);
    ctx.lineTo(this.size, 0);
    ctx.moveTo(0, -this.size);
    ctx.lineTo(0, this.size);
    ctx.stroke();
    ctx.restore();
  }
}

export function AppBackground() {
  const bgRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let reqId: number;
    let mouseX = window.innerWidth / 2; // Domyślny start ze środka
    let mouseY = window.innerHeight / 2;
    let isHovering = false; // Rozpoczynamy jako ukryte odpychanie
    let particles: Particle[] = [];
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Skalowanie przy rzeźbie ekranu
    const handleResize = () => {
      // Dla wyświetlaczy retina zapewniamy ostre renderowanie pomnożone przez devicePixelRatio
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // Dozujemy ilość krzyżyków optymalnie pod pole powierzchni (mnożnik określa gęstość sita)
      const count = Math.floor((window.innerWidth * window.innerHeight) / 12000);
      particles = Array.from({ length: count }).map(() => new Particle(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Inicjalizacja przy pierwszym załadowaniu

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isHovering = true; // Wiemy na pewno że myszka jest w obszarze ekranu
      
      // Aktualizacja dla Blobów z gradientami (Parallax)
      if (bgRef.current) {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        bgRef.current.style.setProperty("--mx", `${x}`);
        bgRef.current.style.setProperty("--my", `${y}`);
      }
    };
    
    // Głowne koło czasu dla klatek fizyki cząsteczkowych
    const animate = (time: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      
      // Kontrola motywu (Tailwind zazwyczaj nakłada klasę "dark" na :root dokumentu)
      const isDark = document.documentElement.classList.contains('dark');
      
      particles.forEach(p => {
        p.update(mouseX, mouseY, isHovering, time);
        p.draw(ctx, isDark);
      });

      reqId = requestAnimationFrame(animate);
    };

    // Odpalamy zapalnik głównej pętli
    reqId = requestAnimationFrame(animate);

    const handleMouseLeave = () => {
      isHovering = false; // Mysz wyszła z okna, wyłączamy grawitację / uciekanie
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(reqId);
    };
  }, []);

  return (
    <div ref={bgRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      
      {/* 🔮 ZOPTYMALIZOWANE PLAMY ŚWIATŁA W TLE (Ruch Parallax CSS) */}
      <div 
        className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-40 dark:opacity-30 ease-out duration-300"
        style={{ 
          background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(99,102,241,0) 70%)',
          transform: 'translate(calc(var(--mx, 0) * -15px), calc(var(--my, 0) * -15px))'
        }}
      ></div>
      <div 
        className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-30 dark:opacity-30 ease-out duration-300"
        style={{ 
          background: 'radial-gradient(circle, rgba(217,70,239,0.4) 0%, rgba(217,70,239,0) 70%)',
          transform: 'translate(calc(var(--mx, 0) * 10px), calc(var(--my, 0) * 10px))'
        }}
      ></div>
      <div 
        className="absolute top-[30%] left-[40%] w-[400px] h-[400px] rounded-full opacity-20 dark:opacity-20 ease-out duration-300"
        style={{ 
          background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(16,185,129,0) 70%)',
          transform: 'translate(calc(var(--mx, 0) * 25px), calc(var(--my, 0) * 25px))'
        }}
      ></div>

      {/* 🚀 NOWY FIZYCZNY CANVA Z Cząsteczkami (Particles) Reagującymi na Mysz */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 block w-full h-full"
      />
    </div>
  );
}
