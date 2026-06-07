import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAdminListUsers, useAdminAdjustBalance, useAdminResetPassword, useAdminDeleteUser, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListUsersQueryKey } from "@workspace/api-client-react";

export default function AdminPage() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [modal, setModal] = useState<"adjust" | "reset" | "delete" | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const reqOptions = { request: { headers: { Authorization: `Bearer ${token}` } } };
  const { data: user } = useGetMe(reqOptions);

  const { data: users = [], isLoading } = useAdminListUsers(reqOptions);
  const adjustMut = useAdminAdjustBalance({ mutation: {
    onSuccess: () => { invalidate(); showToast("Cập nhật số dư thành công!", true); closeModal(); }
  }, ...reqOptions });
  const resetMut = useAdminResetPassword({ mutation: {
    onSuccess: () => { showToast("Đổi mật khẩu thành công!", true); closeModal(); }
  }, ...reqOptions });
  const deleteMut = useAdminDeleteUser({ mutation: {
    onSuccess: () => { invalidate(); showToast("Đã xóa người dùng!", true); closeModal(); }
  }, ...reqOptions });

  function invalidate() { qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() }); }
  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }
  function closeModal() { setModal(null); setAdjustAmount(""); setAdjustNote(""); setNewPwd(""); }
  function openModal(uid: number, type: "adjust" | "reset" | "delete") {
    setSelectedUser(uid); setModal(type);
  }

  if (!user?.isAdmin) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"#ef4444", fontSize:20, fontWeight:700 }}>⛔ Không có quyền truy cập</div>
      </div>
    );
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const sel = users.find(u => u.id === selectedUser);

  const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

  return (
    <div style={{ minHeight:"100vh", background:"#0d0d0d", color:"#e5e5e5", fontFamily:"Inter, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:20, right:20, zIndex:9999,
          background: toast.ok ? "#16a34a" : "#dc2626",
          color:"#fff", padding:"12px 20px", borderRadius:10,
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)", fontWeight:600, fontSize:14,
          animation:"slideIn 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background:"linear-gradient(90deg, #1a0000 0%, #2d0a0a 50%, #1a0000 100%)",
        borderBottom:"1px solid rgba(220,38,38,0.3)",
        padding:"16px 24px", display:"flex", alignItems:"center", gap:16,
      }}>
        <button onClick={() => setLocation("/game")} style={{
          background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)",
          borderRadius:8, color:"#fff", padding:"8px 14px", cursor:"pointer", fontSize:14,
        }}>← Quay lại</button>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:36, height:36, background:"linear-gradient(135deg, #dc2626, #991b1b)",
            borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, boxShadow:"0 0 12px rgba(220,38,38,0.5)",
          }}>👑</div>
          <div>
            <div style={{ fontWeight:800, fontSize:18, color:"#fff" }}>ADMIN PANEL</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>HARU88 Management</div>
          </div>
        </div>
        <div style={{ marginLeft:"auto", fontSize:13, color:"rgba(255,255,255,0.6)" }}>
          Đăng nhập: <span style={{ color:"#f59e0b", fontWeight:700 }}>{user.displayName ?? user.username}</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display:"flex", gap:16, padding:"20px 24px", flexWrap:"wrap" }}>
        {[
          { label:"Tổng người dùng", value: users.length, icon:"👥", color:"#3b82f6" },
          { label:"Tổng số dư", value: fmt(users.reduce((a,u) => a+u.balance, 0)), icon:"💰", color:"#16a34a" },
          { label:"Tổng lượt cược", value: users.reduce((a,u) => a+u.totalBets, 0).toLocaleString("vi-VN"), icon:"🎲", color:"#f59e0b" },
          { label:"Admin", value: users.filter(u=>u.isAdmin).length, icon:"👑", color:"#dc2626" },
        ].map(s => (
          <div key={s.label} style={{
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:12, padding:"16px 20px", flex:"1 1 180px",
            borderTop:`3px solid ${s.color}`,
          }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>{s.value}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding:"0 24px 16px" }}>
        <input
          placeholder="🔍 Tìm kiếm theo tên người dùng..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width:"100%", maxWidth:400, background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(255,255,255,0.12)", borderRadius:10,
            color:"#fff", padding:"10px 16px", fontSize:14, outline:"none",
            boxSizing:"border-box",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ padding:"0 24px 40px", overflowX:"auto" }}>
        <div style={{
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:12, overflow:"hidden",
        }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"rgba(255,255,255,0.06)" }}>
                {["#ID","Người dùng","Số dư","Lượt cược","Ngày tạo","Quyền","Thao tác"].map(h => (
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:600, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ padding:40, textAlign:"center", color:"rgba(255,255,255,0.4)" }}>Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:40, textAlign:"center", color:"rgba(255,255,255,0.4)" }}>Không tìm thấy người dùng</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} style={{
                  borderTop:"1px solid rgba(255,255,255,0.05)",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                  transition:"background 0.15s",
                }}>
                  <td style={{ padding:"12px 16px", color:"rgba(255,255,255,0.4)", fontSize:13 }}>#{u.id}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ fontWeight:600, color:"#fff", fontSize:14 }}>{u.displayName ?? u.username}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>@{u.username}</div>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ fontWeight:700, color:"#f59e0b", fontSize:14 }}>
                      {u.balance.toLocaleString("vi-VN")}đ
                    </span>
                  </td>
                  <td style={{ padding:"12px 16px", color:"rgba(255,255,255,0.7)", fontSize:13 }}>
                    {u.totalBets.toLocaleString("vi-VN")}
                  </td>
                  <td style={{ padding:"12px 16px", color:"rgba(255,255,255,0.5)", fontSize:12 }}>
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    {u.isAdmin
                      ? <span style={{ background:"rgba(220,38,38,0.2)", color:"#f87171", borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700 }}>Admin</span>
                      : <span style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)", borderRadius:6, padding:"3px 10px", fontSize:12 }}>User</span>
                    }
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => openModal(u.id, "adjust")} title="Nạp/rút tiền" style={{
                        background:"linear-gradient(135deg, #15803d, #166534)", border:"none",
                        borderRadius:7, color:"#fff", padding:"6px 12px", cursor:"pointer",
                        fontSize:12, fontWeight:600,
                      }}>💰 Số dư</button>
                      <button onClick={() => openModal(u.id, "reset")} title="Đổi mật khẩu" style={{
                        background:"linear-gradient(135deg, #1d4ed8, #1e40af)", border:"none",
                        borderRadius:7, color:"#fff", padding:"6px 12px", cursor:"pointer",
                        fontSize:12, fontWeight:600,
                      }}>🔑 Mật khẩu</button>
                      {!u.isAdmin && (
                        <button onClick={() => openModal(u.id, "delete")} title="Xóa tài khoản" style={{
                          background:"linear-gradient(135deg, #991b1b, #7f1d1d)", border:"none",
                          borderRadius:7, color:"#fff", padding:"6px 12px", cursor:"pointer",
                          fontSize:12, fontWeight:600,
                        }}>🗑 Xóa</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center",
        }} onClick={closeModal}>
          <div style={{
            background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:16, padding:28, width:"100%", maxWidth:380, margin:"0 16px",
          }} onClick={e => e.stopPropagation()}>

            {modal === "adjust" && (
              <>
                <div style={{ fontWeight:800, fontSize:17, color:"#fff", marginBottom:4 }}>💰 Điều chỉnh số dư</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:20 }}>
                  Người dùng: <strong style={{ color:"#f59e0b" }}>@{sel?.username}</strong>
                  &nbsp;·&nbsp;Hiện tại: <strong style={{ color:"#4ade80" }}>{sel?.balance.toLocaleString("vi-VN")}đ</strong>
                </div>
                <input
                  type="number" placeholder="Số tiền (âm = rút, dương = nạp)"
                  value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Ghi chú (bắt buộc)"
                  value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
                  style={{ ...inputStyle, marginTop:10 }}
                />
                <div style={{ display:"flex", gap:10, marginTop:18 }}>
                  <button onClick={closeModal} style={cancelBtnStyle}>Hủy</button>
                  <button
                    disabled={!adjustAmount || !adjustNote || adjustMut.isPending}
                    onClick={() => {
                      if (!selectedUser) return;
                      adjustMut.mutate({ id: selectedUser, data: { amount: Number(adjustAmount), note: adjustNote } });
                    }}
                    style={{
                      ...confirmBtnStyle,
                      background: Number(adjustAmount) < 0
                        ? "linear-gradient(135deg, #dc2626, #991b1b)"
                        : "linear-gradient(135deg, #16a34a, #15803d)",
                    }}
                  >
                    {adjustMut.isPending ? "Đang xử lý..." : Number(adjustAmount) >= 0 ? "✅ Nạp tiền" : "🔻 Rút tiền"}
                  </button>
                </div>
              </>
            )}

            {modal === "reset" && (
              <>
                <div style={{ fontWeight:800, fontSize:17, color:"#fff", marginBottom:4 }}>🔑 Đặt lại mật khẩu</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:20 }}>
                  Người dùng: <strong style={{ color:"#f59e0b" }}>@{sel?.username}</strong>
                </div>
                <input
                  type="password" placeholder="Mật khẩu mới (tối thiểu 4 ký tự)"
                  value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ display:"flex", gap:10, marginTop:18 }}>
                  <button onClick={closeModal} style={cancelBtnStyle}>Hủy</button>
                  <button
                    disabled={newPwd.length < 4 || resetMut.isPending}
                    onClick={() => {
                      if (!selectedUser) return;
                      resetMut.mutate({ id: selectedUser, data: { newPassword: newPwd } });
                    }}
                    style={{ ...confirmBtnStyle, background:"linear-gradient(135deg, #1d4ed8, #1e40af)" }}
                  >
                    {resetMut.isPending ? "Đang xử lý..." : "🔑 Xác nhận đổi"}
                  </button>
                </div>
              </>
            )}

            {modal === "delete" && (
              <>
                <div style={{ fontWeight:800, fontSize:17, color:"#ef4444", marginBottom:8 }}>⚠️ Xác nhận xóa tài khoản</div>
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.7)", marginBottom:20, lineHeight:1.6 }}>
                  Bạn sắp xóa tài khoản <strong style={{ color:"#f59e0b" }}>@{sel?.username}</strong>
                  &nbsp;và toàn bộ lịch sử cược. <strong style={{ color:"#ef4444" }}>Hành động này không thể hoàn tác!</strong>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={closeModal} style={cancelBtnStyle}>Hủy</button>
                  <button
                    disabled={deleteMut.isPending}
                    onClick={() => { if (!selectedUser) return; deleteMut.mutate({ id: selectedUser }); }}
                    style={{ ...confirmBtnStyle, background:"linear-gradient(135deg, #dc2626, #991b1b)" }}
                  >
                    {deleteMut.isPending ? "Đang xóa..." : "🗑 Xóa tài khoản"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.15)",
  borderRadius:10, color:"#fff", padding:"11px 14px", fontSize:14, outline:"none",
  boxSizing:"border-box",
};

const cancelBtnStyle: React.CSSProperties = {
  flex:1, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
  borderRadius:10, color:"rgba(255,255,255,0.7)", padding:"11px", cursor:"pointer",
  fontSize:14, fontWeight:600,
};

const confirmBtnStyle: React.CSSProperties = {
  flex:2, border:"none", borderRadius:10, color:"#fff",
  padding:"11px", cursor:"pointer", fontSize:14, fontWeight:700,
};
