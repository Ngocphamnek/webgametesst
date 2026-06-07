import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import bgImage from "@assets/image_1780704431202.png";

const authSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
  password: z.string().min(4, "Mật khẩu tối thiểu 4 ký tự"),
});

function DiamondDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-red-700/70" />
      <div className="flex items-center gap-2">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 0L10 5L5 10L0 5Z" fill="hsl(0 100% 45%)" />
        </svg>
        <span
          className="text-white font-serif font-bold text-xl tracking-widest uppercase"
          style={{ textShadow: "0 0 12px rgba(220,0,0,0.8), 0 0 24px rgba(220,0,0,0.4)" }}
        >
          {label}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 0L10 5L5 10L0 5Z" fill="hsl(0 100% 45%)" />
        </svg>
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-red-700/70" />
    </div>
  );
}

function GameInput({
  icon,
  placeholder,
  type = "text",
  testId,
  field,
}: {
  icon: "user" | "lock";
  placeholder: string;
  type?: string;
  testId?: string;
  field: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const [showPass, setShowPass] = useState(false);
  const actualType = type === "password" ? (showPass ? "text" : "password") : type;

  return (
    <div className="input-glow flex items-center gap-3 rounded bg-black/60 border border-red-800/60 px-4 py-3 transition-all">
      {icon === "user" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" fill="hsl(0 100% 45%)" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="hsl(0 100% 45%)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2" fill="hsl(0 100% 45%)" />
          <path d="M8 11V7a4 4 0 018 0v4" stroke="hsl(0 100% 45%)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      <div className="w-px h-5 bg-red-800/60" />
      <input
        {...field}
        type={actualType}
        placeholder={placeholder}
        data-testid={testId}
        className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-sm"
      />
      {type === "password" && (
        <button
          type="button"
          onClick={() => setShowPass((p) => !p)}
          className="text-gray-500 hover:text-red-400 transition-colors"
        >
          {showPass ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

function LoginForm() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  const mutation = useLogin();

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof authSchema>) => {
    mutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast({ title: "Chào mừng trở lại!", description: res.user.username });
        setLocation("/game");
      },
      onError: () => {
        toast({ title: "Đăng nhập thất bại", description: "Sai tên hoặc mật khẩu", variant: "destructive" });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <GameInput icon="user" placeholder="Tên đăng nhập" testId="input-username" field={field} />
              </FormControl>
              <FormMessage className="text-red-400 text-xs pl-1" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <GameInput icon="lock" placeholder="Mật khẩu" type="password" testId="input-password" field={field} />
              </FormControl>
              <FormMessage className="text-red-400 text-xs pl-1" />
            </FormItem>
          )}
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          data-testid="button-login"
          className="btn-red-glow w-full py-3 rounded font-serif font-bold text-white text-lg tracking-widest uppercase disabled:opacity-60 mt-1"
        >
          {mutation.isPending ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
        </button>
      </form>
    </Form>
  );
}

function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const registerSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
  displayName: z.string().min(2, "Tên hiển thị tối thiểu 2 ký tự"),
  password: z.string().min(4, "Mật khẩu tối thiểu 4 ký tự"),
  confirmPassword: z.string().min(4, "Vui lòng xác nhận mật khẩu"),
  captcha: z.string().length(6, "Nhập đủ 6 ký tự"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { setToken } = useAuth();
  const { toast } = useToast();
  const mutation = useRegister();
  const [, setLocation] = useLocation();
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptcha());

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", displayName: "", password: "", confirmPassword: "", captcha: "" },
  });

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    form.setValue("captcha", "");
  };

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    if (values.captcha.toUpperCase() !== captchaCode) {
      form.setError("captcha", { message: "Mã xác nhận không đúng" });
      refreshCaptcha();
      return;
    }
    mutation.mutate({ data: { username: values.username, displayName: values.displayName, password: values.password } }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast({ title: "Tạo tài khoản thành công!", description: `Chào mừng ${res.user.displayName ?? res.user.username}!` });
        setLocation("/game");
      },
      onError: () => {
        toast({ title: "Đăng ký thất bại", description: "Tên đăng nhập đã tồn tại", variant: "destructive" });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-4">
        {/* Username */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <GameInput icon="user" placeholder="Tên đăng ký" testId="input-reg-username" field={field} />
              </FormControl>
              <FormMessage className="text-red-400 text-xs pl-1" />
            </FormItem>
          )}
        />

        {/* Display Name */}
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <GameInput icon="user" placeholder="Tên hiển thị" testId="input-reg-displayname" field={field} />
              </FormControl>
              <FormMessage className="text-red-400 text-xs pl-1" />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <GameInput icon="lock" placeholder="Mật khẩu" type="password" testId="input-reg-password" field={field} />
              </FormControl>
              <FormMessage className="text-red-400 text-xs pl-1" />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <GameInput icon="lock" placeholder="Xác nhận mật khẩu" type="password" testId="input-reg-confirm" field={field} />
              </FormControl>
              <FormMessage className="text-red-400 text-xs pl-1" />
            </FormItem>
          )}
        />

        {/* Captcha */}
        <FormField
          control={form.control}
          name="captcha"
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-2 items-stretch">
                {/* Generated code display */}
                <div
                  className="flex items-center justify-center px-3 rounded border border-red-800/60 bg-black/70 select-none min-w-[110px]"
                  style={{
                    background: "linear-gradient(135deg, #1a0000 0%, #2d0000 100%)",
                    letterSpacing: "0.35em",
                    fontFamily: "monospace",
                  }}
                >
                  {captchaCode.split("").map((char, i) => (
                    <span
                      key={i}
                      className="font-bold text-lg"
                      style={{
                        color: i % 2 === 0 ? "#ff4444" : "#ff8888",
                        transform: `rotate(${(Math.random() * 10 - 5).toFixed(0)}deg)`,
                        display: "inline-block",
                        textShadow: "0 0 6px rgba(255,0,0,0.5)",
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>

                {/* Refresh button */}
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  title="Làm mới mã"
                  className="px-2 rounded border border-red-800/40 bg-black/40 hover:border-red-600 hover:bg-red-950/30 transition-all text-red-500"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                  </svg>
                </button>

                {/* User input */}
                <FormControl>
                  <input
                    {...field}
                    maxLength={6}
                    placeholder="Nhập mã"
                    data-testid="input-captcha"
                    className="flex-1 bg-black/60 border border-red-800/60 rounded px-3 py-3 text-white placeholder-gray-600 text-sm font-mono tracking-widest outline-none focus:border-red-500 transition-all uppercase min-w-0"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-red-400 text-xs pl-1" />
            </FormItem>
          )}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          data-testid="button-register-submit"
          className="btn-red-glow w-full py-3 rounded font-serif font-bold text-white text-lg tracking-widest uppercase disabled:opacity-60 mt-1"
        >
          {mutation.isPending ? "ĐANG TẠO..." : "ĐĂNG KÝ"}
        </button>
      </form>
    </Form>
  );
}

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen w-full bg-black flex flex-col overflow-x-hidden">
      {/* Logo image */}
      <img
        src={bgImage}
        alt="HARU88"
        className="w-full object-cover object-top"
        style={{ maxHeight: "55vw", minHeight: "200px" }}
      />

      {/* Form area */}
      <div
        className="flex-1 w-full flex flex-col items-center px-4 pb-6 pt-4"
        style={{ background: "linear-gradient(to bottom, #0a0000 0%, #050000 100%)" }}
      >
        <div className="w-full max-w-sm space-y-4">
          {/* Main panel */}
          <div className="panel-border rounded-lg bg-black/80 backdrop-blur-sm p-5 relative">
            <span className="corner-deco tl" />
            <span className="corner-deco tr" />
            <span className="corner-deco bl" />
            <span className="corner-deco br" />

            {/* Tab switcher */}
            <div className="flex rounded overflow-hidden border border-red-900/50 mb-5">
              <button
                type="button"
                onClick={() => setMode("login")}
                data-testid="tab-login"
                className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest transition-all ${
                  mode === "login"
                    ? "bg-red-700 text-white shadow-[inset_0_0_12px_rgba(0,0,0,0.4)]"
                    : "bg-black/60 text-gray-500 hover:text-gray-300"
                }`}
              >
                ĐĂNG NHẬP
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                data-testid="tab-register"
                className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-widest transition-all ${
                  mode === "register"
                    ? "bg-red-700 text-white shadow-[inset_0_0_12px_rgba(0,0,0,0.4)]"
                    : "bg-black/60 text-gray-500 hover:text-gray-300"
                }`}
              >
                ĐĂNG KÝ
              </button>
            </div>

            {/* Form content */}
            <DiamondDivider label={mode === "login" ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"} />

            {mode === "login" ? (
              <LoginForm />
            ) : (
              <RegisterForm onSuccess={() => setMode("login")} />
            )}

            {/* Switch hint */}
            <p className="text-center text-gray-600 text-xs mt-4">
              {mode === "login" ? (
                <>
                  Chưa có tài khoản?{" "}
                  <button type="button" onClick={() => setMode("register")} className="text-red-500 hover:text-red-400 font-bold">
                    Đăng ký ngay
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-red-500 hover:text-red-400 font-bold">
                    Đăng nhập
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Footer info */}
          <div className="border border-red-900/30 rounded-lg bg-black/60 p-5 space-y-4">
            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(0 100% 45%)" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span className="text-gray-300 text-xs font-bold">BẢO MẬT</span>
                <span className="text-gray-500 text-xs">SSL 256-bit</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(0 100% 45%)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <span className="text-gray-300 text-xs font-bold">24/7</span>
                <span className="text-gray-500 text-xs">Hỗ trợ</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(0 100% 45%)" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <span className="text-gray-300 text-xs font-bold">UY TÍN</span>
                <span className="text-gray-500 text-xs">100K+ thành viên</span>
              </div>
            </div>

            <div className="h-px bg-red-900/30" />

            {/* About */}
            <div>
              <p className="text-red-400 font-bold text-xs uppercase tracking-widest mb-2">Giới Thiệu</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                HARU88 là nền tảng game bài đỉnh cao hàng đầu Việt Nam với hàng trăm trò chơi hấp dẫn: Tài Xỉu, Xóc Đĩa, Bầu Cua, Poker và nhiều hơn nữa. Hệ thống được vận hành minh bạch, công bằng và bảo mật tuyệt đối.
              </p>
            </div>

            <div className="h-px bg-red-900/30" />

            {/* Features */}
            <div className="space-y-1.5">
              {[
                "Nap/rut tien nhanh chong trong 5 phut",
                "Khuyen mai hang ngay cho thanh vien moi",
                "Giao dich bao mat, khong lo mat tien",
                "Ho tro 24/7 qua Zalo, Telegram",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" className="mt-0.5 shrink-0" fill="none">
                    <path d="M6 0L7.4 4.6H12L8.3 7.4L9.7 12L6 9.2L2.3 12L3.7 7.4L0 4.6H4.6Z" fill="hsl(0 100% 45%)" />
                  </svg>
                  <span className="text-gray-400 text-xs">{item}</span>
                </div>
              ))}
            </div>

            <div className="h-px bg-red-900/30" />

            {/* Copyright */}
            <div className="text-center space-y-1">
              <p className="text-red-700/80 text-xs font-bold uppercase tracking-widest">HARU88 © 2024</p>
              <p className="text-gray-600 text-xs">Bản quyền thuộc về HARU88. Mọi hành vi sao chép đều bị nghiêm cấm.</p>
              <p className="text-gray-700 text-xs">Chỉ dành cho người trên 18 tuổi. Chơi có trách nhiệm.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
