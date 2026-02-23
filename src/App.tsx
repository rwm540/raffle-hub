import React, { useState, useEffect } from 'react';
import { Trophy, X, UserPlus, List, Phone, User, Menu, ChevronRight, Home, Settings, History, LogOut, KeyRound, Ticket, Database, Code, Clock, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

type Participant = {
  id: number;
  phone: string;
  message_code: string;
  received_at: string;
  is_winner: number;
  eitaa_joined: number;
};

type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

const toPersianDigits = (str: string | number) => {
  if (str === undefined || str === null) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

const toLatinDigits = (str: string) => {
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(persianDigits[i], i.toString());
  }
  return result;
};

export default function App() {
  // Auth State
  const [authState, setAuthState] = useState<'login_phone' | 'login_otp' | 'authenticated'>('login_phone');
  const [loginPhone, setLoginPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // App State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "stage" | "admin">("dashboard");
  const [currentSubPage, setCurrentSubPage] = useState<'history' | 'settings' | 'tech-docs' | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [eitaaStatus, setEitaaStatus] = useState<{connected: boolean, channel: string, last_sync: string} | null>(null);
  
  // Event Config
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Lottery State
  const [ticketInput, setTicketInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [drawingNumber, setDrawingNumber] = useState("*********");

  // Fetch Participants
  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      setParticipants(data);
    } catch (err) {
      console.error("Failed to fetch participants");
    }
  };

  const fetchEitaaStatus = async () => {
    try {
      const res = await fetch('/api/eitaa/status');
      const data = await res.json();
      setEitaaStatus(data);
    } catch (err) {
      console.error("Failed to fetch Eitaa status");
    }
  };

  const syncSms = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sms/sync', { method: 'POST' });
      const data = await res.json();
      addNotification(`${toPersianDigits(data.added)} شرکت‌کننده جدید اضافه شد`, 'success');
      fetchParticipants();
    } catch (err) {
      addNotification('خطا در همگام‌سازی پیامک‌ها', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (authState === 'authenticated') {
      fetchParticipants();
      fetchEitaaStatus();
      const interval = setInterval(() => {
        fetchParticipants();
        fetchEitaaStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [authState]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // --- Auth Handlers ---
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPhone.length >= 10) {
      // Admin backdoor for demo: 0900000000
      if (loginPhone === '0900000000') {
        setIsAdmin(true);
      }
      const otp = Math.floor(10000 + Math.random() * 90000).toString();
      setGeneratedOtp(otp);
      setAuthState('login_otp');
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === generatedOtp) {
      setAuthState('authenticated');
      addNotification('خوش آمدید!', 'success');
      if (loginPhone === '0900000000') setActiveTab('admin');
    } else {
      addNotification('کد وارد شده اشتباه است', 'error');
    }
  };

  const handleLogout = () => {
    setAuthState('login_phone');
    setLoginPhone('');
    setOtpInput('');
    setIsAdmin(false);
    setIsMoreMenuOpen(false);
    setCurrentSubPage(null);
  };

  // --- App Handlers ---
  const handleRegisterLottery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketInput.trim() !== '') {
      try {
        const res = await fetch('/api/sms-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: loginPhone,
            message: ticketInput,
            timestamp: new Date().toISOString()
          })
        });
        
        if (res.ok) {
          addNotification('پیامک شما با موفقیت دریافت شد!', 'success');
          setTicketInput('');
          fetchParticipants();
        } else {
          const data = await res.json();
          addNotification(data.error || 'خطا در ثبت‌نام', 'error');
        }
      } catch (err) {
        addNotification('خطا در اتصال به سرور', 'error');
      }
    }
  };

  const startLottery = async () => {
    if (isDrawing || participants.length === 0) return;
    setIsDrawing(true);
    setWinners([]);
    
    // Animation effect for drawing
    const drawInterval = setInterval(() => {
      const randomPhone = "09" + Math.floor(100000000 + Math.random() * 900000000).toString();
      setDrawingNumber(maskPhone(randomPhone));
    }, 100);

    try {
      const res = await fetch('/api/raffle/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 })
      });
      
      const data = await res.json();
      
      setTimeout(() => {
        clearInterval(drawInterval);
        setWinners(data);
        setIsDrawing(false);
        setDrawingNumber("*********");
        
        // Celebration
        const duration = 10 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 100 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 100 * (timeLeft / duration);
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
      }, 4000);
    } catch (err) {
      clearInterval(drawInterval);
      addNotification('خطا در اجرای قرعه‌کشی', 'error');
      setIsDrawing(false);
    }
  };

  const resetRaffle = async () => {
    await fetch('/api/raffle/reset', { method: 'POST' });
    setWinners([]);
    fetchParticipants();
    addNotification('قرعه‌کشی بازنشانی شد', 'info');
  };

  const exportToCSV = () => {
    if (participants.length === 0) return;
    
    const headers = ["ID", "Phone", "Code", "Date", "Is Winner", "Eitaa Joined"];
    const rows = participants.map(p => [
      p.id,
      p.phone,
      p.message_code,
      p.received_at,
      p.is_winner ? "Yes" : "No",
      p.eitaa_joined ? "Yes" : "No"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `raffle_participants_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('فایل لیست شرکت‌کنندگان آماده دانلود شد', 'success');
  };

  const maskPhone = (phone: string) => {
    if (phone.length < 7) return toPersianDigits(phone);
    return toPersianDigits(`${phone.substring(0, 4)} *** ${phone.substring(phone.length - 4)}`);
  };

  // --- Render Sub Pages ---
  const renderSubPage = () => {
    if (currentSubPage === 'tech-docs') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex flex-col h-full bg-slate-900 text-slate-300 p-6 rounded-3xl overflow-y-auto custom-scrollbar"
        >
          <div className="flex items-center mb-6">
            <button onClick={() => setCurrentSubPage(null)} className="p-2 bg-slate-800 rounded-xl ml-4">
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white">مستندات فنی سیستم</h2>
          </div>

          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" /> ساختار دیتابیس (SQL)
              </h3>
              <pre className="bg-black/50 p-4 rounded-xl font-mono text-xs overflow-x-auto text-emerald-400">
{`CREATE TABLE participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  message_code TEXT,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_winner BOOLEAN DEFAULT 0,
  eitaa_joined BOOLEAN DEFAULT 0
);`}
              </pre>
            </section>

            <section>
              <h3 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" /> منطق وب‌هوک SMS
              </h3>
              <p className="mb-2">سیستم از یک Endpoint اختصاصی برای دریافت پیامک‌ها استفاده می‌کند:</p>
              <ul className="list-disc pr-4 space-y-1">
                <li>اعتبارسنجی کد ارسالی (فقط عدد ۹)</li>
                <li>فیلتر زمانی (فقط بین ساعت ۱۹ تا ۲۱)</li>
                <li>جلوگیری از ثبت‌نام تکراری با شماره موبایل</li>
              </ul>
            </section>

            <section>
              <h3 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> راهکار عضویت اجباری ایتا
              </h3>
              <p>با توجه به محدودیت‌های API ایتا، راهکار پیشنهادی استفاده از یک بات واسط است که:</p>
              <ol className="list-decimal pr-4 space-y-1">
                <li>شماره موبایل را در دیتابیس بات جستجو می‌کند.</li>
                <li>در صورت عدم عضویت، لینک کانال را برای کاربر ارسال می‌کند.</li>
                <li>فقط کاربرانی که تاییدیه عضویت دارند در قرعه‌کشی شرکت داده می‌شوند.</li>
              </ol>
            </section>

            <section>
              <h3 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                <Code className="w-4 h-4" /> تکنولوژی‌های پیشنهادی
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800 p-3 rounded-xl">
                  <div className="font-bold text-white">Backend</div>
                  <div className="text-xs">Node.js / Express</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl">
                  <div className="font-bold text-white">Frontend</div>
                  <div className="text-xs">React Native / Flutter</div>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      );
    }

    if (currentSubPage === 'history') {
      return (
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="flex flex-col h-full"
        >
          <div className="flex items-center mb-8">
            <button 
              onClick={() => setCurrentSubPage(null)}
              className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 ml-4 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-slate-600" />
            </button>
            <h2 className="text-2xl font-black text-slate-800">تاریخچه برندگان</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {participants.filter(p => p.is_winner).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <History className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold">هنوز قرعه‌کشی انجام نشده است</p>
              </div>
            ) : (
              participants.filter(p => p.is_winner).map((p, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-orange-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-orange-500"></div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-mono text-xl text-slate-800 font-bold dir-ltr">{maskPhone(p.phone)}</div>
                    <div className="text-xs text-slate-400 font-bold">{toPersianDigits(new Date(p.received_at).toLocaleDateString('fa-IR'))}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                      شانس: {toPersianDigits(p.message_code)}
                    </div>
                    <Trophy className="w-5 h-5 text-orange-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      );
    }

    if (currentSubPage === 'settings') {
      return (
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="flex flex-col h-full"
        >
          <div className="flex items-center mb-8">
            <button 
              onClick={() => setCurrentSubPage(null)}
              className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 ml-4 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-slate-600" />
            </button>
            <h2 className="text-2xl font-black text-slate-800">تنظیمات حساب</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                اطلاعات کاربری
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <span className="text-slate-500 font-bold">شماره موبایل</span>
                  <span className="font-mono text-slate-800 font-bold dir-ltr">{toPersianDigits(loginPhone)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <span className="text-slate-500 font-bold">وضعیت حساب</span>
                  <span className="text-emerald-600 font-black bg-emerald-50 px-3 py-1 rounded-lg text-xs">فعال</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full p-5 bg-red-50 text-red-600 rounded-3xl font-black flex items-center justify-center gap-3 border border-red-100 active:scale-95 transition-all"
            >
              <LogOut className="w-6 h-6" />
              خروج از حساب
            </button>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  // --- Render Auth Screens ---
  if (authState === 'login_phone' || authState === 'login_otp') {
    return (
      <div className="flex justify-center min-h-screen bg-emerald-50 items-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative p-8 border-2 border-orange-100">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-b-[3rem] -z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center mt-4">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.1)] flex items-center justify-center mb-6 transform rotate-3">
              <Trophy className="w-10 h-10 text-orange-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 mb-2">ورود به سیستم</h1>
            <p className="text-slate-500 text-sm mb-8 text-center">
              {authState === 'login_phone' ? 'برای ورود شماره موبایل خود را وارد کنید' : 'کد تایید ارسال شده را وارد کنید'}
            </p>

            <AnimatePresence mode="wait">
              {authState === 'login_phone' ? (
                <motion.form 
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handlePhoneSubmit} 
                  className="w-full space-y-6"
                >
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={toPersianDigits(loginPhone)}
                      onChange={(e) => setLoginPhone(toLatinDigits(e.target.value).replace(/\D/g, ''))}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-left dir-ltr font-sans text-lg focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loginPhone.length < 10}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_6px_0_#c2410c] active:shadow-[0_0px_0_#c2410c] active:translate-y-[6px] transition-all disabled:opacity-50"
                  >
                    دریافت کد تایید
                  </button>
                </motion.form>
              ) : (
                <motion.form 
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleOtpSubmit} 
                  className="w-full space-y-6"
                >
                  <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-2xl text-center text-sm mb-4">
                    کد تایید تستی شما: <strong className="font-mono text-lg tracking-widest">{toPersianDigits(generatedOtp)}</strong>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={toPersianDigits(otpInput)}
                      onChange={(e) => setOtpInput(toLatinDigits(e.target.value).replace(/\D/g, ''))}
                      placeholder="کد ۵ رقمی"
                      maxLength={5}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-center dir-ltr font-sans text-2xl tracking-widest focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={otpInput.length !== 5}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_6px_0_#047857] active:shadow-[0_0px_0_#047857] active:translate-y-[6px] transition-all disabled:opacity-50"
                  >
                    ورود به برنامه
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthState('login_phone')}
                    className="w-full py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors"
                  >
                    تغییر شماره موبایل
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Main App ---
  return (
    <div className="flex justify-center min-h-screen bg-emerald-50">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl overflow-hidden flex flex-col border-x-2 border-orange-50">        {/* 3D App Bar */}
        <header className="bg-gradient-to-b from-orange-500 to-orange-600 text-white px-4 py-4 shadow-[0_4px_15px_rgba(0,0,0,0.2)] z-10 rounded-b-3xl border-b-4 border-orange-700 flex items-center relative">
          {currentSubPage ? (
            <button 
              onClick={() => setCurrentSubPage(null)}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center ml-3 hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center ml-3">
              <Trophy className="w-5 h-5 text-white" />
            </div>
          )}
          <h1 className="text-xl font-bold tracking-wide drop-shadow-md flex-1">
            {currentSubPage === "history" ? "تاریخچه برندگان" : 
             currentSubPage === "settings" ? "تنظیمات حساب" : 
             "مدیریت قرعه‌کشی"}
          </h1>
          <div className="w-10 h-10 bg-white/20 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-32 custom-scrollbar">
          <AnimatePresence mode="wait">
            {currentSubPage ? (
              renderSubPage()
            ) : activeTab === 'stage' ? (
              <motion.div 
                key="stage"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-12"
              >
                <div className="relative">
                  <motion.div 
                    animate={isDrawing ? { rotate: 360 } : {}}
                    transition={isDrawing ? { repeat: Infinity, duration: 2, ease: "linear" } : {}}
                    className="w-48 h-48 rounded-full border-8 border-orange-500 border-t-emerald-500 flex items-center justify-center shadow-2xl bg-white"
                  >
                    <Trophy className={`w-24 h-24 ${isDrawing ? 'text-orange-500' : 'text-emerald-500'} transition-colors`} />
                  </motion.div>
                  {isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 border-4 border-orange-200 rounded-full animate-ping opacity-20"></div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-slate-800">
                    {isDrawing ? "در حال انتخاب برندگان..." : winners.length > 0 ? "برندگان خوش‌شانس!" : "آماده برای قرعه‌کشی"}
                  </h2>
                  <div className="text-6xl font-mono font-black text-orange-600 tracking-widest dir-ltr h-20 flex items-center justify-center">
                    {isDrawing ? toPersianDigits(drawingNumber) : winners.length > 0 ? "" : "*********"}
                  </div>
                </div>

                {winners.length > 0 && !isDrawing && (
                  <div className="w-full space-y-4">
                    {winners.map((w, i) => (
                      <motion.div 
                        key={w.id}
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.5 }}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-xl flex justify-between items-center text-white border-b-4 border-emerald-700"
                      >
                        <div className="text-3xl font-black">رتبه {toPersianDigits(i + 1)}</div>
                        <div className="text-4xl font-mono font-bold tracking-widest dir-ltr">{maskPhone(w.phone)}</div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {!isDrawing && winners.length === 0 && (
                  <button
                    onClick={startLottery}
                    disabled={participants.length === 0}
                    className="px-12 py-6 bg-gradient-to-b from-orange-400 to-orange-600 text-white rounded-[2rem] text-3xl font-black shadow-[0_10px_0_#c2410c,0_20px_40px_rgba(234,88,12,0.4)] active:shadow-none active:translate-y-2 transition-all disabled:opacity-50"
                  >
                    شروع قرعه‌کشی زنده
                  </button>
                )}

                {winners.length > 0 && !isDrawing && (
                  <button
                    onClick={() => setWinners([])}
                    className="text-slate-400 font-bold hover:text-slate-600 transition-colors"
                  >
                    پاک کردن لیست و شروع مجدد
                  </button>
                )}
              </motion.div>
            ) : activeTab === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Operator Control Panel */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                      <Settings className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">کنترل پنل اپراتور</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 mr-2">شروع مراسم</label>
                      <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-mono text-lg focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 mr-2">پایان مراسم</label>
                      <input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-mono text-lg focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={syncSms}
                    disabled={isSyncing}
                    className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-lg shadow-[0_6px_0_#059669] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'در حال دریافت اطلاعات...' : 'به‌روزرسانی لیست از سامانه پیامکی'}
                  </button>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-50 flex flex-col items-center">
                    <div className="p-4 bg-orange-50 rounded-2xl text-orange-500 mb-4">
                      <UserPlus className="w-8 h-8" />
                    </div>
                    <div className="text-3xl font-black text-slate-800">{toPersianDigits(participants.length)}</div>
                    <div className="text-xs font-bold text-slate-400">کل شرکت‌کنندگان</div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-50 flex flex-col items-center">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500 mb-4">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="text-3xl font-black text-slate-800">{toPersianDigits(participants.filter(p => p.eitaa_joined).length)}</div>
                    <div className="text-xs font-bold text-slate-400">تایید شده ایتا</div>
                  </div>
                </div>

                {/* Eitaa Status Card */}
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <h3 className="font-bold flex items-center gap-2">
                      <Zap className="w-5 h-5 text-emerald-400" /> وضعیت اتصال ایتا
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black ${eitaaStatus?.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {eitaaStatus?.connected ? 'متصل' : 'قطع'}
                    </div>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">کانال هدف:</span>
                      <span className="font-mono text-emerald-400">{eitaaStatus?.channel || '---'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">آخرین بررسی:</span>
                      <span className="text-slate-300">{eitaaStatus ? toPersianDigits(new Date(eitaaStatus.last_sync).toLocaleTimeString('fa-IR')) : '---'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'admin' ? (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
                        <List className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800">مدیریت شرکت‌کنندگان</h2>
                    </div>
                    <button 
                      onClick={exportToCSV}
                      className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                    >
                      <Database className="w-4 h-4" />
                      خروجی اکسل
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {participants.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <UserPlus className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-bold">هنوز شرکت‌کننده‌ای ثبت نشده است</p>
                      </div>
                    ) : (
                      participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-orange-200 transition-all group">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${p.eitaa_joined ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                              <span className="font-mono text-lg font-black text-slate-700">{toPersianDigits(p.phone)}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-bold flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {toPersianDigits(new Date(p.received_at).toLocaleTimeString('fa-IR'))} - {toPersianDigits(new Date(p.received_at).toLocaleDateString('fa-IR'))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {p.is_winner === 1 && (
                              <span className="bg-orange-500 text-white text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg shadow-orange-500/20">
                                <Trophy className="w-3 h-3" /> برنده
                              </span>
                            )}
                            <span className="bg-white text-slate-600 text-[11px] font-black px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                              کد: {toPersianDigits(p.message_code)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="lottery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-full flex flex-col"
              >
                <div className="bg-white rounded-3xl p-6 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] border border-slate-50 flex-1 flex flex-col min-h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">لیست شرکت‌کنندگان</h2>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                      {toPersianDigits(participants.length.toLocaleString('en-US'))} نفر
                    </span>
                  </div>

                  {participants.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-20 h-20 bg-slate-50 rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.05)] flex items-center justify-center mb-4">
                        <List className="w-8 h-8 text-slate-300" />
                      </div>
                      <p>هنوز کسی ثبت‌نام نکرده است</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[300px]">
                      {participants.map((p, i) => (
                        <div key={p.id} className="bg-slate-50 p-4 rounded-2xl flex items-center shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.05)] border border-slate-100">
                          <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-500 font-bold text-sm ml-3 shrink-0">
                            {toPersianDigits(i + 1)}
                          </div>
                          <div className="font-mono text-lg text-slate-700 tracking-wider dir-ltr flex-1 text-left">
                            {maskPhone(p.phone)}
                          </div>
                          <div className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">
                            شانس: {toPersianDigits(p.ticketNumber)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={startLottery}
                  disabled={isDrawing || participants.length === 0}
                  className={`w-full py-5 rounded-2xl text-white font-bold text-xl flex items-center justify-center gap-3 transition-all mt-auto ${
                    isDrawing || participants.length === 0
                      ? 'bg-slate-400 shadow-[0_6px_0_#94a3b8] translate-y-[0px] cursor-not-allowed'
                      : 'bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_8px_0_#c2410c,0_15px_25px_rgba(234,88,12,0.4)] active:shadow-[0_0px_0_#c2410c,0_0px_0px_rgba(234,88,12,0.4)] active:translate-y-[8px]'
                  }`}
                >
                  {isDrawing ? (
                    <span className="animate-pulse">در حال انتخاب برنده...</span>
                  ) : (
                    <>
                      <Trophy className="w-7 h-7" />
                      <span>شروع قرعه‌کشی</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* 3D Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_25px_rgba(0,0,0,0.05)] border-t border-sky-100 px-6 py-4 flex justify-around items-center z-20">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-emerald-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`p-3 rounded-2xl ${activeTab === 'dashboard' ? 'bg-emerald-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' : ''}`}>
              <Home className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold">داشبورد</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('stage')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stage' ? 'text-orange-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`p-3 rounded-2xl ${activeTab === 'stage' ? 'bg-orange-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' : ''}`}>
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold">صحنه اجرا</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'admin' ? 'text-slate-700 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className={`p-3 rounded-2xl ${activeTab === 'admin' ? 'bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' : ''}`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold">مدیریت</span>
            </button>
          )}

          <button 
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center gap-1 transition-all ${isMoreMenuOpen ? 'text-orange-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`p-3 rounded-2xl ${isMoreMenuOpen ? 'bg-orange-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' : ''}`}>
              <Menu className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold">بیشتر</span>
          </button>
        </div>

        {/* Animated Bottom Sheet Menu */}
        <AnimatePresence>
          {isMoreMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsMoreMenuOpen(false)} 
                className="absolute inset-0 bg-slate-900/40 z-40 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }} 
                transition={{ type: "spring", damping: 25, stiffness: 200 }} 
                className="absolute bottom-0 left-0 right-0 bg-white z-50 rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden" 
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
                
                <div className="p-6 pt-2">
                  <div className="flex items-center gap-4 mb-8 bg-sky-50 p-4 rounded-2xl border border-sky-100">
                    <div className="w-14 h-14 bg-orange-500 rounded-2xl shadow-lg flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">کاربر تستی</h2>
                      <p className="text-slate-500 font-mono text-sm dir-ltr text-right">{toPersianDigits(loginPhone)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                      { icon: History, label: "تاریخچه", color: "text-emerald-500", bg: "bg-emerald-50", onClick: () => { setCurrentSubPage('history'); setIsMoreMenuOpen(false); } },
                      { icon: Code, label: "مستندات فنی", color: "text-orange-500", bg: "bg-orange-50", onClick: () => { setCurrentSubPage('tech-docs'); setIsMoreMenuOpen(false); } },
                      { icon: Settings, label: "تنظیمات", color: "text-blue-500", bg: "bg-blue-50", onClick: () => { setCurrentSubPage('settings'); setIsMoreMenuOpen(false); } },
                    ].map((item, i) => (
                      <button 
                        key={i} 
                        onClick={item.onClick}
                        className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl shadow-[4px_4px_10px_rgba(0,0,0,0.05)] border border-slate-50 active:scale-95 transition-all" 
                      >
                        <div className={`p-4 rounded-2xl ${item.bg} ${item.color}`}>
                          <item.icon className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-slate-700">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors mb-4" 
                  >
                    <LogOut className="w-6 h-6" />
                    <span>خروج از حساب کاربری</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 3D Winner Dialog (Single Winner - Legacy) */}
        <AnimatePresence>
          {isWinnerDialogOpen && winner && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 z-50 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 50, rotateX: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50, rotateX: -20 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                style={{ perspective: 1000 }}
                className="w-full max-w-sm"
              >
                <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.8)] border border-slate-100 relative flex flex-col items-center text-center transform-gpu">
                  
                  <button 
                    onClick={() => setIsWinnerDialogOpen(false)}
                    className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-[0_10px_20px_rgba(234,88,12,0.4),inset_0_4px_4px_rgba(255,255,255,0.4)] flex items-center justify-center mb-6 border-4 border-white -mt-16">
                    <Trophy className="w-12 h-12 text-white drop-shadow-md" />
                  </div>
                  
                  <h3 className="text-3xl font-black text-slate-800 mb-2 drop-shadow-sm">برنده خوش‌شانس!</h3>
                  <p className="text-slate-500 mb-8 font-medium">تبریک! قرعه‌کشی با موفقیت انجام شد</p>
                  
                  <div className="bg-slate-800 w-full rounded-3xl p-6 mb-8 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5),0_4px_10px_rgba(0,0,0,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 rounded-t-3xl"></div>
                    <div className="text-slate-400 text-sm mb-2 relative z-10">شماره تماس برنده</div>
                    <div className="font-mono text-3xl text-orange-400 font-bold tracking-widest dir-ltr relative z-10 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">
                      {toPersianDigits(winner.phone)}
                    </div>
                    <div className="mt-4 text-emerald-400 font-bold text-lg relative z-10">
                      شانس برنده: {toPersianDigits(winner.message_code)}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsWinnerDialogOpen(false)}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_6px_0_#065f46,0_10px_20px_rgba(0,0,0,0.2)] active:shadow-[0_0px_0_#065f46,0_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[6px] transition-all"
                  >
                    تایید و بستن
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Notifications (Toasts) */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[320px] pointer-events-none flex flex-col gap-3">
          <AnimatePresence>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto p-4 rounded-2xl shadow-lg border-2 flex items-center gap-3 backdrop-blur-md ${
                  n.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                  n.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
                  'bg-slate-800/90 border-slate-700 text-white'
                }`}
              >
                <div className="flex-1 font-bold text-sm">{n.message}</div>
                <button 
                  onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
