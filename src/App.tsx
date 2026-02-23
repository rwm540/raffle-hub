import React, { useState, useEffect } from 'react';
import { Trophy, X, UserPlus, List, Phone, User, Menu, ChevronRight, Home, Settings, History, LogOut, KeyRound, Ticket } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

type Participant = {
  id: string;
  phone: string;
  ticketNumber: string;
};

type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

const toPersianDigits = (str: string | number) => {
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

  // App State
  const [participants, setParticipants] = useState<Participant[]>([]); const [history, setHistory] = useState<{winner: Participant, date: string}[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "lottery">("dashboard");
  const [currentSubPage, setCurrentSubPage] = useState<'history' | 'settings' | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };
  
  // Lottery State
  const [ticketInput, setTicketInput] = useState('');
  const [isWinnerDialogOpen, setIsWinnerDialogOpen] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- Auth Handlers ---
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPhone.length >= 10) {
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
    } else {
      addNotification('کد وارد شده اشتباه است', 'error');
    }
  };

  const handleLogout = () => {
    setAuthState('login_phone');
    setLoginPhone('');
    setOtpInput('');
    setIsMoreMenuOpen(false);
  };

  // --- App Handlers ---
  const handleRegisterLottery = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketInput.trim() !== '') {
      setParticipants([...participants, { 
        id: Date.now().toString(), 
        phone: loginPhone,
        ticketNumber: ticketInput 
      }]);
      setTicketInput('');
      addNotification('با موفقیت در قرعه‌کشی ثبت‌نام شدید!', 'success');
    }
  };

  const startLottery = () => {
    if (isDrawing || participants.length === 0) return;
    setIsDrawing(true);
    
    setTimeout(() => {
      const randomWinner = participants[Math.floor(Math.random() * participants.length)];
      setWinner(randomWinner); setHistory([{ winner: randomWinner, date: new Date().toLocaleString("fa-IR") }, ...history]);
      setIsDrawing(false);
      setIsWinnerDialogOpen(true);
      
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    }, 2000);
  };

  const maskPhone = (phone: string) => {
    if (phone.length < 7) return toPersianDigits(phone);
    return toPersianDigits(`${phone.substring(0, 4)} *** ${phone.substring(phone.length - 4)}`);
  };

  // --- Render Sub Pages ---
  const renderSubPage = () => {
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
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <History className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold">هنوز قرعه‌کشی انجام نشده است</p>
              </div>
            ) : (
              history.map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-orange-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-orange-500"></div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-mono text-xl text-slate-800 font-bold dir-ltr">{maskPhone(item.winner.phone)}</div>
                    <div className="text-xs text-slate-400 font-bold">{toPersianDigits(item.date)}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                      شانس: {toPersianDigits(item.winner.ticketNumber)}
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

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-500" />
                تنظیمات برنامه
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">اعلان‌های قرعه‌کشی</span>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">حالت شب</span>
                  <div className="w-12 h-6 bg-slate-200 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
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
            ) : activeTab === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Stats 3D Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 shadow-[8px_8px_16px_rgba(16,185,129,0.2),-8px_-8px_16px_#ffffff] text-white relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-10 -mt-10 blur-xl"></div>
                   <div className="flex justify-between items-center relative z-10">
                     <div>
                       <p className="text-emerald-100 text-sm mb-1">تعداد کل شرکت‌کنندگان</p>
                       <p className="text-3xl font-bold">{toPersianDigits(participants.length.toLocaleString("en-US"))} <span className="text-sm font-normal text-emerald-100">نفر</span></p>
                     </div>
                     <div className="w-12 h-12 bg-white/20 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] flex items-center justify-center">
                       <UserPlus className="w-6 h-6 text-white" />
                     </div>
                   </div>
                </div>

                {/* Register for Lottery Card */}
                <div className="bg-white rounded-3xl p-6 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] border border-slate-50 mt-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-[0_8px_16px_rgba(16,185,129,0.3)] flex items-center justify-center mb-6 transform -translate-y-12 mx-auto border-2 border-white">
                    <Ticket className="w-8 h-8 text-white" />
                  </div>
                  
                  <h2 className="text-xl font-bold text-slate-800 text-center mb-2 -mt-6">ثبت‌نام در قرعه‌کشی</h2>
                  <p className="text-slate-500 text-center text-sm mb-6">برای شرکت در قرعه‌کشی یک عدد شانس وارد کنید</p>

                  <form onSubmit={handleRegisterLottery} className="space-y-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Ticket className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={toPersianDigits(ticketInput)}
                        onChange={(e) => setTicketInput(toLatinDigits(e.target.value).replace(/\D/g, ''))}
                        placeholder="مثلا: ۹"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-center dir-ltr font-sans text-xl focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={ticketInput.trim() === ''}
                      className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_6px_0_#047857,0_10px_20px_rgba(16,185,129,0.4)] active:shadow-[0_0px_0_#047857,0_0px_0px_rgba(16,185,129,0.4)] active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Ticket className="w-5 h-5" />
                      <span>ثبت شانس من</span>
                    </button>
                  </form>
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
            onClick={() => setActiveTab('lottery')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'lottery' ? 'text-orange-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`p-3 rounded-2xl ${activeTab === 'lottery' ? 'bg-orange-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' : ''}`}>
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold">قرعه‌کشی</span>
          </button>

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
                      { icon: Settings, label: "تنظیمات", color: "text-orange-500", bg: "bg-orange-50", onClick: () => { setCurrentSubPage('settings'); setIsMoreMenuOpen(false); } },
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

        {/* 3D Winner Dialog */}
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
                      شانس برنده: {toPersianDigits(winner.ticketNumber)}
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
