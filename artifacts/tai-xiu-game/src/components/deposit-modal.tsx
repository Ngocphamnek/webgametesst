import { useState, useEffect, useRef, useCallback } from "react";
import { useDeposit, useVaultDeposit, useVaultWithdraw, useGetMe, getGetBalanceQueryKey, useGetBetHistory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

/* ─── helpers ─────────────────────────────────────────── */
function fmtVnd(n: number) { return n.toLocaleString("vi-VN") + "đ"; }
function fmtShort(n: number) {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  return `${n / 1_000}K`;
}

type Tab = "nap" | "rut" | "ket-sat" | "lich-su";

/* ─── NẠP methods ─────────────────────────────────────── */
type NapMethod = "qr" | "flash" | "tien-ao" | "vi-dien-tu" | "the-cao" | "giftcode";
const NAP_METHODS: { id: NapMethod; label: string; badge?: string }[] = [
  { id: "qr",         label: "QR PAY"     },
  { id: "flash",      label: "FLASHPAY"   },
  { id: "tien-ao",    label: "TIỀN ẢO"    },
  { id: "vi-dien-tu", label: "VÍ ĐIỆN TỬ", badge: "ĐANG BẢO TRÌ" },
  { id: "the-cao",    label: "THẺ CÀO"    },
  { id: "giftcode",   label: "GIFTCODE"   },
];

/* ─── RÚT methods ─────────────────────────────────────── */
type RutMethod = "ngan-hang" | "tien-ao-r" | "the-cao-r";
const RUT_METHODS: { id: RutMethod; label: string }[] = [
  { id: "ngan-hang", label: "NGÂN HÀNG" },
  { id: "tien-ao-r", label: "TIỀN ẢO"   },
  { id: "the-cao-r", label: "THẺ CÀO"   },
];

const BANKS = ["Vietcombank","Techcombank","BIDV","Agribank","MB Bank","ACB","VPBank","TPBank","Sacombank","VietinBank"];
const TELECOMS = ["Viettel","Vinaphone","Mobifone","Vietnamobile","Zing"];
const TELECOM_COLORS: Record<string, string> = {
  Viettel:"#ee0033", Vinaphone:"#0059a0", Mobifone:"#009245", Vietnamobile:"#5b2b8c", Zing:"#0069d9",
};
const NAP_DENOMS   = [100_000, 200_000, 300_000, 500_000];
const RUT_DENOMS   = [500_000, 1_000_000, 10_000_000, 100_000_000];
const CARD_DENOMS  = [
  { face:10_000,  receive:8_700  }, { face:20_000,  receive:17_400 },
  { face:30_000,  receive:26_100 }, { face:50_000,  receive:43_500 },
  { face:100_000, receive:87_000 }, { face:200_000, receive:174_000},
];
const NAP_QUICK  = [100_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000, 300_000_000];
const KS_QUICK   = [100_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000];

/* ─── Admin bank info (configurable) ──────────────────── */
const ADMIN_BANK = { name:"MB BANK", acct:"1119112007", holder:"PHAM DAC VU" };
const QR_EXPIRE_SECS = 10 * 60; // 10 phút

function genContent(username: string) {
  const prefix = username.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  const rand = Math.random().toString(36).toUpperCase().slice(2,6);
  return `HARU88${prefix}${rand}`;
}

function fmtCountdown(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2,"0");
  const sec = (s % 60).toString().padStart(2,"0");
  return `${m}:${sec}`;
}

/* ─── QR Receipt screen ──────────────────────────────── */
function QRReceipt({ amount, content, onReset }: { amount: number; content: string; onReset(): void }) {
  const [secs, setSecs] = useState(QR_EXPIRE_SECS);
  const [copied, setCopied] = useState<string|null>(null);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  const qrData = encodeURIComponent(
    `Bank: ${ADMIN_BANK.name}\nAccount: ${ADMIN_BANK.acct}\nAmount: ${amount}\nContent: ${content}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=130x130&bgcolor=ffffff&color=000000&margin=4`;

  const PAYMENT_LOGOS = [
    { text:"VietQR",  bg:"#e2f0ff", color:"#1a5fa8" },
    { text:"napas★",  bg:"#fff0e0", color:"#c44a00" },
    { text:"ZaloPay", bg:"#e8f5ff", color:"#0068ff" },
    { text:"momo",    bg:"#ffe8f8", color:"#a50064" },
  ];

  const rows = [
    { label:"Ngân hàng:",     value: ADMIN_BANK.name,   copyKey: null },
    { label:"Số tiền:",       value: amount.toLocaleString("vi-VN"), copyKey: null },
    { label:"Tài Khoản:",     value: ADMIN_BANK.acct,   copyKey: "acct" },
    { label:"Tên tài khoản:", value: ADMIN_BANK.holder, copyKey: null },
    { label:"Nội dung:",      value: content,            copyKey: "content", highlight: true },
  ];

  return (
    <div style={{ flex:1, display:"flex" }}>
      {/* Left — bank info */}
      <div style={{ flex:1, padding:"18px 22px", display:"flex", flexDirection:"column", gap:11 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ color:"rgba(200,90,70,0.75)", fontSize:13, fontWeight:600, whiteSpace:"nowrap", width:130, flexShrink:0 }}>
              {r.label}
            </span>
            <span style={{
              flex:1, fontSize:14, fontWeight:700,
              color: r.highlight ? "#4ade80" : "#fff",
              letterSpacing: r.highlight ? 1 : 0,
            }}>
              {r.value}
            </span>
            {r.copyKey && (
              <button onClick={() => copy(r.value, r.copyKey!)} style={{
                background:"rgba(180,30,10,0.25)", border:"1.5px solid rgba(180,30,10,0.4)",
                borderRadius:6, padding:"3px 8px", color:"rgba(255,130,110,0.85)",
                fontSize:11, cursor:"pointer", fontWeight:700, whiteSpace:"nowrap",
              }}>{copied===r.copyKey ? "✓ Đã copy" : "📋"}</button>
            )}
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8, color:"rgba(255,255,255,0.4)", fontSize:12 }}>
          <div style={{
            width:36, height:36, borderRadius:"50%",
            background:"linear-gradient(135deg,#2a0000,#4a0000)",
            border:"2px solid rgba(180,30,10,0.4)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0,
          }}>🎧</div>
          Mọi thắc mắc vui lòng liên hệ Hỗ trợ.
        </div>
      </div>

      {/* Right — QR + info */}
      <div style={{
        width:210, borderLeft:"1.5px solid rgba(160,20,0,0.35)",
        padding:"14px 14px", background:"rgba(0,0,0,0.18)",
        display:"flex", flexDirection:"column", gap:10, alignItems:"center", flexShrink:0,
      }}>
        <div style={{ fontSize:11, color:"rgba(200,130,100,0.7)", fontWeight:600, alignSelf:"flex-start" }}>
          Chấp nhận chuyển tiền từ
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, alignSelf:"flex-start" }}>
          {PAYMENT_LOGOS.map(p => (
            <div key={p.text} style={{ background:p.bg, borderRadius:4, padding:"2px 6px", fontSize:9, fontWeight:800, color:p.color }}>{p.text}</div>
          ))}
        </div>
        <div style={{
          background:"rgba(180,0,0,0.12)", border:"1.5px solid rgba(200,20,0,0.4)",
          borderRadius:6, padding:"7px 10px", textAlign:"center",
          fontSize:11, fontWeight:800, color:"#f87171", lineHeight:1.4,
        }}>
          ⚠️ NHẬP KHÔNG ĐÚNG SỐ TIỀN,<br/>GIAO DỊCH SẼ BỊ HỦY
        </div>
        <div style={{ background:"#fff", borderRadius:8, padding:4, flexShrink:0 }}>
          <img src={qrUrl} alt="QR" width={130} height={130} style={{ display:"block", borderRadius:4 }} />
        </div>
        {secs > 0 ? (
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
            Mã QR hết hạn sau:&nbsp;
            <span style={{ color:"#fb923c", fontWeight:800 }}>{fmtCountdown(secs)}</span>
          </div>
        ) : (
          <div style={{ fontSize:12, color:"#f87171", fontWeight:700 }}>⏰ Mã QR đã hết hạn!</div>
        )}
        <button onClick={onReset} style={{
          background:"linear-gradient(180deg,#c8920a,#7a5008)",
          border:"none", borderRadius:8, padding:"8px 24px",
          color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer",
          boxShadow:"0 3px 0 rgba(0,0,0,0.5)",
        }}>Tạo mới</button>
      </div>
    </div>
  );
}

/* ─── Shared mini components ──────────────────────────── */
function AmountInput({ value, onChange }: { value: string; onChange(v: string): void }) {
  return (
    <div style={{ position:"relative", flex:1 }}>
      <input
        value={value ? parseInt(value.replace(/\D/g,""),10).toLocaleString("vi-VN") : ""}
        onChange={e => onChange(e.target.value.replace(/\D/g,""))}
        placeholder="Nhập số tiền"
        style={{
          width:"100%", boxSizing:"border-box",
          background:"rgba(0,0,0,0.4)", border:"1.5px solid rgba(180,30,10,0.5)",
          borderRadius:8, padding:"9px 36px 9px 12px",
          color:"#fff", fontSize:14, outline:"none", caretColor:"#ff4422",
        }}
      />
      <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"rgba(220,100,80,0.7)", fontWeight:700, fontSize:13 }}>đ</span>
    </div>
  );
}

function QuickBtns({ amounts, value, onSelect, extraLabel }: {
  amounts: number[]; value: string; onSelect(v: string): void; extraLabel?: string;
}) {
  const raw = parseInt(value,10);
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${extraLabel ? amounts.length+1 : 4},1fr)`, gap:7 }}>
      {amounts.map(a => (
        <button key={a} type="button" onClick={() => onSelect(String(a))} style={qBtnStyle(raw === a)}>
          {fmtShort(a)}
        </button>
      ))}
      {extraLabel && (
        <button type="button" onClick={() => onSelect("ALL")} style={qBtnStyle(value === "ALL")}>
          {extraLabel}
        </button>
      )}
    </div>
  );
}

function qBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? "linear-gradient(135deg,#c41c00,#7f0000)" : "linear-gradient(135deg,#1e0000,#160000)",
    border:`1.5px solid ${active ? "#ff4422" : "rgba(180,30,10,0.4)"}`,
    borderRadius:20, color: active ? "#fff" : "rgba(220,100,80,0.75)",
    fontWeight:700, fontSize:12, padding:"6px 0", cursor:"pointer", transition:"all 0.15s",
    boxShadow: active ? "0 0 10px rgba(200,28,0,0.5)" : "none",
  };
}

function InputField({ label, placeholder, value, onChange, type="text" }: {
  label: string; placeholder: string; value: string; onChange(v: string): void; type?: string;
}) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
      <span style={{ color:"rgba(255,130,110,0.8)", fontSize:13, fontWeight:700, whiteSpace:"nowrap", width:120, textAlign:"right" }}>
        {label}
      </span>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex:1, background:"rgba(0,0,0,0.35)", border:"1.5px solid rgba(180,30,10,0.45)",
          borderRadius:8, padding:"9px 12px", color:"#fff", fontSize:13,
          outline:"none", caretColor:"#ff4422",
        }}
      />
    </div>
  );
}

function ActionBtn({ label, onClick, disabled, color="red" }: {
  label: string; onClick(): void; disabled?: boolean; color?: "red"|"gray"|"gold";
}) {
  const bg = color === "red"  ? (disabled ? "rgba(255,255,255,0.05)" : "linear-gradient(180deg,#c41c00,#7f0000)")
           : color === "gold" ? "linear-gradient(180deg,#c8920a,#7a5008)"
           : "linear-gradient(180deg,#5a5a5a,#333)";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      alignSelf:"center", width:"55%", padding:"12px 0", marginTop:8,
      background: bg, border:"none", borderRadius:8,
      color: disabled ? "#555" : "#fff", fontWeight:800, fontSize:14, letterSpacing:2,
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: disabled ? "none" : "0 3px 0 rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
      transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center",
    }}>{label}</button>
  );
}

/* ─── Right info panel (NẠP QR/FLASH) ────────────────── */
function RightInfoPanel() {
  return (
    <div style={{
      width:185, borderLeft:"1.5px solid rgba(160,20,0,0.35)",
      padding:"18px 14px", background:"rgba(0,0,0,0.18)",
      display:"flex", flexDirection:"column", gap:18, flexShrink:0,
    }}>
      <div>
        <div style={{ color:"rgba(255,130,110,0.65)", fontSize:11, fontWeight:600, marginBottom:8, lineHeight:1.4 }}>
          Chấp nhận chuyển tiền từ
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {[
            { text:"VietQR",  bg:"#e2f0ff", color:"#1a5fa8" },
            { text:"napas★",  bg:"#fff0e0", color:"#c44a00" },
            { text:"Zalo Pay",bg:"#e8f5ff", color:"#0068ff" },
            { text:"momo",    bg:"#ffe8f8", color:"#a50064" },
          ].map(p => (
            <div key={p.text} style={{ background:p.bg, borderRadius:5, padding:"3px 6px", fontSize:9, fontWeight:800, color:p.color, whiteSpace:"nowrap" }}>{p.text}</div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ color:"rgba(255,255,255,0.38)", fontSize:11, lineHeight:1.5, marginBottom:8 }}>
          Mọi thắc mắc vui lòng liên hệ Hỗ trợ
        </div>
        <div style={{
          width:42, height:42, borderRadius:"50%",
          background:"linear-gradient(135deg,#2a0000,#4a0000)",
          border:"2px solid rgba(180,30,10,0.45)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.5)",
        }}>🎧</div>
      </div>
    </div>
  );
}

/* ─── Sidebar ─────────────────────────────────────────── */
function Sidebar<T extends string>({
  methods, active, onSelect,
}: { methods: { id: T; label: string; badge?: string }[]; active: T; onSelect(id: T): void }) {
  return (
    <div style={{
      width:128, borderRight:"1.5px solid rgba(160,20,0,0.35)",
      display:"flex", flexDirection:"column", paddingTop:6, paddingBottom:6,
      background:"rgba(0,0,0,0.28)", flexShrink:0,
    }}>
      {methods.map(m => (
        <button key={m.id} onClick={() => onSelect(m.id)} style={{
          position:"relative", padding:"11px 12px", border:"none", cursor:"pointer",
          fontSize:12, letterSpacing:0.4, textAlign:"left",
          background: active === m.id ? "linear-gradient(90deg,rgba(180,0,0,0.35),transparent)" : "transparent",
          borderLeft:`3px solid ${active === m.id ? "#ff4422" : "transparent"}`,
          color: active === m.id ? "#ff8877" : "rgba(200,80,60,0.55)",
          fontWeight: active === m.id ? 800 : 600,
          transition:"all 0.15s",
        }}>
          {m.badge && (
            <div style={{
              position:"absolute", top:3, left:5, fontSize:8, fontWeight:700,
              background:"#991b1b", color:"#fca5a5", borderRadius:3, padding:"1px 3px",
            }}>{m.badge}</div>
          )}
          <span style={{ marginTop: m.badge ? 9 : 0, display:"block" }}>{m.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────── */
export function DepositModal({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const [tab, setTab]             = useState<Tab>("nap");
  const [napMethod, setNapMethod] = useState<NapMethod>("qr");
  const [rutMethod, setRutMethod] = useState<RutMethod>("ngan-hang");

  /* QR Receipt */
  const [napStep, setNapStep] = useState<"input"|"receipt">("input");
  const [receipt, setReceipt] = useState<{amount:number;content:string}|null>(null);

  /* NẠP QR/FLASH */
  const [napAmt, setNapAmt]   = useState("");
  /* NẠP THẺ CÀO */
  const [telecom, setTelecom] = useState<string>("Viettel");
  const [cardDenom, setDenom] = useState<number|null>(null);
  const [serial, setSerial]   = useState("");
  const [cardCode, setCard]   = useState("");
  /* NẠP GIFTCODE */
  const [giftcode, setGift]   = useState("");
  /* RÚT NGÂN HÀNG */
  const [bank, setBank]       = useState("");
  const [acct, setAcct]       = useState("");
  const [acctName, setName]   = useState("");
  const [rutAmt, setRutAmt]   = useState("");
  /* RÚT THẺ CÀO */
  const [rutTelecom, setRutTel] = useState("Viettel");
  const [rutDenom, setRutDenom] = useState<number|null>(null);
  /* KÉT SẮT */
  const [ksMode, setKsMode]   = useState<"gui"|"rut">("gui");
  const [ksAmt, setKsAmt]     = useState("");
  /* Feedback */
  const [msg, setMsg]         = useState<{text:string;ok:boolean}|null>(null);

  const { token }    = useAuth();
  const deposit     = useDeposit();
  const vaultDep    = useVaultDeposit();
  const vaultWith   = useVaultWithdraw();
  const queryClient = useQueryClient();
  const reqOpts     = { request: { headers: { Authorization:`Bearer ${token}` } } };
  const history     = useGetBetHistory(reqOpts);
  const { data: user } = useGetMe(reqOpts);
  const balanceQuery = useQueryClient().getQueryData<{ balance: number; safeBalance?: number }>(getGetBalanceQueryKey());
  const currentBalance   = balanceQuery?.balance   ?? 0;
  const currentSafe      = balanceQuery?.safeBalance ?? 0;

  if (!open) return null;

  function showMsg(text: string, ok: boolean) {
    setMsg({text, ok});
    setTimeout(() => setMsg(null), 3000);
  }

  function doDeposit(amount: number) {
    deposit.mutate({ data: { amount } }, {
      onSuccess: () => {
        showMsg(`✅ Nạp thành công ${fmtVnd(amount)}!`, true);
        queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
        setNapAmt(""); setKsAmt("");
      },
      onError: () => showMsg("Nạp tiền thất bại, thử lại!", false),
    });
  }

  /* ── styles ── */
  const tabActive: React.CSSProperties = {
    background:"linear-gradient(180deg,#c41c00 0%,#8b0000 60%,#5a0000 100%)",
    color:"#fff", borderBottom:"2px solid #ff4422", fontWeight:800,
  };
  const tabInactive: React.CSSProperties = {
    background:"linear-gradient(180deg,#1a0000 0%,#110000 100%)",
    color:"rgba(255,120,100,0.5)", borderBottom:"2px solid transparent", fontWeight:600,
  };

  const TABS: {id:Tab;label:string;icon:string}[] = [
    {id:"nap",     label:"NẠP",        icon:"🛒"},
    {id:"rut",     label:"RÚT",        icon:"🏧"},
    {id:"ket-sat", label:"KÉT SẮT",    icon:"🗄"},
    {id:"lich-su", label:"LỊCH SỬ GD", icon:"🕐"},
  ];

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          width:"clamp(700px,88vw,900px)",
          background:"linear-gradient(160deg,#150000 0%,#0d0000 50%,#150000 100%)",
          border:"2px solid rgba(180,20,0,0.65)",
          borderRadius:16, overflow:"hidden", position:"relative",
          boxShadow:"0 32px 80px rgba(0,0,0,0.97), 0 0 40px rgba(140,0,0,0.18)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={() => onOpenChange(false)} style={{
          position:"absolute", top:8, right:10, zIndex:10,
          width:30, height:30, borderRadius:"50%",
          background:"linear-gradient(135deg,#dc2626,#7f1d1d)",
          border:"2px solid rgba(255,80,60,0.5)",
          color:"#fff", fontWeight:900, fontSize:16, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 2px 8px rgba(200,0,0,0.5)",
        }}>×</button>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"2px solid rgba(160,20,0,0.55)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:"13px 6px", border:"none", cursor:"pointer",
              fontSize:12.5, letterSpacing:0.7,
              ...(tab === t.id ? tabActive : tabInactive),
              transition:"all 0.15s",
            }}>{t.icon}&nbsp;{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ display:"flex", minHeight:360 }}>

          {/* ═══════════ NẠP ═══════════ */}
          {tab === "nap" && <>
            <Sidebar methods={NAP_METHODS} active={napMethod} onSelect={(m) => { setNapMethod(m); setNapStep("input"); setReceipt(null); }} />

            {/* QR / FLASH — input step */}
            {(napMethod === "qr" || napMethod === "flash") && napStep === "input" && (
              <div style={{ flex:1, padding:"18px 22px", display:"flex", flexDirection:"column", gap:13 }}>
                <div style={{ color:"rgba(255,130,110,0.7)", fontSize:12, marginBottom:2 }}>Vui lòng nhập số tiền</div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <AmountInput value={napAmt} onChange={setNapAmt} />
                </div>
                <QuickBtns amounts={NAP_QUICK} value={napAmt} onSelect={setNapAmt} />
                {msg && <p style={{ color:msg.ok?"#4ade80":"#f87171", fontSize:12, margin:0, textAlign:"center" }}>{msg.text}</p>}
                <ActionBtn label="TẠO MÃ" color="gray"
                  onClick={() => {
                    const n = parseInt(napAmt, 10);
                    if (n >= 10000) {
                      const content = genContent(user?.username ?? "USER");
                      setReceipt({ amount: n, content });
                      setNapStep("receipt");
                    }
                  }}
                  disabled={parseInt(napAmt||"0",10) < 10000} />
              </div>
            )}

            {/* QR / FLASH — receipt step */}
            {(napMethod === "qr" || napMethod === "flash") && napStep === "receipt" && receipt && (
              <QRReceipt amount={receipt.amount} content={receipt.content} onReset={() => { setNapStep("input"); setReceipt(null); setNapAmt(""); }} />
            )}

            {/* TIỀN ẢO */}
            {napMethod === "tien-ao" && (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:36 }}>💎</div>
                <div style={{ color:"rgba(255,130,110,0.7)", fontSize:14, fontWeight:600 }}>Nạp qua Tiền Ảo</div>
                <div style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>Liên hệ hỗ trợ để thực hiện giao dịch</div>
              </div>
            )}

            {/* VÍ ĐIỆN TỬ */}
            {napMethod === "vi-dien-tu" && (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:36 }}>🔧</div>
                <div style={{ color:"rgba(255,130,110,0.7)", fontSize:14, fontWeight:600 }}>Đang bảo trì</div>
                <div style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>Vui lòng sử dụng phương thức khác</div>
              </div>
            )}

            {/* THẺ CÀO */}
            {napMethod === "the-cao" && (
              <div style={{ flex:1, padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
                {/* Telecom tabs */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {TELECOMS.map(t => (
                    <button key={t} onClick={() => setTelecom(t)} style={{
                      padding:"6px 16px", borderRadius:20, border:"1.5px solid",
                      borderColor: telecom===t ? TELECOM_COLORS[t] : "rgba(180,30,10,0.3)",
                      background: telecom===t ? TELECOM_COLORS[t]+"22" : "rgba(0,0,0,0.3)",
                      color: telecom===t ? TELECOM_COLORS[t] : "rgba(200,80,60,0.6)",
                      fontWeight:800, fontSize:13, cursor:"pointer", transition:"all 0.15s",
                    }}>{t}</button>
                  ))}
                </div>
                {/* Denominations */}
                <div style={{ fontSize:12, color:"rgba(255,130,110,0.65)", fontWeight:600 }}>CHỌN MỆNH GIÁ THẺ</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {NAP_DENOMS.map(d => (
                    <button key={d} onClick={() => setDenom(d)} style={{
                      background: cardDenom===d ? "linear-gradient(135deg,#c41c00,#7f0000)" : "rgba(0,0,0,0.3)",
                      border:`1.5px solid ${cardDenom===d ? "#ff4422" : "rgba(180,30,10,0.35)"}`,
                      borderRadius:10, padding:"10px 6px", cursor:"pointer",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                    }}>
                      <span style={{ fontSize:11, color:"rgba(255,200,80,0.8)" }}>🪙 {fmtVnd(d)}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{fmtVnd(d)}</span>
                    </button>
                  ))}
                </div>
                {/* Serial + Code */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <div style={{ fontSize:11, color:"rgba(255,130,110,0.6)", marginBottom:4 }}>Số Seri</div>
                    <input value={serial} onChange={e=>setSerial(e.target.value)} placeholder="Nhập số seri"
                      style={{ width:"100%", boxSizing:"border-box", background:"rgba(0,0,0,0.35)", border:"1.5px solid rgba(180,30,10,0.4)", borderRadius:7, padding:"8px 10px", color:"#fff", fontSize:12, outline:"none" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:"rgba(255,130,110,0.6)", marginBottom:4 }}>Mã thẻ</div>
                    <input value={cardCode} onChange={e=>setCard(e.target.value)} placeholder="Nhập mã thẻ"
                      style={{ width:"100%", boxSizing:"border-box", background:"rgba(0,0,0,0.35)", border:"1.5px solid rgba(180,30,10,0.4)", borderRadius:7, padding:"8px 10px", color:"#fff", fontSize:12, outline:"none" }} />
                  </div>
                </div>
                <ActionBtn label="NẠP THẺ" color="red"
                  onClick={() => { if(cardDenom) { doDeposit(cardDenom); setDenom(null); setSerial(""); setCard(""); } }}
                  disabled={!cardDenom || !serial || !cardCode || deposit.isPending} />
              </div>
            )}

            {/* GIFTCODE */}
            {napMethod === "giftcode" && (
              <div style={{ flex:1, display:"flex" }}>
                <div style={{ flex:1, padding:"24px 20px", display:"flex", flexDirection:"column", gap:14 }}>
                  <input value={giftcode} onChange={e=>setGift(e.target.value.toUpperCase())} placeholder="Nhập mã GIFTCODE"
                    style={{
                      background:"rgba(0,0,0,0.4)", border:"1.5px solid rgba(180,30,10,0.45)",
                      borderRadius:8, padding:"11px 14px", color:"#fff", fontSize:14,
                      outline:"none", letterSpacing:1.5, textAlign:"center",
                    }} />
                  {msg && <p style={{ color:msg.ok?"#4ade80":"#f87171", fontSize:12, margin:0, textAlign:"center" }}>{msg.text}</p>}
                  <ActionBtn label="XÁC NHẬN" color="gray"
                    onClick={() => showMsg("Giftcode không hợp lệ hoặc đã dùng!", false)}
                    disabled={giftcode.length < 4} />
                </div>
                <div style={{ width:190, borderLeft:"1.5px solid rgba(160,20,0,0.3)", padding:"20px 14px", display:"flex", flexDirection:"column", gap:14, alignItems:"center" }}>
                  <div style={{ background:"#1877f2", borderRadius:10, padding:"12px 16px", width:"100%", textAlign:"center", cursor:"pointer" }}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.8)", marginBottom:2 }}>"Like" us on</div>
                    <div style={{ color:"#fff", fontWeight:900, fontSize:18 }}>facebook</div>
                  </div>
                  <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, textAlign:"center", lineHeight:1.5 }}>
                    Theo dõi Fanpage của chúng tôi để cập nhật những thông tin mới nhất
                  </div>
                  <div style={{ background:"#1877f2", borderRadius:20, padding:"8px 20px", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                    📘 FANPAGE
                  </div>
                </div>
              </div>
            )}

            {/* Right info panel only in input step */}
            {(napMethod === "qr" || napMethod === "flash") && napStep === "input" && <RightInfoPanel />}
          </>}

          {/* ═══════════ RÚT ═══════════ */}
          {tab === "rut" && <>
            <Sidebar methods={RUT_METHODS} active={rutMethod} onSelect={(id) => setRutMethod(id as RutMethod)} />

            {/* NGÂN HÀNG */}
            {rutMethod === "ngan-hang" && (
              <div style={{ flex:1, padding:"18px 22px", display:"flex", flexDirection:"column" }}>
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <span style={{ color:"rgba(255,130,110,0.8)", fontSize:13, fontWeight:700, whiteSpace:"nowrap", width:120, textAlign:"right" }}>Ngân hàng:</span>
                    <select value={bank} onChange={e=>setBank(e.target.value)} style={{
                      flex:1, background:"rgba(0,0,0,0.4)", border:"1.5px solid rgba(180,30,10,0.45)",
                      borderRadius:8, padding:"9px 12px", color: bank ? "#fff" : "rgba(255,255,255,0.3)",
                      fontSize:13, outline:"none", cursor:"pointer",
                    }}>
                      <option value="" disabled>Chọn ngân hàng</option>
                      {BANKS.map(b => <option key={b} value={b} style={{ background:"#1a0000" }}>{b}</option>)}
                    </select>
                  </div>
                  <InputField label="Số tài khoản:" placeholder="Nhập số tài khoản" value={acct} onChange={setAcct} />
                  <InputField label="Tên tài khoản:" placeholder="Nhập tên tài khoản" value={acctName} onChange={setName} />
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <span style={{ color:"rgba(255,130,110,0.8)", fontSize:13, fontWeight:700, whiteSpace:"nowrap", width:120, textAlign:"right" }}>Số tiền:</span>
                    <AmountInput value={rutAmt} onChange={setRutAmt} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:7, marginBottom:12 }}>
                  {RUT_DENOMS.map(a => (
                    <button key={a} onClick={() => setRutAmt(String(a))} style={{
                      ...qBtnStyle(parseInt(rutAmt||"0",10)===a), flex:1,
                    }}>{fmtShort(a)}</button>
                  ))}
                  <button onClick={() => setRutAmt("ALL")} style={{ ...qBtnStyle(rutAmt==="ALL"), flex:1 }}>ALL</button>
                </div>
                {msg && <p style={{ color:msg.ok?"#4ade80":"#f87171", fontSize:12, margin:0, textAlign:"center", marginBottom:8 }}>{msg.text}</p>}
                <ActionBtn label="RÚT TIỀN" color="red"
                  onClick={() => showMsg("Vui lòng liên hệ admin để rút tiền!", false)}
                  disabled={!bank || !acct || !acctName || !rutAmt} />
              </div>
            )}

            {/* TIỀN ẢO */}
            {rutMethod === "tien-ao-r" && (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:36 }}>💎</div>
                <div style={{ color:"rgba(255,130,110,0.7)", fontSize:14, fontWeight:600 }}>Rút qua Tiền Ảo</div>
                <div style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>Liên hệ hỗ trợ để thực hiện</div>
              </div>
            )}

            {/* THẺ CÀO RÚT */}
            {rutMethod === "the-cao-r" && (
              <div style={{ flex:1, padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["Viettel","Vinaphone","Mobifone","Vietnamobile"].map(t => (
                    <button key={t} onClick={() => setRutTel(t)} style={{
                      padding:"6px 16px", borderRadius:20, border:"1.5px solid",
                      borderColor: rutTelecom===t ? TELECOM_COLORS[t] : "rgba(180,30,10,0.3)",
                      background: rutTelecom===t ? TELECOM_COLORS[t]+"22" : "rgba(0,0,0,0.3)",
                      color: rutTelecom===t ? TELECOM_COLORS[t] : "rgba(200,80,60,0.6)",
                      fontWeight:800, fontSize:13, cursor:"pointer",
                    }}>{t}</button>
                  ))}
                </div>
                <div style={{ fontSize:12, color:"rgba(255,130,110,0.65)", fontWeight:600 }}>CHỌN MỆNH GIÁ THẺ</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {NAP_DENOMS.map(d => (
                    <button key={d} onClick={() => setRutDenom(d)} style={{
                      background: rutDenom===d ? "linear-gradient(135deg,#c41c00,#7f0000)" : "rgba(0,0,0,0.3)",
                      border:`1.5px solid ${rutDenom===d ? "#ff4422" : "rgba(180,30,10,0.35)"}`,
                      borderRadius:10, padding:"10px 6px", cursor:"pointer",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                    }}>
                      <span style={{ fontSize:11, color:"rgba(255,200,80,0.8)" }}>🪙 {fmtVnd(d)}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{fmtVnd(d)}</span>
                    </button>
                  ))}
                </div>
                {msg && <p style={{ color:msg.ok?"#4ade80":"#f87171", fontSize:12, margin:0, textAlign:"center" }}>{msg.text}</p>}
                <ActionBtn label="ĐỔI THẺ" color="red"
                  onClick={() => showMsg("Vui lòng liên hệ admin để đổi thẻ!", false)}
                  disabled={!rutDenom} />
              </div>
            )}
          </>}

          {/* ═══════════ KÉT SẮT ═══════════ */}
          {tab === "ket-sat" && (
            <div style={{ flex:1, display:"flex" }}>
              {/* Left — safe info */}
              <div style={{ width:200, borderRight:"1.5px solid rgba(160,20,0,0.35)", padding:"20px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
                <div style={{ fontSize:54 }}>🗄</div>
                <div style={{ color:"#fff", fontWeight:700, fontSize:14 }}>{user?.displayName ?? user?.username}</div>

                {/* Số dư row */}
                <div style={{ width:"100%", background:"rgba(0,0,0,0.35)", borderRadius:10, padding:"10px 12px", border:"1px solid rgba(160,20,0,0.3)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:18 }}>💰</span>
                    <span style={{ color:"rgba(255,180,120,0.8)", fontSize:12, fontWeight:600 }}>Số dư</span>
                  </div>
                  <div style={{ color:"#ffd700", fontWeight:900, fontSize:16, fontFamily:"monospace", textAlign:"right" }}>
                    {currentBalance.toLocaleString("vi-VN")}đ
                  </div>
                </div>

                {/* Két sắt row */}
                <div style={{ width:"100%", background:"rgba(0,0,0,0.35)", borderRadius:10, padding:"10px 12px", border:"1px solid rgba(22,163,74,0.4)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:18 }}>🗄</span>
                    <span style={{ color:"rgba(134,239,172,0.8)", fontSize:12, fontWeight:600 }}>Két sắt</span>
                  </div>
                  <div style={{ color:"#4ade80", fontWeight:900, fontSize:16, fontFamily:"monospace", textAlign:"right" }}>
                    {currentSafe.toLocaleString("vi-VN")}đ
                  </div>
                </div>

                {/* Info */}
                <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11, textAlign:"center", lineHeight:1.5 }}>
                  Tiền trong két sắt<br/>được bảo vệ an toàn
                </div>
              </div>

              {/* Right — action */}
              <div style={{ flex:1, padding:"18px 22px", display:"flex", flexDirection:"column", gap:14 }}>
                {/* Toggle */}
                <div style={{ display:"flex", gap:0, background:"rgba(0,0,0,0.3)", borderRadius:10, padding:4, border:"1px solid rgba(160,20,0,0.3)", alignSelf:"flex-start" }}>
                  {(["gui","rut"] as const).map(m => (
                    <button key={m} onClick={() => { setKsMode(m); setKsAmt(""); }} style={{
                      padding:"9px 28px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:700,
                      background: ksMode===m ? "linear-gradient(135deg,#c41c00,#7f0000)" : "transparent",
                      color: ksMode===m ? "#fff" : "rgba(200,80,60,0.6)",
                      transition:"all 0.15s",
                    }}>{m === "gui" ? "📥 GỬI VÀO KÉT" : "📤 RÚT TỪ KÉT"}</button>
                  ))}
                </div>

                <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12 }}>
                  {ksMode === "gui"
                    ? `Số dư khả dụng: ${currentBalance.toLocaleString("vi-VN")}đ`
                    : `Trong két sắt: ${currentSafe.toLocaleString("vi-VN")}đ`
                  }
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <AmountInput value={ksAmt} onChange={setKsAmt} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}>
                  {KS_QUICK.map(a => (
                    <button key={a} onClick={() => setKsAmt(String(a))} style={qBtnStyle(parseInt(ksAmt||"0",10)===a)}>{fmtShort(a)}</button>
                  ))}
                  <button onClick={() => setKsAmt(ksMode==="gui" ? String(Math.floor(currentBalance)) : String(Math.floor(currentSafe)))} style={qBtnStyle(false)}>ALL</button>
                </div>

                {msg && <p style={{ color:msg.ok?"#4ade80":"#f87171", fontSize:12, margin:0, textAlign:"center" }}>{msg.text}</p>}

                <ActionBtn
                  label={vaultDep.isPending || vaultWith.isPending ? "Đang xử lý..." : ksMode === "gui" ? "📥 GỬI VÀO KÉT SẮT" : "📤 RÚT RA NGOÀI"}
                  color="red"
                  onClick={() => {
                    const n = parseInt(ksAmt, 10);
                    if (!n || n < 1000) { showMsg("Tối thiểu 1,000đ", false); return; }
                    if (ksMode === "gui") {
                      if (n > currentBalance) { showMsg("Số dư không đủ!", false); return; }
                      vaultDep.mutate({ data: { amount: n } }, {
                        onSuccess: () => {
                          showMsg(`✅ Đã gửi ${fmtVnd(n)} vào két sắt!`, true);
                          queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
                          setKsAmt("");
                        },
                        onError: (e: any) => showMsg(e?.response?.data?.error || "Thất bại, thử lại!", false),
                      });
                    } else {
                      if (n > currentSafe) { showMsg("Két sắt không đủ tiền!", false); return; }
                      vaultWith.mutate({ data: { amount: n } }, {
                        onSuccess: () => {
                          showMsg(`✅ Đã rút ${fmtVnd(n)} từ két sắt!`, true);
                          queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
                          setKsAmt("");
                        },
                        onError: (e: any) => showMsg(e?.response?.data?.error || "Thất bại, thử lại!", false),
                      });
                    }
                  }}
                  disabled={!ksAmt || parseInt(ksAmt,10) < 1000 || vaultDep.isPending || vaultWith.isPending}
                />
              </div>
            </div>
          )}

          {/* ═══════════ LỊCH SỬ GD ═══════════ */}
          {tab === "lich-su" && (
            <div style={{ flex:1, padding:"16px 20px", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ color:"rgba(255,130,110,0.75)", fontSize:13, fontWeight:700 }}>Lịch sử giao dịch</span>
                <button onClick={() => history.refetch()} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:16 }}>🔄</button>
              </div>
              <div style={{ overflowY:"auto", maxHeight:300 }}>
                {history.isLoading ? (
                  <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13, textAlign:"center", marginTop:40 }}>Đang tải...</div>
                ) : !history.data?.length ? (
                  <div style={{ color:"rgba(255,255,255,0.3)", fontSize:14, textAlign:"center", marginTop:60, fontWeight:600 }}>Chưa có lịch sử giao dịch</div>
                ) : history.data.slice(0,20).map(b => (
                  <div key={b.id} style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"9px 12px", marginBottom:6,
                    background:"rgba(0,0,0,0.3)", borderRadius:8,
                    border:"1px solid rgba(160,20,0,0.3)",
                  }}>
                    <div>
                      <div style={{ color:b.won?"#4ade80":"#f87171", fontWeight:700, fontSize:13 }}>
                        {b.choice.toUpperCase()} — {b.won ? "THẮNG" : "THUA"}
                      </div>
                      <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>
                        {new Date(b.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ color:"#ff8877", fontWeight:700, fontSize:13 }}>{fmtVnd(b.amount)}</div>
                      <div style={{ color:b.won?"#4ade80":"#f87171", fontSize:12 }}>
                        {b.won ? `+${fmtVnd(b.payout)}` : `-${fmtVnd(b.amount)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:"1.5px solid rgba(160,20,0,0.35)", padding:"7px 14px", display:"flex", justifyContent:"flex-end", background:"rgba(0,0,0,0.18)" }}>
          <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.3)", fontSize:12, fontWeight:700, cursor:"pointer" }}>?</div>
        </div>
      </div>
    </div>
  );
}
