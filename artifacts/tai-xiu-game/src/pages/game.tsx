import { useState, useEffect, useRef } from "react";
import { useGetMe, useGetBalance, useGetBetHistory } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { DepositModal } from "@/components/deposit-modal";
import { useToast } from "@/hooks/use-toast";
const topNavImg = "/top-nav.png";
const bottomBarImg = "/bottom-bar.png";
const gameBg2 = "/game-bg2.png";
const promoCard = "/promo-card-new.png";

const GAMES = [
  { name:"Tài Xỉu",  img:null, emoji:"🎲", color:"#c41c00,#ff6600,#c41c00", dice:true  },
  { name:"MD5",      img:null, emoji:"🔐", color:"#065f2c,#16a34a,#065f2c", dice:false },
  { name:"Sicbo",    img:null, emoji:"🎯", color:"#6d28d9,#7c3aed,#6d28d9", dice:true  },
  { name:"Bắn Cá",  img:null, emoji:"🐟", color:"#075985,#0369a1,#075985", dice:false },
  { name:"Rồng Hổ", img:null, emoji:"🐯", color:"#92400e,#b45309,#92400e", dice:false },
  { name:"Tiến Lên", img:null, emoji:"♠️", color:"#064e3b,#065f46,#064e3b", dice:false },
  { name:"Xóc Đĩa", img:null, emoji:"🎪", color:"#881337,#9f1239,#881337", dice:false },
  { name:"Poker",    img:null, emoji:"🃏", color:"#1e3a5f,#1d4ed8,#1e3a5f", dice:false },
  { name:"Baccarat", img:null, emoji:"🎴", color:"#1e3a5f,#4338ca,#1e3a5f", dice:false },
  { name:"Keno",     img:null, emoji:"🔢", color:"#312e81,#7c3aed,#312e81", dice:false },
  { name:"Jackboss", img:null, emoji:"🎰", color:"#78350f,#d97706,#78350f", dice:false },
  { name:"Bầu Cua", img:null, emoji:"🦀", color:"#14532d,#15803d,#14532d", dice:false },
  { name:"Lô Đề",   img:null, emoji:"🔢", color:"#312e81,#4338ca,#312e81", dice:false },
  { name:"Đua Ngựa",img:null, emoji:"🐎", color:"#4c1d95,#7c3aed,#4c1d95", dice:false },
  { name:"Mậu Binh",img:null, emoji:"🀄", color:"#1c1917,#44403c,#1c1917", dice:false },
  { name:"Aviator",  img:null, emoji:"✈️", color:"#7f1d1d,#dc2626,#7f1d1d", dice:false },
] as const;

const CARD_H = "clamp(220px,40vh,360px)";

/* ─── Orientation detection — SunWin/Go88 style ──────────────────────────
   On phones in portrait: show "rotate device" overlay (no CSS rotation)
   On everything else: display normally
   ──────────────────────────────────────────────────────────────────────── */
const IS_PHONE = (() => {
  const ua = navigator.userAgent;
  const shortEdge = Math.min(window.screen.width, window.screen.height);
  const hasTouch = navigator.maxTouchPoints > 0;
  const mobileUA = /Mobi|Android|iPhone|iPod/i.test(ua) && !/iPad/i.test(ua);
  return hasTouch && mobileUA && shortEdge < 600;
})();

function usePortraitPhone() {
  const isPortrait = () => window.innerHeight > window.innerWidth;
  const [portrait, setPortrait] = useState(isPortrait);
  useEffect(() => {
    if (!IS_PHONE) return;
    const update = () => setTimeout(() => setPortrait(isPortrait()), 120);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return IS_PHONE && portrait;
}

/* ─── Rotate overlay (same style as SunWin/Go88/Hi88) ─────────────────── */
function RotateOverlay() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:99999,
      background:"#0a0000",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:24,
    }}>
      <style>{`
        @keyframes rotatePhone {
          0%   { transform: rotate(0deg);   }
          30%  { transform: rotate(0deg);   }
          60%  { transform: rotate(90deg);  }
          100% { transform: rotate(90deg);  }
        }
      `}</style>
      {/* Phone icon rotating */}
      <div style={{ animation:"rotatePhone 2s ease-in-out infinite", fontSize:72, lineHeight:1 }}>📱</div>
      <p style={{
        color:"#ffd700", fontWeight:900, fontSize:18,
        textAlign:"center", letterSpacing:1, margin:0,
        textShadow:"0 0 16px rgba(255,180,0,0.6)",
      }}>
        Vui lòng xoay ngang màn hình
      </p>
      <p style={{ color:"rgba(255,255,255,0.55)", fontSize:13, margin:0, textAlign:"center" }}>
        Please rotate your device to landscape
      </p>
    </div>
  );
}


/* ─── VIP tiers ──────────────────────────────────────────────────────── */
const VIP_TIERS: Record<number, { label: string; bg: string; text: string; glow: string; ring: string }> = {
  1: { label: "VIP 1", bg: "linear-gradient(135deg,#b45309,#92400e)", text: "#fde68a", glow: "rgba(180,83,9,0.8)", ring: "#b45309" },
  2: { label: "VIP 2", bg: "linear-gradient(135deg,#6b7280,#9ca3af)", text: "#f9fafb", glow: "rgba(156,163,175,0.8)", ring: "#9ca3af" },
  3: { label: "VIP 3", bg: "linear-gradient(135deg,#b8860b,#ffd700,#b8860b)", text: "#1a0f00", glow: "rgba(255,215,0,0.8)", ring: "#ffd700" },
  4: { label: "VIP 4", bg: "linear-gradient(135deg,#60a5fa,#a5f3fc,#60a5fa)", text: "#0c4a6e", glow: "rgba(96,165,250,0.8)", ring: "#60a5fa" },
  5: { label: "VIP 5", bg: "linear-gradient(135deg,#7c3aed,#a78bfa,#7c3aed)", text: "#ede9fe", glow: "rgba(167,139,250,0.8)", ring: "#a78bfa" },
  6: { label: "VIP 6", bg: "linear-gradient(135deg,#dc2626,#f97316,#dc2626)", text: "#fff", glow: "rgba(249,115,22,0.8)", ring: "#f97316" },
  7: { label: "VIP 7", bg: "linear-gradient(135deg,#0ea5e9,#f0abfc,#0ea5e9)", text: "#0c0c1a", glow: "rgba(240,171,252,0.8)", ring: "#f0abfc" },
  8: { label: "VIP 8", bg: "linear-gradient(135deg,#fbbf24,#b8860b)", text: "#1a0a00", glow: "rgba(251,191,36,0.9)", ring: "#fbbf24" },
  9: { label: "VIP 9", bg: "linear-gradient(135deg,#ff0000,#ffd700,#ff0000)", text: "#1a0000", glow: "rgba(255,215,0,1)", ring: "#ffd700" },
};

/* ─── Top nav items ───────────────────────────────────────────────────── */
const TOP_NAV = [
  { key: "sukien",   label: "SỰ KIỆN",  emoji: "🎁" },
  { key: "naptien",  label: "NẠP TIỀN", emoji: "💳" },
  { key: "vongquay", label: "VÒNG QUAY",emoji: "🎡" },
  { key: "giftcode", label: "GIFTCODE",  emoji: "🎀" },
];

/* ─── Preset avatar data ─────────────────────────────────────────────── */
const PRESET_AVATARS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  url: `/avatars/av${i + 1}.png`,
}));

/* ─── Bottom-bar button styles (must be before Game component) ───────── */
const newDockBtn: React.CSSProperties = {
  display:"flex", flexDirection:"column", alignItems:"center", gap:"clamp(3px,0.45vh,5px)",
  background:"none", border:"none", cursor:"pointer", padding:"clamp(4px,0.5vw,8px) clamp(8px,1vw,14px)",
  borderRadius:12, transition:"transform 0.15s, filter 0.15s", flexShrink:0,
};
const newIconBox: React.CSSProperties = {
  width:"clamp(40px,4.6vw,58px)", height:"clamp(40px,4.6vw,58px)", borderRadius:"clamp(10px,1.1vw,15px)",
  background:"linear-gradient(160deg,rgba(60,20,0,0.7),rgba(30,8,0,0.85))",
  border:"1.5px solid rgba(200,120,0,0.3)",
  display:"flex", alignItems:"center", justifyContent:"center",
  boxShadow:"0 3px 14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,180,0,0.12), inset 0 -1px 0 rgba(0,0,0,0.4)",
  flexShrink:0,
};
const newDockLabel: React.CSSProperties = {
  color:"rgba(255,255,255,0.95)", fontSize:"clamp(8px,0.82vw,11px)", fontWeight:900,
  whiteSpace:"nowrap", letterSpacing:"clamp(0.4px,0.06vw,1px)", textShadow:"0 1px 6px rgba(0,0,0,0.9)",
};

/* ─── Dice face ──────────────────────────────────────────────────────── */
const DICE_DOTS: Record<number, Array<{x:number;y:number}>> = {
  1: [{x:50,y:50}],
  2: [{x:28,y:28},{x:72,y:72}],
  3: [{x:28,y:28},{x:50,y:50},{x:72,y:72}],
  4: [{x:28,y:28},{x:72,y:28},{x:28,y:72},{x:72,y:72}],
  5: [{x:28,y:28},{x:72,y:28},{x:50,y:50},{x:28,y:72},{x:72,y:72}],
  6: [{x:28,y:22},{x:72,y:22},{x:28,y:50},{x:72,y:50},{x:28,y:78},{x:72,y:78}],
};

function DiceFace({ value, size = 48 }: { value: number; size?: number }) {
  const dots = DICE_DOTS[value] ?? DICE_DOTS[1];
  const dotR = size * 0.15;
  return (
    <div style={{
      width:size, height:size, flexShrink:0,
      background:"linear-gradient(145deg,#ffffff 0%,#dcdcdc 100%)",
      borderRadius: Math.round(size * 0.2),
      position:"relative",
      boxShadow:`0 ${Math.round(size*.06)}px ${Math.round(size*.22)}px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(0,0,0,0.2)`,
      border:"1.5px solid rgba(200,200,200,0.7)",
    }}>
      {dots.map((dot, i) => (
        <div key={i} style={{
          position:"absolute", width:dotR*2, height:dotR*2, borderRadius:"50%",
          background:"radial-gradient(circle at 35% 35%, #7a0000, #1a0000)",
          boxShadow:`inset 0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(120,0,0,0.4)`,
          left:`${dot.x}%`, top:`${dot.y}%`, transform:"translate(-50%,-50%)",
        }} />
      ))}
    </div>
  );
}

function RollingDice({ delay = 0, size = 48 }: { delay?: number; size?: number }) {
  const [value, setValue]     = useState(() => Math.floor(Math.random()*6)+1);
  const [rolling, setRolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | null = null;
    let stop: ReturnType<typeof setTimeout> | null = null;
    const roll = () => {
      setRolling(true);
      iv = setInterval(() => setValue(Math.floor(Math.random()*6)+1), 75);
      stop = setTimeout(() => {
        if (iv) clearInterval(iv);
        setRolling(false);
        timerRef.current = setTimeout(roll, 1600 + delay*350 + Math.random()*500);
      }, 750 + delay*90);
    };
    timerRef.current = setTimeout(roll, 400 + delay*280);
    return () => {
      if (iv)  clearInterval(iv);
      if (stop) clearTimeout(stop);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [delay]);

  return (
    <div style={{
      animation: rolling ? "diceShake 0.09s linear infinite" : "diceLand 0.25s ease-out",
      transformOrigin:"center bottom",
      filter: rolling
        ? "drop-shadow(0 0 8px rgba(255,200,0,0.8))"
        : "drop-shadow(0 4px 10px rgba(0,0,0,0.6))",
      transition:"filter 0.3s",
    }}>
      <DiceFace value={value} size={size} />
    </div>
  );
}

/* ─── Golden tossing die ─────────────────────────────────────────────── */
function GoldenDice({ delay = 0, size = 42 }: { delay?: number; size?: number }) {
  const [value, setValue]     = useState(() => Math.floor(Math.random()*6)+1);
  const [phase, setPhase]     = useState<"idle"|"up"|"down">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dots = DICE_DOTS[value] ?? DICE_DOTS[1];
    void dots; // suppress unused warning

    const run = () => {
      // toss up
      setPhase("up");
      // change face mid-air
      const mid = setTimeout(() => setValue(Math.floor(Math.random()*6)+1), 350 + delay*40);
      // come down
      const down = setTimeout(() => setPhase("down"), 620 + delay*40);
      // idle then repeat
      const idle = setTimeout(() => {
        setPhase("idle");
        timerRef.current = setTimeout(run, 900 + delay*250 + Math.random()*400);
      }, 950 + delay*40);
      return () => { clearTimeout(mid); clearTimeout(down); clearTimeout(idle); };
    };

    timerRef.current = setTimeout(run, 500 + delay*320);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [delay]);

  const dotR = size * 0.14;
  const dots = DICE_DOTS[value] ?? DICE_DOTS[1];

  const animStyle: React.CSSProperties =
    phase === "up"   ? { animation:"goldenUp 0.32s cubic-bezier(0.25,0.46,0.45,0.94) forwards" } :
    phase === "down" ? { animation:"goldenDown 0.33s cubic-bezier(0.55,0.06,0.68,0.19) forwards" } :
    {};

  return (
    <div style={{
      width:size, height:size, flexShrink:0, position:"relative",
      ...animStyle,
    }}>
      {/* Golden dice body */}
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(135deg, #ffe066 0%, #f5a623 40%, #c8820a 70%, #f5c842 100%)",
        borderRadius:Math.round(size*0.2),
        boxShadow:`0 ${Math.round(size*.08)}px ${Math.round(size*.25)}px rgba(0,0,0,0.75), inset 0 2px 4px rgba(255,255,200,0.7), inset 0 -2px 4px rgba(100,50,0,0.4)`,
        border:`1.5px solid rgba(255,240,120,0.7)`,
      }}>
        {dots.map((dot, i) => (
          <div key={i} style={{
            position:"absolute", width:dotR*2, height:dotR*2, borderRadius:"50%",
            background:"radial-gradient(circle at 35% 30%, #5a0000, #1a0000)",
            boxShadow:"inset 0 1px 2px rgba(0,0,0,0.6)",
            left:`${dot.x}%`, top:`${dot.y}%`, transform:"translate(-50%,-50%)",
          }} />
        ))}
      </div>
      {/* Shine */}
      <div style={{
        position:"absolute", top:"8%", left:"12%", width:"40%", height:"22%",
        background:"linear-gradient(135deg, rgba(255,255,255,0.6), transparent)",
        borderRadius:4, pointerEvents:"none",
      }} />
    </div>
  );
}

/* ─── Themed game card ───────────────────────────────────────────────── */
type GameDef = (typeof GAMES)[number];

function ThemedGameCard({ g }: { g: GameDef }) {
  const diceSize = Math.round(Math.min(48, Math.max(32, (typeof window !== "undefined" ? window.innerWidth : 1200) * 0.034)));

  if (g.img) {
    /* ── Image card: show real artwork + overlay effects ── */
    return (
      <div style={{
        height: CARD_H,
        position:"relative",
        borderRadius:16,
        overflow:"hidden",
        boxShadow:"0 0 22px rgba(200,60,0,0.45), 0 10px 36px rgba(0,0,0,0.85)",
        border:"1.5px solid rgba(220,110,0,0.5)",
        flexShrink:0,
      }}>
        {/* Base image — always static */}
        <img
          src={g.img}
          alt={g.name}
          draggable={false}
          style={{ height:"100%", display:"block", objectFit:"cover", userSelect:"none" }}
        />

        {/* Shimmer sweep over image */}
        <div className="card-img-shimmer" style={{
          position:"absolute", inset:0, pointerEvents:"none",
          animation:"cardShimmer 3.2s linear infinite",
        }} />

        {/* Edge glow vignette */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          boxShadow:"inset 0 0 28px rgba(220,80,0,0.45), inset 0 0 8px rgba(255,160,0,0.2)",
          borderRadius:16,
        }} />

        {/* Top gold line */}
        <div style={{
          position:"absolute", top:0, left:"15%", right:"15%", height:2, pointerEvents:"none",
          background:"linear-gradient(90deg, transparent, rgba(255,200,0,0.85), transparent)",
        }} />

        {/* Overlay dice toss — only for dice games */}
        {"dice" in g && g.dice && (
          <div style={{
            position:"absolute", bottom:"18%", left:0, right:0,
            display:"flex", justifyContent:"center", alignItems:"flex-end",
            gap:"clamp(8px,1vw,14px)", pointerEvents:"none",
          }}>
            <GoldenDice delay={0} size={diceSize} />
            <GoldenDice delay={1} size={diceSize} />
          </div>
        )}

        {/* Corner accents */}
        {[
          {top:6,left:6,borderTop:"2px solid",borderLeft:"2px solid",borderRadius:"3px 0 0 0"},
          {top:6,right:6,borderTop:"2px solid",borderRight:"2px solid",borderRadius:"0 3px 0 0"},
          {bottom:6,left:6,borderBottom:"2px solid",borderLeft:"2px solid",borderRadius:"0 0 0 3px"},
          {bottom:6,right:6,borderBottom:"2px solid",borderRight:"2px solid",borderRadius:"0 0 3px 0"},
        ].map((s, i) => (
          <div key={i} style={{ position:"absolute", width:14, height:14, borderColor:"rgba(255,180,0,0.65)", pointerEvents:"none", ...s }} />
        ))}
      </div>
    );
  }

  /* ── No-image fallback: themed dark card with emoji ── */
  return (
    <div style={{
      height: CARD_H,
      width:"clamp(150px,15vw,210px)",
      background:"linear-gradient(160deg, rgba(48,4,0,0.93) 0%, rgba(18,0,0,0.97) 55%, rgba(72,8,0,0.90) 100%)",
      borderRadius:18,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"space-between",
      padding:"clamp(14px,2vh,22px) clamp(10px,1.2vw,16px)",
      position:"relative", overflow:"hidden",
      border:"1.5px solid rgba(220,110,0,0.5)",
      boxShadow:"0 0 24px rgba(200,60,0,0.32), 0 12px 40px rgba(0,0,0,0.88), inset 0 1px 0 rgba(255,170,0,0.14)",
    }}>
      <div className="card-img-shimmer" style={{
        position:"absolute", inset:0, pointerEvents:"none",
        animation:"cardShimmer 3.5s linear infinite",
      }} />
      <div style={{ position:"absolute", top:0, left:"15%", right:"15%", height:2, pointerEvents:"none",
        background:"linear-gradient(90deg, transparent, rgba(255,160,0,0.7), transparent)" }} />
      {[
        {top:7,left:7,borderTop:"2px solid",borderLeft:"2px solid",borderRadius:"3px 0 0 0"},
        {top:7,right:7,borderTop:"2px solid",borderRight:"2px solid",borderRadius:"0 3px 0 0"},
        {bottom:7,left:7,borderBottom:"2px solid",borderLeft:"2px solid",borderRadius:"0 0 0 3px"},
        {bottom:7,right:7,borderBottom:"2px solid",borderRight:"2px solid",borderRadius:"0 0 3px 0"},
      ].map((s, i) => (
        <div key={i} style={{ position:"absolute", width:16, height:16, borderColor:"rgba(255,170,0,0.5)", pointerEvents:"none", ...s }} />
      ))}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {"dice" in g && g.dice ? (
          <div style={{ display:"flex", gap:"clamp(5px,0.7vw,9px)", alignItems:"flex-end" }}>
            <RollingDice delay={0} size={diceSize} />
            <RollingDice delay={1} size={diceSize} />
            <RollingDice delay={2} size={diceSize} />
          </div>
        ) : (
          <span style={{
            fontSize:"clamp(44px,5.5vw,70px)",
            animation:"floatEmoji 3s ease-in-out infinite",
            filter:"drop-shadow(0 0 14px rgba(255,120,0,0.75))",
            display:"block", lineHeight:1,
          }}>{g.emoji}</span>
        )}
      </div>
      <div style={{ width:"100%", textAlign:"center", paddingTop:8, borderTop:"1px solid rgba(255,120,0,0.18)" }}>
        <span style={{
          color:"#fff", fontWeight:900, letterSpacing:1.5,
          fontSize:"clamp(11px,1.1vw,15px)",
          textShadow:"0 0 14px rgba(255,160,0,0.9), 0 2px 6px rgba(0,0,0,0.9)",
          animation:"titleGlow 2.8s ease-in-out infinite",
          display:"block",
        }}>{g.name}</span>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function Game() {
  const [depositOpen, setDepositOpen]   = useState(false);
  const [depositInitTab, setDepositInitTab] = useState<"nap"|"rut"|"ket-sat"|"lich-su">("nap");
  const [notifOpen, setNotifOpen]       = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [idCopied, setIdCopied]         = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [settingsTab, setSettingsTab]     = useState<"taikhoan"|"matkhau"|"baomat"|"lichsu">("taikhoan");
  const [soundEnabled, setSoundEnabled]   = useState(() => localStorage.getItem("sound_enabled") !== "false");
  const [volume, setVolume]               = useState(() => parseInt(localStorage.getItem("sound_volume") ?? "70"));
  const [oldPw, setOldPw]                 = useState("");
  const [newPw, setNewPw]                 = useState("");
  const [confirmPw, setConfirmPw]         = useState("");
  const [pwError, setPwError]             = useState("");
  const [pwSuccess, setPwSuccess]         = useState(false);
  const [pwLoading, setPwLoading]         = useState(false);
  const [showOldPw, setShowOldPw]         = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);
  const [showConfPw, setShowConfPw]       = useState(false);
  const [readMsgs, setReadMsgs]           = useState<Set<number>>(new Set());
  const [avatar, setAvatar]               = useState<string | null>(null);
  const [avatarHover, setAvatarHover]     = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [selectedPreset, setSelectedPreset]     = useState<number | null>(null);
  /* New modals */
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [giftcodeOpen, setGiftcodeOpen] = useState(false);
  const [giftcodeVal, setGiftcodeVal]   = useState("");
  const [giftcodeStatus, setGiftcodeStatus] = useState<"idle"|"loading"|"ok"|"err">("idle");
  const [missionTab, setMissionTab]     = useState<"daily"|"newbie">("daily");
  const [gameWheelOpen, setGameWheelOpen] = useState(false);
  /* Settings toggles (KCLUB style) */
  const [autoReady, setAutoReady]   = useState(false);
  const [effects, setEffects]       = useState(true);
  const [acceptInvite, setAccInv]   = useState(true);
  const [bgMusic, setBgMusic]       = useState(soundEnabled);
  const [jackpotNotif, setJackpot]  = useState(true);
  const carouselRef    = useRef<HTMLDivElement>(null);
  const isDragging     = useRef(false);
  const dragStartX     = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDragged     = useRef(false);

  const { logout, token }  = useAuth();
  const { toast }   = useToast();
  const [, setLocation] = useLocation();
  const { data: user }        = useGetMe();
  const { data: balanceData } = useGetBalance();

  const balance  = balanceData?.balance ?? user?.balance ?? 0;
  const vipLevel = Math.min(9, Math.max(1, Math.floor(balance / 50000) + 1));
  const vip      = VIP_TIERS[vipLevel] ?? VIP_TIERS[1];
  const unread   = 3 - readMsgs.size;

  useEffect(() => {
    if (user?.id) {
      const s = localStorage.getItem(`avatar_${user.id}`);
      if (s) setAvatar(s);
      const p = localStorage.getItem(`preset_${user.id}`);
      if (p) setSelectedPreset(Number(p));
    }
  }, [user?.id]);

  const betHistory = useGetBetHistory({ request: { headers: { Authorization: `Bearer ${token}` } } });

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let lastX    = 0;
    let velX     = 0;
    let rafId    = 0;
    let prevTime = 0;

    const snapToNearest = () => {
      const children = Array.from(el.children) as HTMLElement[];
      if (!children.length) return;
      let best = children[0];
      let bestDist = Infinity;
      for (const c of children) {
        const dist = Math.abs(c.offsetLeft - el.scrollLeft - el.clientWidth * 0.06);
        if (dist < bestDist) { bestDist = dist; best = c; }
      }
      el.scrollTo({ left: best.offsetLeft - el.clientWidth * 0.06, behavior: "smooth" });
    };

    const stopAll = () => { cancelAnimationFrame(rafId); };

    const applyMomentum = () => {
      velX *= 0.88;
      if (Math.abs(velX) < 0.8) {
        stopAll();
        snapToNearest();
        return;
      }
      el.scrollLeft += velX;
      rafId = requestAnimationFrame(applyMomentum);
    };

    const onMouseDown = (e: MouseEvent) => {
      stopAll();
      isDragging.current     = true;
      hasDragged.current     = false;
      dragStartX.current     = e.pageX;
      dragScrollLeft.current = el.scrollLeft;
      lastX                  = e.pageX;
      prevTime               = performance.now();
      velX                   = 0;
      el.style.cursor        = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const now  = performance.now();
      const dt   = Math.max(now - prevTime, 1);
      velX       = (lastX - e.pageX) / dt * 14;
      lastX      = e.pageX;
      prevTime   = now;
      const walk = dragStartX.current - e.pageX;
      if (Math.abs(walk) > 5) hasDragged.current = true;
      el.scrollLeft = dragScrollLeft.current + walk;
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      el.style.cursor    = "grab";
      if (Math.abs(velX) < 1) { snapToNearest(); return; }
      rafId = requestAnimationFrame(applyMomentum);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAll();
      el.scrollLeft += (e.deltaY + e.deltaX) * 1.2;
      clearTimeout((onWheel as any)._t);
      (onWheel as any)._t = setTimeout(snapToNearest, 120);
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("wheel",     onWheel, { passive: false });
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);

    return () => {
      stopAll();
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("wheel",     onWheel);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup",   onMouseUp);
    };
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user?.id) return;
    const reader = new FileReader();
    reader.onload = () => {
      const d = reader.result as string;
      setAvatar(d);
      setSelectedPreset(null);
      localStorage.setItem(`avatar_${user.id}`, d);
      localStorage.removeItem(`preset_${user.id}`);
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const handleLogout = () => { logout(); setLocation("/"); };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("sound_enabled", String(next));
  };
  const handleVolume = (v: number) => {
    setVolume(v);
    localStorage.setItem("sound_volume", String(v));
  };
  const openSettings = () => { setSettingsTab("taikhoan"); setSettingsOpen(true); };
  const closeSettings = () => { setSettingsOpen(false); setOldPw(""); setNewPw(""); setConfirmPw(""); setPwError(""); setPwSuccess(false); setShowOldPw(false); setShowNewPw(false); setShowConfPw(false); };

  const handleChangePw = async () => {
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Mật khẩu xác nhận không khớp"); return; }
    if (newPw.length < 4)    { setPwError("Mật khẩu mới phải ít nhất 4 ký tự"); return; }
    setPwLoading(true);
    try {
      const token = localStorage.getItem("tai_xiu_token");
      const res = await fetch("/api/auth/change-password", {
        method:"POST", headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error ?? "Có lỗi xảy ra"); }
      else { setPwSuccess(true); setOldPw(""); setNewPw(""); setConfirmPw(""); }
    } catch { setPwError("Lỗi kết nối server"); }
    finally { setPwLoading(false); }
  };

  const showRotateOverlay = usePortraitPhone();

  return (
    <>
      <style>{`
        @keyframes dockGlow  { 0%,100%{box-shadow:0 8px 40px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.06),0 0 30px rgba(180,0,0,0.15)} 50%{box-shadow:0 8px 48px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.1),0 0 40px rgba(220,38,38,0.2)} }
        @keyframes balPulse  { 0%,100%{text-shadow:0 0 8px rgba(255,210,0,0.4)} 50%{text-shadow:0 0 16px rgba(255,210,0,0.8),0 0 30px rgba(255,180,0,0.4)} }
        @keyframes vipGlow   { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes floatUpDown {
          0%,100% { transform: translateX(-34%) translateY(calc(-50% + clamp(48px,6vh,75px))); }
          50%     { transform: translateX(-34%) translateY(calc(-50% + clamp(48px,6vh,75px) - 14px)); }
        }
        @keyframes promoGlow {
          0%,100% { filter: drop-shadow(0 10px 36px rgba(0,0,0,0.75)) drop-shadow(0 0 18px rgba(220,60,0,0.35)); }
          50%     { filter: drop-shadow(0 10px 36px rgba(0,0,0,0.75)) drop-shadow(0 0 38px rgba(255,100,0,0.65)) drop-shadow(0 0 60px rgba(255,60,0,0.3)); }
        }
        @keyframes borderShimmer {
          0%   { border-color: rgba(200,140,20,0.55); box-shadow: 0 0 6px rgba(200,140,20,0.2); }
          33%  { border-color: rgba(255,200,60,0.85); box-shadow: 0 0 14px rgba(255,200,60,0.5), inset 0 0 6px rgba(255,200,60,0.1); }
          66%  { border-color: rgba(180,100,0,0.6);  box-shadow: 0 0 8px rgba(180,100,0,0.3); }
          100% { border-color: rgba(200,140,20,0.55); box-shadow: 0 0 6px rgba(200,140,20,0.2); }
        }
        @keyframes avatarRing {
          0%,100% { box-shadow: 0 0 10px rgba(255,180,0,0.5), 0 0 20px rgba(255,100,0,0.2); }
          50%     { box-shadow: 0 0 22px rgba(255,220,0,0.9), 0 0 40px rgba(255,140,0,0.5); }
        }
        @keyframes dragonFire {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fireFlicker {
          0%,100% { opacity:1; text-shadow: 0 0 10px #ff4400, 0 0 20px #ff2200, 0 0 40px #ff6600; }
          25%     { opacity:0.9; text-shadow: 0 0 14px #ff6600, 0 0 28px #ff4400, 0 0 50px rgba(255,100,0,0.7); }
          75%     { opacity:1; text-shadow: 0 0 8px #ffaa00, 0 0 18px #ff6600, 0 0 36px rgba(255,140,0,0.6); }
        }
        @keyframes modalBgShift {
          0%   { background-position: 0% 0%; }
          50%  { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        @keyframes dragonCornerGlow {
          0%,100% { opacity:0.6; filter: blur(0px); }
          50%     { opacity:1;   filter: blur(1px); }
        }
        @keyframes rowFireBorder {
          0%,100% { border-color: rgba(255,255,255,0.07); }
          50%     { border-color: rgba(255,120,0,0.2); }
        }
        @keyframes iconFirePulse {
          0%,100% { box-shadow: 0 0 8px rgba(251,191,36,0.2); }
          50%     { box-shadow: 0 0 18px rgba(255,120,0,0.6), 0 0 32px rgba(255,60,0,0.3); }
        }
        @keyframes titleGlow {
          0%,100% { text-shadow: 0 0 24px rgba(255,180,0,0.8), 0 2px 4px rgba(0,0,0,0.9); }
          50%     { text-shadow: 0 0 36px rgba(255,220,0,1), 0 0 60px rgba(255,100,0,0.6), 0 2px 4px rgba(0,0,0,0.9); }
        }
        @keyframes cardFloat1 {
          0%,100% { transform: translateY(0px) rotate(-2deg); filter: drop-shadow(0 0 12px rgba(255,80,0,0.8)); }
          50%     { transform: translateY(-10px) rotate(1deg); filter: drop-shadow(0 0 24px rgba(255,120,0,1)); }
        }
        @keyframes cardFloat2 {
          0%,100% { transform: translateY(0px) rotate(2deg); filter: drop-shadow(0 0 12px rgba(0,200,80,0.7)); }
          50%     { transform: translateY(-8px) rotate(-1deg); filter: drop-shadow(0 0 24px rgba(0,255,100,0.9)); }
        }
        @keyframes particle1 { 0%{transform:translateY(0) translateX(0) scale(1);opacity:0.9} 100%{transform:translateY(-120px) translateX(8px) scale(0);opacity:0} }
        @keyframes particle2 { 0%{transform:translateY(0) translateX(0) scale(1);opacity:0.8} 100%{transform:translateY(-100px) translateX(-10px) scale(0);opacity:0} }
        @keyframes particle3 { 0%{transform:translateY(0) translateX(0) scale(0.8);opacity:0.7} 100%{transform:translateY(-140px) translateX(12px) scale(0);opacity:0} }
        @keyframes particle4 { 0%{transform:translateY(0) translateX(0) scale(1.1);opacity:0.9} 100%{transform:translateY(-90px) translateX(-6px) scale(0);opacity:0} }
        @keyframes particle5 { 0%{transform:translateY(0) translateX(0) scale(0.9);opacity:0.85} 100%{transform:translateY(-130px) translateX(15px) scale(0);opacity:0} }
        @keyframes embersFloat {
          0%   { transform:translateY(0) rotate(0deg); opacity:1; }
          100% { transform:translateY(-200px) rotate(720deg); opacity:0; }
        }
        @keyframes dragonBreath {
          0%,100% { opacity:0.15; transform: scaleX(1); }
          50%     { opacity:0.35; transform: scaleX(1.05); }
        }
        @keyframes diceShake {
          0%   { transform: translate(-2px,-3px) rotate(-4deg) scale(1.05); }
          20%  { transform: translate(2px,-1px) rotate(3deg) scale(1.08); }
          40%  { transform: translate(-1px,-4px) rotate(-2deg) scale(1.04); }
          60%  { transform: translate(3px,-2px) rotate(5deg) scale(1.07); }
          80%  { transform: translate(-2px,-1px) rotate(-3deg) scale(1.05); }
          100% { transform: translate(1px,-3px) rotate(2deg) scale(1.06); }
        }
        @keyframes diceLand {
          0%   { transform: scale(1.15) rotate(8deg); }
          50%  { transform: scale(0.96) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes diceToss {
          0%   { transform: translateY(0px) rotate(0deg) scale(1);    }
          18%  { transform: translateY(-22px) rotate(-6deg) scale(1.04); }
          35%  { transform: translateY(-32px) rotate(4deg) scale(1.07); }
          52%  { transform: translateY(-18px) rotate(-3deg) scale(1.04); }
          68%  { transform: translateY(-8px) rotate(2deg) scale(1.02);  }
          82%  { transform: translateY(-14px) rotate(-2deg) scale(1.03); }
          92%  { transform: translateY(-4px) rotate(1deg) scale(1.01);  }
          100% { transform: translateY(0px) rotate(0deg) scale(1);    }
        }
        @keyframes diceGlow {
          0%,100% { filter: drop-shadow(0 0 10px rgba(255,200,0,0.5)) drop-shadow(0 8px 24px rgba(0,0,0,0.8)); }
          40%     { filter: drop-shadow(0 0 28px rgba(255,220,0,1))   drop-shadow(0 0 50px rgba(255,160,0,0.7)) drop-shadow(0 8px 24px rgba(0,0,0,0.8)); }
          55%     { filter: drop-shadow(0 0 18px rgba(255,200,0,0.7)) drop-shadow(0 8px 24px rgba(0,0,0,0.8)); }
        }
        @keyframes cardShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .card-img-shimmer {
          background: linear-gradient(115deg, transparent 20%, rgba(255,230,150,0.12) 50%, transparent 80%);
          background-size: 220% 100%;
        }
        @keyframes floatEmoji {
          0%,100% { transform: translateY(0px) scale(1); }
          50%     { transform: translateY(-10px) scale(1.06); }
        }
      `}</style>

      {/* ── Rotate overlay for portrait phones (SunWin/Go88 style) ── */}
      {showRotateOverlay && <RotateOverlay />}

      {/* ── Full-screen background ── */}
      <div style={{ position:"fixed", inset:0, overflow:"hidden", backgroundImage:`url(${gameBg2})`, backgroundSize:"cover", backgroundPosition:"center", backgroundRepeat:"no-repeat" }}>

        {/* ════════════════════════════════════════
            TOP HEADER
            ════════════════════════════════════════ */}
        <div style={{
          display:"flex", alignItems:"center",
          padding:"clamp(8px,1.2vh,14px) clamp(10px,1.5vw,20px)",
          gap:"clamp(8px,1.2vw,16px)",
          flexShrink:0,
        }}>

          {/* ── Profile card (click → account modal) ── */}
          <div onClick={() => setProfileOpen(true)} style={{
            display:"flex", alignItems:"center", gap:10,
            background:"rgba(0,0,0,0.55)",
            border:"1px solid rgba(200,50,30,0.5)",
            borderRadius:12,
            padding:"7px 12px 7px 8px",
            backdropFilter:"blur(8px)",
            flexShrink:0, cursor:"pointer",
            boxShadow:"0 2px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            {/* Avatar */}
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{
                width:42, height:42, borderRadius:"50%",
                border:`2.5px solid ${vip.ring}`,
                overflow:"hidden",
                background:"radial-gradient(circle at 35% 35%,#5a0000,#100000)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 0 10px ${vip.glow}55`,
              }}>
                {avatar
                  ? <img src={avatar} alt="avt" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span style={{ color:"#ffd700", fontWeight:900, fontSize:20, fontFamily:"serif", textShadow:"0 0 8px #ffd700" }}>
                      {(user?.displayName ?? user?.username ?? "H")[0].toUpperCase()}
                    </span>
                }
              </div>
              {/* VIP badge */}
              <div style={{
                position:"absolute", bottom:-3, left:"50%", transform:"translateX(-50%)",
                background: vip.bg, borderRadius:4, padding:"1px 5px",
                boxShadow:`0 0 6px ${vip.glow}`,
                whiteSpace:"nowrap",
              }}>
                <span style={{ color:vip.text, fontSize:7, fontWeight:900, lineHeight:1 }}>{vip.label}</span>
              </div>
            </div>

            {/* Info */}
            <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:0 }}>
              {/* Name */}
              <span style={{
                color:"#fff", fontWeight:800, fontSize:13,
                letterSpacing:0.3, lineHeight:1,
                textShadow:"0 1px 6px rgba(0,0,0,0.9)",
                maxWidth:110, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
                {user?.displayName ?? user?.username ?? "---"}
              </span>
              {/* ID */}
              <span style={{ color:"rgba(255,160,130,0.75)", fontSize:10, fontWeight:600, lineHeight:1 }}>
                ID: {String(user?.id ?? "").padStart(8, "0")}
              </span>
              {/* Balance row */}
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:11 }}>🪙</span>
                <span style={{
                  color:"#ffd700", fontWeight:900, fontSize:12,
                  fontFamily:"monospace", letterSpacing:0.5,
                  textShadow:"0 0 8px rgba(255,215,0,0.5)",
                }}>
                  {balance.toLocaleString("vi-VN")}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); setDepositOpen(true); }}
                  style={{
                    width:16, height:16, borderRadius:"50%",
                    background:"linear-gradient(135deg,#16a34a,#15803d)",
                    border:"1px solid rgba(74,222,128,0.55)",
                    color:"white", fontWeight:900, fontSize:11, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:"0 0 6px rgba(22,163,74,0.55)", lineHeight:1, flexShrink:0,
                  }}
                >+</button>
              </div>
            </div>
          </div>

          {/* ── Spacer ── */}
          <div style={{ flex:1, minWidth:0 }} />

          {/* ── Top nav: image bar with click zones ── */}
          <div style={{ position:"relative", flexShrink:0, display:"flex", alignItems:"center" }}>
            <img
              src={topNavImg}
              alt="menu"
              style={{ height:"clamp(44px,5.5vh,62px)", objectFit:"contain", display:"block", pointerEvents:"none", userSelect:"none" }}
            />
            {/* Invisible click zones over each icon */}
            <div style={{ position:"absolute", inset:0, display:"flex" }}>
              <button style={{ flex:1, background:"none", border:"none", cursor:"pointer" }} title="Sự Kiện"  onClick={() => setMissionsOpen(true)} />
              <button style={{ flex:1, background:"none", border:"none", cursor:"pointer" }} title="Nạp Tiền" onClick={() => setDepositOpen(true)} />
              <button style={{ flex:1, background:"none", border:"none", cursor:"pointer" }} title="Đại Lý"   onClick={() => toast({ title:"🤝 Đại Lý", description:"Liên hệ Zalo/Telegram để đăng ký làm đại lý!" })} />
              <button style={{ flex:1, background:"none", border:"none", cursor:"pointer" }} title="Vòng Quay" onClick={() => toast({ title:"🎡 Vòng Quay", description:"Tính năng vòng quay đang được phát triển!" })} />
              <button style={{ flex:1, background:"none", border:"none", cursor:"pointer" }} title="Giftcode"  onClick={() => { setGiftcodeOpen(true); setGiftcodeVal(""); setGiftcodeStatus("idle"); }} />
            </div>
          </div>
        </div>

        {/* ── Thẻ cô gái — cố định, không thể di chuyển ── */}
        <img
          src={promoCard}
          alt="promo"
          draggable={false}
          style={{
            position:"absolute",
            left:0,
            top:"50%",
            transform:"translateY(-50%)",
            height:"clamp(220px,68vh,560px)",
            objectFit:"contain",
            pointerEvents:"none",
            userSelect:"none",
            WebkitUserDrag:"none",
            zIndex:10,
            animation:"floatUpDown 3.6s ease-in-out infinite, promoGlow 3.6s ease-in-out infinite",
          } as React.CSSProperties}
        />

        {/* ── Game Carousel ── */}
        <div style={{
          position:"absolute",
          left:"clamp(150px,20vw,300px)",
          right:0,
          top:"50%",
          transform:"translateY(calc(-50% + 57px))",
          zIndex:11,
          pointerEvents:"auto",
          height:`calc(${CARD_H} + 28px)`,
          maskImage:"linear-gradient(to right, transparent 0%, black 6%, black 90%, transparent 100%)",
          WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 6%, black 90%, transparent 100%)",
        }}>
          <style>{`
            .game-carousel::-webkit-scrollbar { display: none; }
            .game-card-item { transition: transform 0.2s ease; }
            .game-card-item:hover { transform: scale(1.06) !important; }
          `}</style>
          <div
            ref={carouselRef}
            className="game-carousel"
            style={{
              display:"flex",
              flexDirection:"row",
              alignItems:"center",
              gap:"3vh",
              overflowX:"auto",
              overflowY:"visible",
              height:"100%",
              paddingLeft:"6%",
              paddingRight:"12%",
              scrollbarWidth:"none",
              cursor:"grab",
              userSelect:"none",
            }}
          >
            {GAMES.map((g) => (
              <div
                key={g.name}
                className="game-card-item"
                onClick={() => { if (hasDragged.current) return; toast({ title:`${g.emoji} ${g.name}`, description:`Đang vào phòng ${g.name}...` }); }}
                style={{ flexShrink:0, scrollSnapAlign:"start", cursor:"pointer", position:"relative" }}
              >
                <ThemedGameCard g={g} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Center spacer ── */}
        <div style={{ flex:1, minHeight:0 }} />

      {/* ════════════════════════════════════════
          BOTTOM BAR — full-width, matches reference
          ════════════════════════════════════════ */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        zIndex:1000,
        display:"flex", alignItems:"flex-end",
        padding:`0 calc(clamp(120px,13vw,180px) + clamp(4px,0.6vw,10px)) clamp(6px,1vh,12px)`,
        gap:"clamp(3px,0.4vw,7px)",
        pointerEvents:"none",
      }}>

        {/* ── Main bar — image with click zones ── */}
        <div style={{
          pointerEvents:"auto",
          flex:1, minWidth:0,
          position:"relative",
          display:"flex", alignItems:"flex-end", justifyContent:"center",
        }}>
          <img
            src={bottomBarImg}
            alt="bottom bar"
            style={{ width:"100%", height:"clamp(110px,14vh,170px)", objectFit:"fill", display:"block", pointerEvents:"none", userSelect:"none" }}
          />
          {/* Invisible click zones — only bottom 55% of image (actual icon strip, not dragon deco above) */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"55%" }}>
            <button style={{ position:"absolute", left:"0%",  width:"14%", height:"100%", background:"none", border:"none", cursor:"pointer" }} title="Rút Tiền"   onClick={() => { setDepositInitTab("rut"); setDepositOpen(true); }} />
            <button style={{ position:"absolute", left:"14%", width:"16%", height:"100%", background:"none", border:"none", cursor:"pointer" }} title="Thông Báo" onClick={() => setNotifOpen(v => !v)} />
            <button style={{ position:"absolute", left:"30%", width:"40%", height:"100%", background:"none", border:"none", cursor:"pointer" }} title="Nạp Tiền" onClick={() => setDepositOpen(true)} />
            <button style={{ position:"absolute", left:"70%", width:"15%", height:"100%", background:"none", border:"none", cursor:"pointer" }} title="Hỗ Trợ" onClick={() => toast({ title:"💬 Hỗ Trợ 24/7", description:"Liên hệ Zalo: 0909 xxx xxx | Telegram: @haru88support" })} />
            <button style={{ position:"absolute", left:"85%", width:"15%", height:"100%", background:"none", border:"none", cursor:"pointer" }} title="Cài Đặt"   onClick={openSettings} />
          </div>
        </div>

      </div>

      {/* ── Notification Panel ── */}
      {notifOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={() => setNotifOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            position:"absolute", bottom:"clamp(110px,16vh,160px)", left:"50%", transform:"translateX(-50%)",
            width:"clamp(290px,90vw,360px)", zIndex:9999,
            background:"linear-gradient(160deg,rgba(22,0,0,0.97),rgba(12,0,0,0.96))",
            border:"1px solid rgba(200,40,40,0.35)", borderRadius:16,
            overflow:"hidden", boxShadow:"0 12px 48px rgba(0,0,0,0.9)",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"rgba(160,0,0,0.25)", borderBottom:"1px solid rgba(200,0,0,0.18)" }}>
              <span style={{ color:"white", fontWeight:800, fontSize:14, letterSpacing:1 }}>🔔 THÔNG BÁO</span>
              <button onClick={() => setNotifOpen(false)} style={{ background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:22 }}>×</button>
            </div>
            <div style={{ overflowY:"auto", maxHeight:"clamp(200px,40vh,320px)", padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { id:0, icon:"🎁", title:"Chào mừng thành viên mới!", body:"Tài khoản đã được kích hoạt. Nạp tiền ngay để nhận ưu đãi 100%!", time:"5 phút trước" },
                { id:1, icon:"💰", title:"Nạp tiền thành công",       body:"Giao dịch nạp tiền đã được xác nhận. Số dư đã cộng vào tài khoản.", time:"1 giờ trước" },
                { id:2, icon:"🏆", title:"Chúc mừng bạn thắng!",     body:"Bạn vào Top 10 bảng xếp hạng tuần này. Tiếp tục cược để leo hạng!", time:"2 giờ trước" },
              ].map(({ id, icon, title, body, time }) => {
                const isRead = readMsgs.has(id);
                return (
                  <div key={id} onClick={() => setReadMsgs(p => new Set([...p, id]))}
                    style={{ background:isRead?"rgba(255,255,255,0.02)":"rgba(200,0,0,0.08)", border:`1px solid ${isRead?"rgba(255,255,255,0.06)":"rgba(200,0,0,0.25)"}`, borderRadius:10, padding:"10px 12px", cursor:"pointer", display:"flex", gap:10 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ color:isRead?"#aaa":"white", fontWeight:isRead?600:800, fontSize:12 }}>{title}</span>
                        {!isRead && <div style={{ width:7, height:7, borderRadius:"50%", background:"#ef4444", flexShrink:0 }} />}
                      </div>
                      <p style={{ color:"#888", fontSize:11, lineHeight:1.5, margin:"0 0 3px" }}>{body}</p>
                      <span style={{ color:"#555", fontSize:10 }}>{time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* ── Settings Modal (KCLUB style 4-tab) ── */}
      {settingsOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={closeSettings}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"clamp(340px,90vw,520px)",
            background:"linear-gradient(160deg,#1a0d00,#0f0800,#1a0d00)",
            border:"2px solid rgba(180,120,0,0.6)",
            borderRadius:18,
            boxShadow:"0 0 0 1px rgba(255,200,0,0.08), 0 32px 80px rgba(0,0,0,0.97), 0 0 40px rgba(180,120,0,0.2)",
            overflow:"hidden",
          }}>
            {/* Header */}
            <div style={{ position:"relative", padding:"14px 20px", background:"linear-gradient(135deg,rgba(180,120,0,0.25),rgba(100,60,0,0.2))", borderBottom:"1.5px solid rgba(180,120,0,0.35)", textAlign:"center" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(255,200,0,0.8),rgba(255,160,0,0.9),rgba(255,200,0,0.8),transparent)" }} />
              <span style={{ color:"#f5d060", fontWeight:900, fontSize:17, letterSpacing:2, textShadow:"0 0 20px rgba(255,200,0,0.5)" }}>CÀI ĐẶT</span>
              <button onClick={closeSettings} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"linear-gradient(135deg,#7f1d1d,#450a0a)", border:"1.5px solid rgba(239,68,68,0.5)", borderRadius:"50%", width:28, height:28, color:"#fff", fontWeight:900, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", borderBottom:"1.5px solid rgba(180,120,0,0.25)", background:"rgba(0,0,0,0.3)" }}>
              {([
                { key:"taikhoan", label:"TÀI KHOẢN" },
                { key:"matkhau",  label:"MẬT KHẨU"  },
                { key:"baomat",   label:"BẢO MẬT"   },
                { key:"lichsu",   label:"LỊCH SỬ CƯỢC" },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setSettingsTab(tab.key)} style={{
                  flex:1, padding:"11px 4px", border:"none", cursor:"pointer",
                  fontSize:"clamp(9px,1vw,11px)", fontWeight:800, letterSpacing:"0.5px",
                  background: settingsTab===tab.key ? "rgba(180,120,0,0.25)" : "transparent",
                  color: settingsTab===tab.key ? "#f5d060" : "rgba(200,160,80,0.45)",
                  borderBottom: settingsTab===tab.key ? "2.5px solid #f5d060" : "2.5px solid transparent",
                  transition:"all 0.15s",
                }}>{tab.label}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ minHeight:280, maxHeight:"60vh", overflowY:"auto" }}>

              {/* ── TÀI KHOẢN ── */}
              {settingsTab === "taikhoan" && (
                <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:11 }}>
                  {([
                    { label:"Tự động sẵn sàng", value:autoReady,    set:setAutoReady },
                    { label:"Hiệu ứng âm thanh", value:effects,      set:setEffects   },
                    { label:"Nhận lời mời",       value:acceptInvite, set:setAccInv    },
                    { label:"Nhạc nền",           value:bgMusic,      set:(v: boolean) => { setBgMusic(v); setSoundEnabled(v); } },
                    { label:"Thông báo Hủ",       value:jackpotNotif, set:setJackpot  },
                  ]).map((t, i, arr) => (
                    <div key={t.label} onClick={() => t.set(!t.value)} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      background:"rgba(255,200,0,0.04)", border:"1px solid rgba(255,200,0,0.1)",
                      borderRadius:12, padding:"12px 16px", cursor:"pointer", gap:10,
                    }}>
                      <span style={{ color:"rgba(255,230,180,0.9)", fontSize:13, fontWeight:600 }}>{t.label}</span>
                      <div style={{ width:46, height:25, borderRadius:13, flexShrink:0, position:"relative", transition:"all 0.2s",
                        background: t.value ? "linear-gradient(135deg,#b45309,#d97706)" : "rgba(255,255,255,0.12)",
                        border: t.value ? "1px solid rgba(245,158,11,0.6)" : "1px solid rgba(255,255,255,0.15)",
                        boxShadow: t.value ? "0 0 12px rgba(217,119,6,0.5)" : "none",
                      }}>
                        <div style={{ position:"absolute", top:3, width:17, height:17, borderRadius:"50%", background:"white", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.4)", left: t.value ? 25 : 3 }} />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { closeSettings(); handleLogout(); }} style={{ marginTop:6, background:"rgba(220,38,38,0.12)", border:"1px solid rgba(220,38,38,0.4)", borderRadius:12, padding:"13px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, width:"100%" }}>
                    <span style={{ fontSize:18 }}>🚪</span>
                    <span style={{ color:"#f87171", fontWeight:700, fontSize:13 }}>Đăng Xuất</span>
                  </button>
                  <div style={{ textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:11 }}>Version 1.0.0</div>
                </div>
              )}

              {/* ── MẬT KHẨU ── */}
              {settingsTab === "matkhau" && (
                <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
                  {pwSuccess ? (
                    <div style={{ textAlign:"center", padding:"30px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                      <div style={{ fontSize:52 }}>✅</div>
                      <div style={{ color:"#4ade80", fontWeight:900, fontSize:16 }}>Đổi mật khẩu thành công!</div>
                      <button onClick={() => { setSettingsTab("taikhoan"); setPwSuccess(false); }} style={{ padding:"10px 28px", borderRadius:10, background:"linear-gradient(135deg,#b45309,#d97706)", border:"none", color:"white", fontWeight:800, fontSize:13, cursor:"pointer" }}>Xong</button>
                    </div>
                  ) : (
                    <>
                      {([
                        { label:"Nhập mật khẩu hiện tại", value:oldPw, setter:setOldPw, show:showOldPw, setShow:setShowOldPw },
                        { label:"Nhập mật khẩu mới",      value:newPw, setter:setNewPw, show:showNewPw, setShow:setShowNewPw },
                        { label:"Xác nhận mật khẩu mới",  value:confirmPw, setter:setConfirmPw, show:showConfPw, setShow:setShowConfPw },
                      ] as const).map(f => (
                        <div key={f.label}>
                          <div style={{ position:"relative" }}>
                            <input
                              type={f.show ? "text" : "password"}
                              value={f.value}
                              onChange={e => { f.setter(e.target.value as any); setPwError(""); }}
                              placeholder={f.label}
                              style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(180,120,0,0.3)", borderRadius:10, padding:"13px 44px 13px 16px", color:"white", fontSize:13, outline:"none", fontFamily:"inherit" }}
                            />
                            <button type="button" onClick={() => f.setShow(!f.show)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(200,160,80,0.7)", padding:0, display:"flex", alignItems:"center" }}>
                              {f.show
                                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              }
                            </button>
                          </div>
                        </div>
                      ))}
                      {pwError && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, padding:"8px 12px", color:"#fca5a5", fontSize:12, fontWeight:600 }}>⚠️ {pwError}</div>}
                      <button onClick={handleChangePw} disabled={pwLoading || !oldPw || !newPw || !confirmPw}
                        style={{ padding:"14px", borderRadius:12, background: (!oldPw||!newPw||!confirmPw||pwLoading) ? "rgba(180,120,0,0.2)" : "linear-gradient(135deg,#b45309,#92400e)", color:"white", fontWeight:900, fontSize:14, letterSpacing:1, border:`1px solid ${(!oldPw||!newPw||!confirmPw||pwLoading) ? "rgba(180,120,0,0.2)" : "rgba(245,158,11,0.5)"}`, cursor: (!oldPw||!newPw||!confirmPw||pwLoading) ? "not-allowed" : "pointer", transition:"all 0.2s", boxShadow: (!oldPw||!newPw||!confirmPw||pwLoading) ? "none" : "0 0 20px rgba(180,120,0,0.4)" }}>
                        {pwLoading ? "Đang xử lý..." : "XÁC NHẬN"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── BẢO MẬT ── */}
              {settingsTab === "baomat" && (
                <div style={{ padding:"24px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
                  {/* Telegram OTP badge */}
                  <div style={{ background:"linear-gradient(135deg,rgba(3,155,229,0.18),rgba(1,87,155,0.12))", border:"1.5px solid rgba(3,155,229,0.45)", borderRadius:14, padding:"14px 22px", display:"flex", alignItems:"center", gap:12, width:"100%", boxSizing:"border-box" }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:"linear-gradient(135deg,#0288d1,#01579b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </div>
                    <div>
                      <div style={{ color:"#4fc3f7", fontWeight:900, fontSize:13, letterSpacing:0.5 }}>TELEGRAM OTP</div>
                      <div style={{ color:"rgba(100,200,255,0.6)", fontSize:11, marginTop:2 }}>Xác thực 2 bước qua Telegram</div>
                    </div>
                  </div>

                  {/* Illustration */}
                  <div style={{ textAlign:"center", padding:"6px 0" }}>
                    <div style={{ fontSize:52, marginBottom:10 }}>
                      <svg viewBox="0 0 48 48" width="56" height="56" style={{ display:"inline-block" }}><circle cx="24" cy="24" r="24" fill="#0288d1"/><path d="M11.944 12A12 12 0 0 0 0 24a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 12a12 12 0 0 0-.056 0zm4.962 3.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="white" transform="translate(12,12) scale(1)"/></svg>
                    </div>
                    <div style={{ color:"rgba(150,220,255,0.9)", fontWeight:700, fontSize:15, lineHeight:1.6, textAlign:"center" }}>
                      Kết nối Telegram<br/>để bảo vệ Tài Khoản của bạn!
                    </div>
                    <div style={{ color:"rgba(100,180,220,0.55)", fontSize:11, marginTop:6, lineHeight:1.5 }}>
                      Mỗi lần đăng nhập sẽ gửi mã OTP<br/>qua bot Telegram của bạn
                    </div>
                  </div>

                  {/* Username input */}
                  <div style={{ width:"100%", boxSizing:"border-box" }}>
                    <label style={{ color:"rgba(100,200,255,0.7)", fontSize:11, fontWeight:700, display:"block", marginBottom:6, letterSpacing:0.5 }}>USERNAME TELEGRAM</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(100,200,255,0.5)", fontSize:14, fontWeight:700, pointerEvents:"none" }}>@</span>
                      <input
                        placeholder="username của bạn"
                        style={{ width:"100%", boxSizing:"border-box", background:"rgba(3,155,229,0.08)", border:"1.5px solid rgba(3,155,229,0.3)", borderRadius:10, padding:"11px 14px 11px 28px", color:"white", fontSize:13, outline:"none" }}
                      />
                    </div>
                  </div>

                  {/* Activate button */}
                  <button
                    style={{ width:"100%", padding:"14px", borderRadius:12, background:"linear-gradient(135deg,#0288d1,#01579b)", border:"1.5px solid rgba(3,155,229,0.5)", color:"white", fontWeight:900, fontSize:15, letterSpacing:1.5, cursor:"pointer", boxShadow:"0 0 24px rgba(2,136,209,0.5), 0 4px 0 rgba(1,40,80,0.8), inset 0 1px 0 rgba(100,200,255,0.25)", transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    KÍCH HOẠT TELEGRAM OTP
                  </button>

                  <div style={{ color:"rgba(255,255,255,0.22)", fontSize:11, textAlign:"center" }}>
                    Tài khoản bị khóa đều là những tài khoản<br/>có hành vi gian lận, được kiểm duyệt qua nhiều cấp
                  </div>
                </div>
              )}

              {/* ── LỊCH SỬ CƯỢC ── */}
              {settingsTab === "lichsu" && (
                <div style={{ padding:"12px", minHeight:260 }}>
                  {betHistory.isLoading ? (
                    <div style={{ textAlign:"center", padding:"50px 0", color:"rgba(200,160,80,0.5)", fontSize:14 }}>Đang tải...</div>
                  ) : !betHistory.data?.length ? (
                    <div style={{ textAlign:"center", padding:"50px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                      <div style={{ fontSize:44, opacity:0.5 }}>🎲</div>
                      <div style={{ color:"rgba(200,160,80,0.5)", fontSize:13, fontWeight:600 }}>Chưa có lịch sử cược</div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:340, overflowY:"auto" }}>
                      {betHistory.data.map((b: any) => (
                        <div key={b.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,200,0,0.05)", border:"1px solid rgba(180,120,0,0.2)", borderRadius:10, padding:"10px 14px" }}>
                          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                            <span style={{ color:"rgba(255,230,180,0.9)", fontSize:13, fontWeight:700 }}>{b.choice === "tai" ? "🎯 TÀI" : "🎲 XỈU"}</span>
                            <span style={{ color:"rgba(150,120,70,0.7)", fontSize:11 }}>{new Date(b.createdAt).toLocaleString("vi-VN")}</span>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                            <span style={{ color:"rgba(200,160,80,0.7)", fontSize:12 }}>Cược: {b.amount?.toLocaleString("vi-VN")}đ</span>
                            <span style={{ color: b.won ? "#4ade80" : "#f87171", fontWeight:900, fontSize:13 }}>{b.won ? `+${b.payout?.toLocaleString("vi-VN")}đ` : `-${b.amount?.toLocaleString("vi-VN")}đ`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── NHIỆM VỤ Modal ── */}
      {missionsOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setMissionsOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"clamp(340px,90vw,520px)",
            background:"linear-gradient(160deg,#15000a,#0d000a,#1a0010)",
            border:"2px solid rgba(200,100,0,0.55)", borderRadius:18,
            overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.97), 0 0 40px rgba(160,40,0,0.15)",
          }}>
            {/* Header */}
            <div style={{ position:"relative", padding:"14px 20px 12px", background:"linear-gradient(135deg,rgba(180,60,0,0.4),rgba(100,20,0,0.4))", borderBottom:"1.5px solid rgba(200,100,0,0.35)", textAlign:"center" }}>
              <span style={{ color:"#fff", fontWeight:900, fontSize:17, letterSpacing:2, textShadow:"0 0 20px rgba(255,160,0,0.6)" }}>NHIỆM VỤ</span>
              <button onClick={() => setMissionsOpen(false)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"linear-gradient(135deg,#dc2626,#7f1d1d)", border:"none", borderRadius:"50%", width:26, height:26, color:"#fff", fontWeight:900, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>
            {/* Tabs */}
            <div style={{ display:"flex", borderBottom:"1.5px solid rgba(200,100,0,0.25)" }}>
              {(["daily","newbie"] as const).map(t => (
                <button key={t} onClick={() => setMissionTab(t)} style={{
                  flex:1, padding:"11px", border:"none", cursor:"pointer", fontSize:13, fontWeight:800, letterSpacing:1,
                  background: missionTab===t ? "rgba(180,60,0,0.3)" : "transparent",
                  color: missionTab===t ? "#ffcc00" : "rgba(255,200,100,0.45)",
                  borderBottom: missionTab===t ? "2px solid #ffcc00" : "2px solid transparent",
                  transition:"all 0.15s",
                }}>{t==="daily" ? "HÀNG NGÀY" : "TÂN THỦ"}</button>
              ))}
            </div>
            {/* Mission list */}
            <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10, maxHeight:360, overflowY:"auto" }}>
              {(missionTab === "daily" ? [
                { icon:"🃏", title:"THƯỞNG ĐẶT CƯỢC HÀNG NGÀY", desc:"Đặt cược tổng cộng 500,000đ trong ngày", current:0, goal:500_000, reward:10_000, unit:"đ" },
                { icon:"🎯", title:"THƯỞNG THẮNG LIÊN TIẾP",    desc:"Thắng 5 ván liên tiếp trong ngày",       current:0, goal:5,       reward:15_000, unit:" ván" },
                { icon:"💰", title:"THƯỞNG NẠP HÀNG NGÀY",      desc:"Nạp tiền ít nhất 1 lần trong ngày",      current:0, goal:1,       reward:5_000,  unit:" lần" },
              ] : [
                { icon:"🃏", title:"THƯỞNG NẠP THẺ CÀO",  desc:"Tổng nạp thành công ít nhất 500,000đ bằng Thẻ Cào",  current:0, goal:500_000,   reward:20_000, unit:"đ" },
                { icon:"🏦", title:"THƯỞNG NẠP NGÂN HÀNG",desc:"Tổng nạp thành công ít nhất 500,000đ qua Ngân Hàng", current:0, goal:500_000,   reward:20_000, unit:"đ" },
                { icon:"💎", title:"THƯỞNG NẠP TIỀN ẢO",  desc:"Tổng nạp thành công ít nhất 1,000,000đ bằng tiền ảo",current:0, goal:1_000_000, reward:50_000, unit:"đ" },
              ]).map(m => (
                <div key={m.title} style={{
                  background:"rgba(0,0,0,0.3)", border:"1.5px solid rgba(200,100,0,0.25)", borderRadius:12,
                  padding:"12px 14px", display:"flex", alignItems:"center", gap:12,
                }}>
                  <div style={{ width:52, height:52, borderRadius:10, background:"linear-gradient(135deg,rgba(180,60,0,0.5),rgba(80,20,0,0.5))", border:"1px solid rgba(200,100,0,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>{m.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"#fff", fontWeight:800, fontSize:12, marginBottom:2 }}>{m.title}</div>
                    <div style={{ color:"rgba(255,200,100,0.55)", fontSize:11, marginBottom:6, lineHeight:1.3 }}>{m.desc}</div>
                    {/* Progress bar */}
                    <div style={{ height:5, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${Math.min(100,(m.current/m.goal)*100)}%`, height:"100%", background:"linear-gradient(90deg,#c41c00,#ff4422)", borderRadius:3 }} />
                    </div>
                    <div style={{ color:"rgba(255,255,255,0.35)", fontSize:10, marginTop:3 }}>{m.current.toLocaleString("vi-VN")} / {m.goal.toLocaleString("vi-VN")}{m.unit}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ fontSize:14 }}>🪙</span>
                      <span style={{ color:"#ffcc00", fontWeight:800, fontSize:12 }}>{m.reward.toLocaleString()}</span>
                    </div>
                    <button onClick={() => toast({ title:"⚔️ Nhiệm vụ", description:"Hãy hoàn thành nhiệm vụ để nhận thưởng!" })} style={{
                      background:"linear-gradient(135deg,#c8920a,#7a5008)", border:"none", borderRadius:8,
                      padding:"6px 16px", color:"#fff", fontWeight:800, fontSize:12, cursor:"pointer",
                      boxShadow:"0 2px 0 rgba(0,0,0,0.5)",
                    }}>LÀM</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Game Wheel Modal ── */}
      {gameWheelOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setGameWheelOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ position:"relative", width:360, height:360 }}>
            {/* Wheel items */}
            {[
              { icon:"🎲", name:"Tài Xỉu",      angle:0   },
              { icon:"💰", name:"Money",         angle:40  },
              { icon:"🔢", name:"Tài Xỉu MD5",   angle:80  },
              { icon:"🍣", name:"Mini Sushi",    angle:120 },
              { icon:"🃏", name:"Mini Poker",    angle:160 },
              { icon:"♠️", name:"Baccarat Mini", angle:200 },
              { icon:"🎯", name:"Bắn Vòng Nước", angle:240 },
              { icon:"💼", name:"Cờ Tỷ Phú",     angle:280 },
              { icon:"🐉", name:"Rồng & Hổ",     angle:320 },
            ].map(item => {
              const rad = (item.angle - 90) * Math.PI / 180;
              const r = 140;
              const x = 180 + r * Math.cos(rad);
              const y = 180 + r * Math.sin(rad);
              return (
                <div key={item.name} onClick={() => { setGameWheelOpen(false); toast({ title:`🎮 ${item.name}`, description:"Trò chơi đang được phát triển. Vui lòng thử Tài Xỉu!" }); }} style={{
                  position:"absolute", transform:"translate(-50%,-50%)",
                  left:x, top:y,
                  width:64, height:64, borderRadius:"50%",
                  background:"linear-gradient(135deg,rgba(40,0,0,0.95),rgba(20,0,0,0.95))",
                  border:"2px solid rgba(220,100,0,0.6)",
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  cursor:"pointer", gap:2,
                  boxShadow:"0 4px 16px rgba(0,0,0,0.8), 0 0 12px rgba(200,60,0,0.3)",
                  transition:"all 0.15s",
                }}>
                  <span style={{ fontSize:22, lineHeight:1 }}>{item.icon}</span>
                  <span style={{ color:"rgba(255,220,120,0.9)", fontSize:8, fontWeight:700, textAlign:"center", lineHeight:1.2, maxWidth:56, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", padding:"0 4px" }}>{item.name}</span>
                </div>
              );
            })}
            {/* Center button */}
            <div style={{
              position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)",
              width:90, height:90, borderRadius:"50%",
              background:"linear-gradient(135deg,#c41c00,#7f0000,#c41c00)",
              border:"3px solid rgba(255,150,50,0.7)",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              boxShadow:"0 0 30px rgba(200,60,0,0.6), 0 0 60px rgba(200,60,0,0.2), inset 0 2px 4px rgba(255,200,0,0.2)",
              zIndex:2,
            }}>
              <span style={{ fontSize:30, lineHeight:1 }}>🐟</span>
              <span style={{ color:"#ffd700", fontSize:9, fontWeight:900, letterSpacing:0.5 }}>MINI GAME</span>
            </div>
            {/* Close hint */}
            <div style={{ position:"absolute", bottom:-40, left:"50%", transform:"translateX(-50%)", color:"rgba(255,255,255,0.3)", fontSize:11, whiteSpace:"nowrap" }}>Nhấn ra ngoài để đóng</div>
          </div>
        </div>
      )}

      {/* ── Profile / Account Info Modal ── */}
      {profileOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
          onClick={() => setProfileOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"clamp(340px,92vw,680px)",
            background:"linear-gradient(160deg,#1a0200,#0d0100,#1f0500,#0a0100)",
            backgroundSize:"300% 300%",
            animation:"modalBgShift 6s ease infinite",
            border:"1.5px solid rgba(220,100,0,0.7)",
            borderRadius:18,
            boxShadow:"0 0 0 1px rgba(255,160,0,0.15), 0 32px 100px rgba(0,0,0,0.97), 0 0 60px rgba(255,80,0,0.25), 0 0 120px rgba(200,40,0,0.15), inset 0 1px 0 rgba(255,200,0,0.15)",
            overflow:"hidden",
            position:"relative",
          }}>

            {/* ── Real dragon images — left & right ── */}
            <img src="/dragon-left.png" alt="" style={{
              position:"absolute", left:-10, top:-10,
              height:"clamp(120px,20vh,180px)",
              objectFit:"contain", pointerEvents:"none", zIndex:2,
              animation:"dragonCornerGlow 2.5s ease-in-out infinite",
              filter:"drop-shadow(0 0 16px rgba(255,80,0,0.9)) drop-shadow(0 0 32px rgba(255,40,0,0.5))",
              transform:"scaleX(1) rotate(-8deg)",
            }} />
            <img src="/dragon-right.png" alt="" style={{
              position:"absolute", right:-10, top:-10,
              height:"clamp(120px,20vh,180px)",
              objectFit:"contain", pointerEvents:"none", zIndex:2,
              animation:"dragonCornerGlow 2.5s ease-in-out infinite 1.2s",
              filter:"drop-shadow(0 0 16px rgba(255,80,0,0.9)) drop-shadow(0 0 32px rgba(255,40,0,0.5))",
              transform:"scaleX(-1) rotate(-8deg)",
            }} />

            {/* ── Dragon breath glow overlay ── */}
            <div style={{
              position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
              background:"radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,80,0,0.18) 0%, transparent 70%)",
              animation:"dragonBreath 3s ease-in-out infinite",
            }} />

            {/* ── Fire particles bottom of modal ── */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:0, overflow:"visible", pointerEvents:"none", zIndex:3 }}>
              {[
                { left:"12%",  size:6,  color:"#ff4400", anim:"particle1", dur:"1.8s", delay:"0s" },
                { left:"22%",  size:8,  color:"#ff6600", anim:"particle2", dur:"2.1s", delay:"0.3s" },
                { left:"35%",  size:5,  color:"#ffaa00", anim:"particle3", dur:"1.6s", delay:"0.7s" },
                { left:"48%",  size:9,  color:"#ff3300", anim:"particle4", dur:"2.4s", delay:"0.1s" },
                { left:"60%",  size:6,  color:"#ff8800", anim:"particle5", dur:"1.9s", delay:"0.5s" },
                { left:"73%",  size:7,  color:"#ff4400", anim:"particle1", dur:"2.2s", delay:"0.9s" },
                { left:"85%",  size:5,  color:"#ffcc00", anim:"particle3", dur:"1.7s", delay:"0.4s" },
                { left:"8%",   size:4,  color:"#ff6600", anim:"particle2", dur:"2.0s", delay:"1.1s" },
                { left:"55%",  size:8,  color:"#ff2200", anim:"particle4", dur:"1.5s", delay:"0.6s" },
                { left:"90%",  size:6,  color:"#ff8800", anim:"particle5", dur:"2.3s", delay:"0.2s" },
                { left:"30%",  size:4,  color:"#ffaa00", anim:"embersFloat", dur:"2.8s", delay:"0.8s" },
                { left:"68%",  size:3,  color:"#ff6600", anim:"embersFloat", dur:"3.2s", delay:"0.3s" },
              ].map((p, i) => (
                <div key={i} style={{
                  position:"absolute",
                  bottom:0,
                  left:p.left,
                  width:p.size,
                  height:p.size,
                  borderRadius:"50%",
                  background:p.color,
                  boxShadow:`0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 4}px rgba(255,100,0,0.5)`,
                  animation:`${p.anim} ${p.dur} ease-out ${p.delay} infinite`,
                }} />
              ))}
            </div>

            {/* ── Title bar ── */}
            <div style={{
              background:"linear-gradient(90deg,rgba(180,30,0,0.0),rgba(220,80,0,0.75),rgba(180,30,0,0.0))",
              backgroundSize:"200% 100%",
              animation:"dragonFire 4s ease infinite",
              borderBottom:"1.5px solid rgba(255,140,0,0.5)",
              padding:"clamp(10px,1.5vh,16px) 20px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              position:"relative",
            }}>
              {/* Top shimmer line */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(255,200,0,0.8),rgba(255,120,0,0.9),rgba(255,200,0,0.8),transparent)", animation:"dragonFire 3s ease infinite" }} />
              {/* Bottom shimmer line */}
              <div style={{ position:"absolute", bottom:0, left:"5%", right:"5%", height:1, background:"linear-gradient(90deg,transparent,rgba(255,180,0,0.7),transparent)" }} />
              <div style={{ flex:1 }} />
              <span style={{ color:"#fff", fontWeight:900, fontSize:"clamp(14px,1.8vw,18px)", letterSpacing:"clamp(1px,0.3vw,3px)", textTransform:"uppercase", animation:"titleGlow 2.5s ease-in-out infinite" }}>
                🔥 Thông Tin Tài Khoản 🔥
              </span>
              <div style={{ flex:1, display:"flex", justifyContent:"flex-end" }}>
                <button onClick={() => setProfileOpen(false)} style={{
                  width:30, height:30, borderRadius:"50%",
                  background:"linear-gradient(135deg,#c41c1c,#7f1d1d)",
                  border:"1.5px solid rgba(239,68,68,0.6)", color:"white", fontWeight:900, fontSize:18, lineHeight:"1",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 0 14px rgba(220,38,38,0.6)",
                }}>×</button>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding:"clamp(16px,2.5vh,28px) clamp(16px,2.5vw,28px)", display:"flex", gap:"clamp(16px,2vw,28px)", alignItems:"flex-start" }}>

              {/* Left — avatar column */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, flexShrink:0, width:"clamp(110px,16vw,145px)" }}>
                <input id="avatar-upload" type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarChange} />
                <div style={{ position:"relative" }}>
                  {/* Outer glow ring */}
                  <div style={{
                    position:"absolute", inset:-4,
                    borderRadius:"50%",
                    background:`conic-gradient(${vip.ring}, #ffd700, ${vip.ring}, #b8860b, ${vip.ring})`,
                    filter:`blur(2px)`,
                    opacity:0.9,
                  }} />
                  <div style={{
                    position:"relative",
                    width:"clamp(100px,12vw,130px)", height:"clamp(100px,12vw,130px)", borderRadius:"50%",
                    border:`3px solid ${vip.ring}`,
                    boxShadow:`0 0 0 2px rgba(0,0,0,0.7), 0 0 40px ${vip.glow}, 0 0 80px rgba(180,80,0,0.3)`,
                    overflow:"hidden",
                    background:"radial-gradient(circle at 35% 30%,#6b0000,#0d0000)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {avatar
                      ? <img src={avatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : selectedPreset
                        ? <img src={PRESET_AVATARS.find(a => a.id === selectedPreset)?.url ?? ""} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <span style={{ color:"#ffd700", fontWeight:900, fontSize:"clamp(36px,5vw,52px)", fontFamily:"serif", textShadow:"0 0 20px #ffd700" }}>{(user?.username?.[0] ?? "H").toUpperCase()}</span>
                    }
                  </div>
                  {/* Camera overlay — opens avatar picker */}
                  <div
                    onClick={() => setAvatarPickerOpen(true)}
                    style={{ position:"absolute", bottom:4, right:4, width:30, height:30, borderRadius:"50%", background:"rgba(0,0,0,0.85)", border:"2px solid rgba(200,150,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 0 8px rgba(0,0,0,0.8)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,80,0.9)" strokeWidth="2" strokeLinecap="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                </div>
                {/* ĐỔI ẢNH button — opens avatar picker */}
                <button
                  onClick={() => setAvatarPickerOpen(true)}
                  style={{
                    padding:"7px 18px", borderRadius:8, width:"100%",
                    background:"linear-gradient(135deg,rgba(140,30,0,0.6),rgba(80,10,0,0.7))",
                    border:"1.5px solid rgba(220,100,0,0.6)",
                    color:"#ffcc44", fontWeight:900, fontSize:"clamp(10px,1.1vw,13px)", letterSpacing:1,
                    cursor:"pointer", textAlign:"center",
                    boxShadow:"0 0 14px rgba(180,80,0,0.4), inset 0 1px 0 rgba(255,180,0,0.15)",
                    transition:"all 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="linear-gradient(135deg,rgba(180,50,0,0.7),rgba(120,20,0,0.8))"}}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="linear-gradient(135deg,rgba(140,30,0,0.6),rgba(80,10,0,0.7))"}}
                >ĐỔI ẢNH</button>
              </div>

              {/* Right — info rows */}
              <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>

                {/* Row helper */}
                {([
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    ),
                    iconBg: "rgba(56,189,248,0.15)", iconBorder: "rgba(56,189,248,0.35)",
                    label: "TÊN HIỂN THỊ",
                    value: <span style={{ color:"white", fontWeight:900, fontSize:"clamp(12px,1.3vw,15px)", letterSpacing:0.3 }}>{user?.displayName ?? user?.username ?? "---"}</span>,
                    action: (
                      <button style={{ width:30, height:30, borderRadius:7, background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.15)", cursor:"pointer", color:"rgba(200,200,255,0.7)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                    ),
                  },
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M7 15h2M15 15h2"/></svg>
                    ),
                    iconBg: "rgba(56,189,248,0.15)", iconBorder: "rgba(56,189,248,0.35)",
                    label: "ID TÀI KHOẢN",
                    value: <span style={{ color:"white", fontWeight:900, fontSize:"clamp(12px,1.3vw,15px)", fontFamily:"monospace", letterSpacing:1 }}>{String(user?.id ?? "").padStart(8, "0")}</span>,
                    action: (
                      <button onClick={() => { navigator.clipboard.writeText(String(user?.id ?? "").padStart(8, "0")); setIdCopied(true); setTimeout(() => setIdCopied(false), 2000); }}
                        style={{ width:30, height:30, borderRadius:7, background: idCopied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", border:`1.5px solid ${idCopied ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.15)"}`, cursor:"pointer", color: idCopied ? "#4ade80" : "rgba(200,200,255,0.7)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s", boxShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>
                        {idCopied
                          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        }
                      </button>
                    ),
                  },
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ),
                    iconBg: "rgba(251,191,36,0.15)", iconBorder: "rgba(251,191,36,0.35)",
                    label: "CẤP VIP",
                    value: (
                      <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:15 }}>👑</span>
                        <span style={{ color:"#ffd700", fontWeight:900, fontSize:"clamp(12px,1.3vw,15px)", textShadow:"0 0 10px rgba(255,200,0,0.7)" }}>{vip.label}</span>
                      </span>
                    ),
                    action: null,
                  },
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#7c3a00" fontWeight="900">$</text></svg>
                    ),
                    iconBg: "rgba(251,191,36,0.15)", iconBorder: "rgba(251,191,36,0.35)",
                    label: "SỐ DƯ",
                    value: <span style={{ color:"#ffd700", fontWeight:900, fontSize:"clamp(12px,1.3vw,16px)", fontFamily:"monospace", textShadow:"0 0 10px rgba(255,200,0,0.5)", animation:"balPulse 2s ease-in-out infinite" }}>{balance.toLocaleString()}</span>,
                    action: (
                      <button onClick={() => { setProfileOpen(false); setDepositOpen(true); }}
                        style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#16a34a,#15803d)", border:"1.5px solid rgba(74,222,128,0.5)", color:"white", fontWeight:900, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 14px rgba(22,163,74,0.6)", flexShrink:0, lineHeight:"1" }}>+</button>
                    ),
                  },
                ] as { icon: React.ReactNode; iconBg: string; iconBorder: string; label: string; value: React.ReactNode; action: React.ReactNode | null }[]).map((row, i, arr) => (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:"clamp(8px,1vw,14px)",
                    padding:"clamp(11px,1.5vh,16px) clamp(10px,1.2vw,16px)",
                    borderBottom: i < arr.length - 1 ? "1px solid rgba(255,80,0,0.15)" : "none",
                    background: i % 2 === 0
                      ? "linear-gradient(90deg,rgba(255,60,0,0.06),rgba(255,120,0,0.04),rgba(255,60,0,0.06))"
                      : "linear-gradient(90deg,rgba(180,30,0,0.03),rgba(255,80,0,0.02),rgba(180,30,0,0.03))",
                    animation:`rowFireBorder ${2.5 + i * 0.4}s ease-in-out infinite`,
                    borderRadius: i === 0 ? "8px 8px 0 0" : i === arr.length - 1 ? "0 0 8px 8px" : 0,
                    transition:"background 0.3s",
                  }}>
                    {/* Icon box */}
                    <div style={{ width:32, height:32, borderRadius:8, background:row.iconBg, border:`1.5px solid ${row.iconBorder}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation:"iconFirePulse 2s ease-in-out infinite" }}>
                      {row.icon}
                    </div>
                    {/* Label */}
                    <span style={{ color:"rgba(200,210,220,0.85)", fontSize:"clamp(10px,1.05vw,13px)", fontWeight:700, letterSpacing:"clamp(0.3px,0.05vw,0.8px)", width:"clamp(100px,12vw,140px)", flexShrink:0, textTransform:"uppercase" }}>
                      {row.label}
                    </span>
                    {/* Value */}
                    <div style={{ flex:1, minWidth:0 }}>{row.value}</div>
                    {/* Action */}
                    {row.action}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Telegram section ── */}
            <div style={{
              margin:"0 clamp(14px,2vw,24px) clamp(14px,2vh,22px)",
              background:"linear-gradient(135deg,rgba(20,30,50,0.9),rgba(10,20,40,0.95))",
              border:"1.5px solid rgba(56,189,248,0.2)",
              borderRadius:14, padding:"clamp(12px,1.6vh,18px) clamp(14px,1.8vw,22px)",
              display:"flex", alignItems:"center", gap:"clamp(10px,1.4vw,18px)",
              boxShadow:"0 0 20px rgba(34,158,217,0.1), inset 0 1px 0 rgba(56,189,248,0.08)",
            }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#229ED9,#1565c0)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 20px rgba(34,158,217,0.6), 0 0 40px rgba(34,158,217,0.2)" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"white", fontWeight:900, fontSize:"clamp(12px,1.3vw,15px)", letterSpacing:"clamp(0.5px,0.08vw,1px)" }}>LIÊN KẾT TELEGRAM</div>
                <div style={{ color:"rgba(148,163,184,0.85)", fontSize:"clamp(10px,0.95vw,12px)", marginTop:3 }}>Nhận thông báo và ưu đãi nhanh nhất</div>
              </div>
              <button style={{
                padding:"clamp(8px,1.1vh,12px) clamp(16px,2vw,26px)", borderRadius:10, flexShrink:0,
                background:"linear-gradient(135deg,#f59e0b,#d97706,#b45309)",
                border:"1.5px solid rgba(245,158,11,0.5)", color:"white",
                fontWeight:900, fontSize:"clamp(11px,1.2vw,14px)", letterSpacing:"clamp(0.5px,0.1vw,1.5px)",
                cursor:"pointer",
                boxShadow:"0 0 20px rgba(217,119,6,0.6), 0 4px 0 rgba(120,60,0,0.8), inset 0 1px 0 rgba(255,220,100,0.3)",
                transition:"all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 0 28px rgba(217,119,6,0.8),0 6px 0 rgba(120,60,0,0.8),inset 0 1px 0 rgba(255,220,100,0.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.boxShadow="0 0 20px rgba(217,119,6,0.6),0 4px 0 rgba(120,60,0,0.8),inset 0 1px 0 rgba(255,220,100,0.3)"; }}
              >LIÊN KẾT</button>
            </div>

          </div>
        </div>
      )}

      {/* ── Avatar Picker Modal ── */}
      {avatarPickerOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setAvatarPickerOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"clamp(340px,92vw,520px)",
            background:"linear-gradient(160deg,#1a0d00,#0f0800,#1a0d00)",
            border:"2px solid rgba(180,120,0,0.6)",
            borderRadius:20,
            boxShadow:"0 0 0 1px rgba(255,200,0,0.08), 0 40px 100px rgba(0,0,0,0.98), 0 0 60px rgba(180,120,0,0.25)",
            overflow:"hidden",
          }}>
            {/* Header */}
            <div style={{ position:"relative", padding:"16px 20px", background:"linear-gradient(135deg,rgba(180,120,0,0.3),rgba(100,60,0,0.2))", borderBottom:"1.5px solid rgba(180,120,0,0.35)", textAlign:"center" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(255,200,0,0.8),rgba(255,160,0,0.9),rgba(255,200,0,0.8),transparent)" }} />
              <div style={{ color:"#f5d060", fontWeight:900, fontSize:16, letterSpacing:2, textShadow:"0 0 20px rgba(255,200,0,0.5)" }}>CHỌN ẢNH ĐẠI DIỆN</div>
              <div style={{ color:"rgba(200,160,80,0.5)", fontSize:11, marginTop:3, letterSpacing:0.5 }}>Chọn 1 trong 20 avatar có sẵn</div>
              <button onClick={() => setAvatarPickerOpen(false)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"linear-gradient(135deg,#7f1d1d,#450a0a)", border:"1.5px solid rgba(239,68,68,0.5)", borderRadius:"50%", width:30, height:30, color:"#fff", fontWeight:900, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>

            {/* Grid */}
            <div style={{ padding:"16px", maxHeight:"65vh", overflowY:"auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
                {PRESET_AVATARS.map(p => {
                  const active = selectedPreset === p.id && !avatar;
                  return (
                    <div key={p.id} onClick={() => {
                      setSelectedPreset(p.id);
                      setAvatar(null);
                      if (user?.id) {
                        localStorage.setItem(`preset_${user.id}`, String(p.id));
                        localStorage.removeItem(`avatar_${user.id}`);
                      }
                      setAvatarPickerOpen(false);
                    }} style={{
                      position:"relative", cursor:"pointer",
                      borderRadius:14,
                      border: active ? "2.5px solid #f5d060" : "2px solid rgba(180,120,0,0.2)",
                      boxShadow: active ? "0 0 16px rgba(245,208,96,0.6)" : "none",
                      aspectRatio:"1",
                      overflow:"hidden",
                      transition:"all 0.15s",
                      background:"#1a0d00",
                    }}>
                      <img
                        src={p.url}
                        alt={`avatar ${p.id}`}
                        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                      />
                      {active && (
                        <div style={{ position:"absolute", top:4, right:4, width:18, height:18, borderRadius:"50%", background:"#f5d060", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0f0800" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GIFTCODE Modal ── */}
      {giftcodeOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setGiftcodeOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width:"clamp(320px,90vw,420px)",
            background:"linear-gradient(160deg,#1a0d00,#0f0800,#1a0d00)",
            border:"2px solid rgba(180,120,0,0.6)",
            borderRadius:18,
            boxShadow:"0 0 0 1px rgba(255,200,0,0.08), 0 32px 80px rgba(0,0,0,0.97), 0 0 40px rgba(180,120,0,0.2)",
            overflow:"hidden",
          }}>
            {/* Header */}
            <div style={{ position:"relative", padding:"14px 20px", background:"linear-gradient(135deg,rgba(180,120,0,0.25),rgba(100,60,0,0.2))", borderBottom:"1.5px solid rgba(180,120,0,0.35)", textAlign:"center" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(255,200,0,0.8),rgba(255,160,0,0.9),rgba(255,200,0,0.8),transparent)" }} />
              <span style={{ fontSize:20, marginRight:8 }}>🎀</span>
              <span style={{ color:"#f5d060", fontWeight:900, fontSize:17, letterSpacing:2, textShadow:"0 0 20px rgba(255,200,0,0.5)" }}>NHẬP GIFTCODE</span>
              <button onClick={() => setGiftcodeOpen(false)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"linear-gradient(135deg,#7f1d1d,#450a0a)", border:"1.5px solid rgba(239,68,68,0.5)", borderRadius:"50%", width:28, height:28, color:"#fff", fontWeight:900, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>

            {/* Body */}
            <div style={{ padding:"28px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
              {/* Decoration */}
              <div style={{ fontSize:52, lineHeight:1 }}>🎁</div>
              <div style={{ color:"rgba(255,230,180,0.8)", fontSize:13, textAlign:"center", lineHeight:1.6 }}>
                Nhập mã Giftcode để nhận thưởng<br/>
                <span style={{ color:"rgba(200,160,80,0.55)", fontSize:11 }}>Mã chỉ được dùng một lần duy nhất</span>
              </div>

              {/* Input */}
              <div style={{ width:"100%", position:"relative" }}>
                <input
                  value={giftcodeVal}
                  onChange={e => { setGiftcodeVal(e.target.value.toUpperCase()); setGiftcodeStatus("idle"); }}
                  placeholder="VD: HARU88WELCOME"
                  maxLength={24}
                  style={{
                    width:"100%", boxSizing:"border-box",
                    background:"rgba(255,200,0,0.06)",
                    border:`1.5px solid ${giftcodeStatus==="ok" ? "rgba(74,222,128,0.7)" : giftcodeStatus==="err" ? "rgba(239,68,68,0.7)" : "rgba(180,120,0,0.4)"}`,
                    borderRadius:12, padding:"14px 18px",
                    color:"#f5d060", fontSize:18, fontWeight:900,
                    letterSpacing:3, textAlign:"center", outline:"none",
                    textTransform:"uppercase",
                  }}
                />
              </div>

              {/* Status message */}
              {giftcodeStatus === "ok" && (
                <div style={{ color:"#4ade80", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>✅ Nhận thưởng thành công! Số dư đã được cộng.</div>
              )}
              {giftcodeStatus === "err" && (
                <div style={{ color:"#f87171", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>❌ Mã không hợp lệ hoặc đã được sử dụng.</div>
              )}

              {/* Submit */}
              <button
                disabled={giftcodeVal.trim().length < 4 || giftcodeStatus === "loading"}
                onClick={() => {
                  if (!giftcodeVal.trim()) return;
                  setGiftcodeStatus("loading");
                  setTimeout(() => {
                    setGiftcodeStatus("err");
                  }, 1200);
                }}
                style={{
                  width:"100%", padding:"14px", borderRadius:12,
                  background: giftcodeVal.trim().length < 4
                    ? "rgba(100,60,0,0.3)"
                    : "linear-gradient(135deg,#b45309,#d97706)",
                  border:`1.5px solid ${giftcodeVal.trim().length < 4 ? "rgba(100,60,0,0.3)" : "rgba(245,158,11,0.5)"}`,
                  color: giftcodeVal.trim().length < 4 ? "rgba(200,160,80,0.35)" : "white",
                  fontWeight:900, fontSize:15, letterSpacing:1.5,
                  cursor: giftcodeVal.trim().length < 4 ? "not-allowed" : "pointer",
                  boxShadow: giftcodeVal.trim().length >= 4 ? "0 0 24px rgba(217,119,6,0.4), 0 4px 0 rgba(120,60,0,0.8)" : "none",
                  transition:"all 0.15s",
                }}
              >
                {giftcodeStatus === "loading" ? "Đang kiểm tra..." : "XÁC NHẬN"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} initialTab={depositInitTab} />


      </div>{/* ── end rotated game container ── */}
    </>
  );
}

