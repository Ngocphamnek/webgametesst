import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface Bubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  reward: number;
  emoji: string;
  popped: boolean;
  opacity: number;
}

const BUBBLE_COLORS = [
  { bg: "rgba(220,38,38,0.85)",   glow: "rgba(220,38,38,0.6)",  text: "#ffd700" },
  { bg: "rgba(234,88,12,0.85)",   glow: "rgba(234,88,12,0.6)",  text: "#fff" },
  { bg: "rgba(22,163,74,0.85)",   glow: "rgba(22,163,74,0.6)",  text: "#fff" },
  { bg: "rgba(37,99,235,0.85)",   glow: "rgba(37,99,235,0.6)",  text: "#fff" },
  { bg: "rgba(124,58,237,0.85)",  glow: "rgba(124,58,237,0.6)", text: "#ffd700" },
  { bg: "rgba(217,119,6,0.85)",   glow: "rgba(217,119,6,0.6)",  text: "#fff" },
  { bg: "rgba(219,39,119,0.85)",  glow: "rgba(219,39,119,0.6)", text: "#fff" },
];

const EMOJIS_REWARDS = [
  { emoji: "💰", reward: 500,   weight: 30 },
  { emoji: "🎲", reward: 1000,  weight: 25 },
  { emoji: "🎯", reward: 2000,  weight: 18 },
  { emoji: "⭐", reward: 3000,  weight: 12 },
  { emoji: "💎", reward: 5000,  weight: 8  },
  { emoji: "🔥", reward: 10000, weight: 5  },
  { emoji: "👑", reward: 20000, weight: 2  },
];

function pickWeighted() {
  const total = EMOJIS_REWARDS.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  for (const item of EMOJIS_REWARDS) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return EMOJIS_REWARDS[0];
}

interface PopEffect {
  id: number;
  x: number;
  y: number;
  reward: number;
  emoji: string;
  opacity: number;
}

export function BubbleMiniGame({ onEarn }: { onEarn?: (amount: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animRef = useRef<number>(0);
  const nextId = useRef(0);
  const [, forceRender] = useState(0);
  const [popEffects, setPopEffects] = useState<PopEffect[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [popsLeft, setPopsLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const { toast } = useToast();

  const spawn = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const r = 28 + Math.random() * 26;
    const colorData = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const picked = pickWeighted();
    const bubble: Bubble = {
      id: nextId.current++,
      x: r + Math.random() * (width - 2 * r),
      y: height + r,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(0.6 + Math.random() * 0.8),
      r,
      color: colorData.bg,
      reward: picked.reward,
      emoji: picked.emoji,
      popped: false,
      opacity: 1,
    };
    bubblesRef.current.push(bubble);
  }, []);

  useEffect(() => {
    let spawnTimer = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const el = containerRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      spawnTimer += dt;
      if (spawnTimer > 1400 && bubblesRef.current.length < 12 && !gameOver) {
        spawn();
        spawnTimer = 0;
      }

      bubblesRef.current = bubblesRef.current.filter(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.vx += (Math.random() - 0.5) * 0.05;
        if (b.x - b.r < 0)      { b.x = b.r;         b.vx = Math.abs(b.vx); }
        if (b.x + b.r > width)  { b.x = width - b.r; b.vx = -Math.abs(b.vx); }
        if (b.popped) {
          b.opacity -= 0.07;
          return b.opacity > 0;
        }
        return b.y + b.r > 0;
      });

      forceRender(n => n + 1);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    const spawnInitial = () => { for (let i = 0; i < 4; i++) spawn(); };
    const t = setTimeout(spawnInitial, 200);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(t);
    };
  }, [spawn, gameOver]);

  const popBubble = useCallback((bubble: Bubble) => {
    if (bubble.popped || gameOver) return;
    bubble.popped = true;

    setPopsLeft(prev => {
      const next = prev - 1;
      if (next <= 0) setGameOver(true);
      return next;
    });

    setTotalEarned(prev => prev + bubble.reward);
    onEarn?.(bubble.reward);

    const effectId = nextId.current++;
    setPopEffects(prev => [...prev, { id: effectId, x: bubble.x, y: bubble.y, reward: bubble.reward, emoji: bubble.emoji, opacity: 1 }]);
    setTimeout(() => setPopEffects(prev => prev.filter(e => e.id !== effectId)), 900);

    if (bubble.reward >= 10000) {
      toast({ title: `${bubble.emoji} JACKPOT!`, description: `+${bubble.reward.toLocaleString("vi-VN")}đ`, duration: 2000 });
    }
  }, [gameOver, onEarn, toast]);

  const reset = () => {
    bubblesRef.current = [];
    setTotalEarned(0);
    setPopsLeft(30);
    setGameOver(false);
    setPopEffects([]);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", userSelect: "none" }}>
      <style>{`
        @keyframes bubbleRise { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes popFly { 0% { transform: scale(1) translateY(0); opacity: 1; } 100% { transform: scale(0) translateY(-60px); opacity: 0; } }
        @keyframes rewardFloat { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-50px); opacity: 0; } }
        .bubble-btn { transition: transform 0.05s; }
        .bubble-btn:active { transform: scale(0.85) !important; }
      `}</style>

      {/* Header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "rgba(255,200,80,0.9)", fontSize: 11, fontWeight: 700 }}>TỔNG THẮNG</span>
          <span style={{ color: "#ffd700", fontWeight: 900, fontSize: 15, fontFamily: "monospace" }}>+{totalEarned.toLocaleString("vi-VN")}đ</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700 }}>LƯỢT BẮN</span>
          <span style={{ color: popsLeft <= 5 ? "#ef4444" : "#fff", fontWeight: 900, fontSize: 18 }}>{popsLeft}</span>
        </div>
        <button onClick={reset} style={{ background: "linear-gradient(135deg,#c41c00,#7f0000)", border: "1.5px solid rgba(255,80,60,0.5)", borderRadius: 8, color: "#fff", padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          Chơi lại
        </button>
      </div>

      {/* Bubbles */}
      {bubblesRef.current.map(b => (
        <button
          key={b.id}
          className="bubble-btn"
          onClick={() => popBubble(b)}
          style={{
            position: "absolute",
            left: b.x - b.r,
            top: b.y - b.r,
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: "50%",
            background: b.popped ? "transparent" : b.color,
            border: b.popped ? "none" : "2px solid rgba(255,255,255,0.4)",
            cursor: b.popped ? "default" : "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: b.popped ? "none" : `0 0 ${b.r * 0.6}px ${b.color.replace("0.85", "0.5")}, inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 4px 8px rgba(255,255,255,0.2)`,
            opacity: b.opacity,
            transition: "opacity 0.1s",
            animation: !b.popped ? "bubbleRise 0.3s ease-out" : undefined,
            padding: 0,
            outline: "none",
          }}
        >
          {!b.popped && (
            <>
              {/* Shine */}
              <div style={{ position: "absolute", top: "15%", left: "20%", width: "30%", height: "20%", borderRadius: "50%", background: "rgba(255,255,255,0.35)", transform: "rotate(-30deg)" }} />
              <span style={{ fontSize: b.r * 0.55, lineHeight: 1, zIndex: 1 }}>{b.emoji}</span>
              <span style={{ fontSize: b.r * 0.28, color: "#fff", fontWeight: 700, fontFamily: "monospace", textShadow: "0 1px 3px rgba(0,0,0,0.8)", zIndex: 1 }}>
                {b.reward >= 1000 ? `${b.reward / 1000}K` : b.reward}
              </span>
            </>
          )}
        </button>
      ))}

      {/* Pop effects */}
      {popEffects.map(e => (
        <div key={e.id} style={{ position: "absolute", left: e.x, top: e.y, transform: "translate(-50%,-50%)", pointerEvents: "none", animation: "popFly 0.8s ease-out forwards", zIndex: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 28, animation: "popFly 0.8s ease-out forwards" }}>{e.emoji}</span>
            <span style={{ color: "#ffd700", fontWeight: 900, fontSize: 14, fontFamily: "monospace", textShadow: "0 0 10px rgba(255,215,0,0.8)", whiteSpace: "nowrap" }}>
              +{e.reward.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      ))}

      {/* Game Over Overlay */}
      {gameOver && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, zIndex: 30 }}>
          <div style={{ fontSize: 56 }}>🏆</div>
          <div style={{ color: "#ffd700", fontWeight: 900, fontSize: 22, textAlign: "center", textShadow: "0 0 20px rgba(255,200,0,0.8)" }}>KẾT THÚC LƯỢT!</div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center" }}>Bạn đã thu về</div>
          <div style={{ color: "#4ade80", fontWeight: 900, fontSize: 28, fontFamily: "monospace", textShadow: "0 0 20px rgba(74,222,128,0.6)" }}>
            +{totalEarned.toLocaleString("vi-VN")}đ
          </div>
          <button onClick={reset} style={{
            marginTop: 8,
            background: "linear-gradient(135deg,#c41c00,#7f0000)",
            border: "2px solid rgba(255,80,60,0.6)",
            borderRadius: 12,
            color: "#fff",
            padding: "12px 36px",
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: 1,
            boxShadow: "0 0 24px rgba(200,28,0,0.6)",
          }}>
            🎮 CHƠI LẠI
          </button>
        </div>
      )}
    </div>
  );
}
