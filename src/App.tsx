import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  Menu,
  Heart,
  ChefHat,
  MessageSquareCode,
  BookOpen,
  Calendar,
  Info,
  Clock,
  ExternalLink,
  Coins,
  BookOpenCheck,
  Wrench,
  Globe
} from "lucide-react";
import SakuResep from "./components/SakuResep";
import SakuSopan from "./components/SakuSopan";
import SakuCurhat from "./components/SakuCurhat";
import SakuTanya from "./components/SakuTanya";
import SakuBelanja from "./components/SakuBelanja";
import SakuKamus from "./components/SakuKamus";
import SakuSolusi from "./components/SakuSolusi";
import { ActiveTab, SakuLanguage } from "./types";
import { getTranslation } from "./translations";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("resep");
  const [lang, setLang] = useState<SakuLanguage>("id");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"gemini" | "local">("gemini");
  const [healthStatus, setHealthStatus] = useState<{ status: string; apiKeyConfigured: boolean } | null>(null);

  // Audio elements references for playing Gemini core TTS
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Assistant talking animation trigger
  const [characterEmote, setCharacterEmote] = useState<"wave" | "talk" | "heart" | "think">("wave");
  const [characterBubble, setCharacterBubble] = useState<string>("");

  // Local Time clock for family dashboard
  const [localTime, setLocalTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch API Health on startup
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus(data);
        if (!data.apiKeyConfigured) {
          setCharacterBubble(
            lang === "id"
              ? "Peringatan: Kunci API Gemini belum dikonfigurasi di secrets. Beberapa fitur lokal tetap berjalan!"
              : "Warning: Gemini API Key is not set in secrets yet."
          );
        }
      })
      .catch(() => console.warn("Backend server loading..."));
  }, []);

  // Sync mascot dialogue on language/tab shift
  useEffect(() => {
    stopSpeech();
    let text = "";
    if (activeTab === "resep") {
      setCharacterEmote("think");
      text = getTranslation("okaResep", lang);
    } else if (activeTab === "sopan") {
      setCharacterEmote("wave");
      text = getTranslation("okaSopan", lang);
    } else if (activeTab === "curhat") {
      setCharacterEmote("heart");
      text = getTranslation("okaCurhat", lang);
    } else if (activeTab === "tanya") {
      setCharacterEmote("think");
      text = getTranslation("okaTanya", lang);
    } else if (activeTab === "belanja") {
      setCharacterEmote("wave");
      text = getTranslation("okaBelanja", lang);
    } else if (activeTab === "kamus") {
      setCharacterEmote("talk");
      text = getTranslation("okaKamus", lang);
    } else if (activeTab === "solusi") {
      setCharacterEmote("think");
      text = getTranslation("okaSolusi", lang);
    } else {
      text = getTranslation("okaWelcome", lang);
    }
    setCharacterBubble(text);
  }, [activeTab, lang]);

  // Safe global voice stop
  const stopSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
    }
    setIsSpeaking(false);
    setCharacterEmote("wave");
  };

  const speakText = async (text: string) => {
    stopSpeech();
    setIsSpeaking(true);
    setCharacterEmote("talk");

    if (voiceMode === "gemini") {
      try {
        const cleanText = text.replace(/[*#]/g, "").slice(0, 300);

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanText,
            voice: activeTab === "curhat" ? "female" : "male",
            lang,
          }),
        });

        if (!response.ok) throw new Error("TTS route error");

        const data = await response.json();
        const base64Audio = data.audio;

        if (!base64Audio) throw new Error("No audio bytes returned");

        const audioUrl = `data:audio/wav;base64,${base64Audio}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          setCharacterEmote("wave");
        };

        audio.onerror = (e) => {
          console.warn("HTML Audio play failed, falling back to local speech synthesis...", e);
          speakTextLocal(text);
        };

        await audio.play();
      } catch (err) {
        console.warn("Server TTS fell back to native web SpeechSynthesis because:", err);
        speakTextLocal(text);
      }
    } else {
      speakTextLocal(text);
    }
  };

  const speakTextLocal = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSpeaking(false);
      setCharacterEmote("wave");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "en" ? "en-US" : lang === "zh" ? "zh-CN" : lang === "ar" ? "ar-SA" : "id-ID";
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      setIsSpeaking(false);
      setCharacterEmote("wave");
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCharacterEmote("wave");
    };

    window.speechSynthesis.speak(utterance);
  };

  const getAvatarEmoji = () => {
    if (isSpeaking) return "🗣️";
    switch (characterEmote) {
      case "talk":
        return "🗣️";
      case "think":
        return "🤔";
      case "heart":
        return "💖";
      default:
        return "🤖";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-100 pb-16 flex flex-col justify-between">
      {/* Header Panel */}
      <header className="bg-white border-b border-slate-100 py-3.5 px-4 sticky top-0 z-40 shadow-3xs">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm tracking-wider">
              SDY
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">SakuDaya AI</h1>
                <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  {getTranslation("familyBadge", lang)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">{getTranslation("slogan", lang)}</p>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            {/* Clock */}
            <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{localTime || "..."} UTC</span>
            </div>

            {/* Language Picker */}
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[11px] gap-0.5">
              {[
                { code: "id", icon: "🇮🇩", text: "Indo" },
                { code: "en", icon: "🇺🇸", text: "Eng" },
                { code: "zh", icon: "🇨🇳", text: "繁中" },
                { code: "ar", icon: "🇸🇦", text: "العربية" }
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLang(item.code as SakuLanguage)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    lang === item.code ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden md:inline">{item.text}</span>
                </button>
              ))}
            </div>

            {/* Voice option */}
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[11px]">
              <button
                id="btn-voice-gemini"
                onClick={() => setVoiceMode("gemini")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  voiceMode === "gemini" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-400"
                }`}
              >
                🎙️ {getTranslation("btnVoiceStudio", lang).split(" ")[1] || "Studio"}
              </button>
              <button
                id="btn-voice-local"
                onClick={() => setVoiceMode("local")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  voiceMode === "local" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-400"
                }`}
              >
                📱 {getTranslation("btnVoiceLocal", lang).split(" ")[1] || "Local"}
              </button>
            </div>

            {isSpeaking && (
              <button
                id="btn-global-mute"
                onClick={stopSpeech}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-transform animate-bounce cursor-pointer flex items-center gap-1"
              >
                <VolumeX className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold pr-1">{getTranslation("btnMute", lang)}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
        {/* Hello Oka Assistant bubble */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/50 rounded-3xl p-4 sm:p-5 flex items-start gap-4 shadow-3xs">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-3xl shadow-sm shrink-0 select-none animate-pulse">
            {getAvatarEmoji()}
          </div>
          <div className="space-y-1 w-full">
            <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
              <span>Sobat Oka ({lang === "id" ? "Asisten Pintar" : "AI Assistant"})</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            </h4>
            <p className="text-xs sm:text-md text-slate-800 font-extrabold leading-relaxed whitespace-pre-line">
              {characterBubble}
            </p>
          </div>
        </div>

        {/* 7 Pocket Tabs Options Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Tab 1: Resep */}
          <button
            id="btn-tab-resep"
            onClick={() => setActiveTab("resep")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[110px] ${
              activeTab === "resep"
                ? "bg-amber-500 border-amber-600 text-white shadow-md scale-[1.02]"
                : "bg-white hover:bg-slate-50 border-slate-100/80 text-slate-800 shadow-3xs"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <ChefHat className={`w-6 h-6 ${activeTab === "resep" ? "text-amber-100" : "text-amber-500"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "resep" ? "text-amber-200" : "text-slate-400"}`}>
                Saku 1
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-xs mt-2 truncate">{getTranslation("tab1Title", lang)}</h3>
              <p className={`text-[9px] leading-tight font-bold mt-0.5 line-clamp-2 ${activeTab === "resep" ? "text-amber-100" : "text-slate-400"}`}>
                {getTranslation("tab1Desc", lang)}
              </p>
            </div>
          </button>

          {/* Tab 2: Sopan */}
          <button
            id="btn-tab-sopan"
            onClick={() => setActiveTab("sopan")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[110px] ${
              activeTab === "sopan"
                ? "bg-indigo-600 border-indigo-700 text-white shadow-md scale-[1.02]"
                : "bg-white hover:bg-slate-50 border-slate-100/80 text-slate-800 shadow-3xs"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <MessageSquareCode className={`w-6 h-6 ${activeTab === "sopan" ? "text-indigo-100" : "text-indigo-600"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "sopan" ? "text-indigo-200" : "text-slate-400"}`}>
                Saku 2
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-xs mt-2 truncate">{getTranslation("tab2Title", lang)}</h3>
              <p className={`text-[9px] leading-tight font-bold mt-0.5 line-clamp-2 ${activeTab === "sopan" ? "text-indigo-100" : "text-slate-400"}`}>
                {getTranslation("tab2Desc", lang)}
              </p>
            </div>
          </button>

          {/* Tab 3: Curhat */}
          <button
            id="btn-tab-curhat"
            onClick={() => setActiveTab("curhat")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[110px] ${
              activeTab === "curhat"
                ? "bg-rose-500 border-rose-600 text-white shadow-md scale-[1.02]"
                : "bg-white hover:bg-slate-50 border-slate-100/80 text-slate-800 shadow-3xs"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <Heart className={`w-6 h-6 ${activeTab === "curhat" ? "text-rose-100" : "text-rose-500"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "curhat" ? "text-rose-200" : "text-slate-400"}`}>
                Saku 3
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-xs mt-1 truncate">{getTranslation("tab3Title", lang)}</h3>
              <p className={`text-[9px] leading-tight font-bold mt-0.5 line-clamp-2 ${activeTab === "curhat" ? "text-rose-100" : "text-slate-400"}`}>
                {getTranslation("tab3Desc", lang)}
              </p>
            </div>
          </button>

          {/* Tab 4: Tanya */}
          <button
            id="btn-tab-tanya"
            onClick={() => setActiveTab("tanya")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[110px] ${
              activeTab === "tanya"
                ? "bg-teal-600 border-teal-700 text-white shadow-md scale-[1.02]"
                : "bg-white hover:bg-slate-50 border-slate-100/80 text-slate-800 shadow-3xs"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <BookOpen className={`w-6 h-6 ${activeTab === "tanya" ? "text-teal-100" : "text-teal-600"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "tanya" ? "text-teal-200" : "text-slate-400"}`}>
                Saku 4
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-xs mt-2 truncate">{getTranslation("tab4Title", lang)}</h3>
              <p className={`text-[9px] leading-tight font-bold mt-0.5 line-clamp-2 ${activeTab === "tanya" ? "text-teal-100" : "text-slate-400"}`}>
                {getTranslation("tab4Desc", lang)}
              </p>
            </div>
          </button>

          {/* Tab 5: Belanja */}
          <button
            id="btn-tab-belanja"
            onClick={() => setActiveTab("belanja")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[110px] ${
              activeTab === "belanja"
                ? "bg-emerald-500 border-emerald-600 text-white shadow-md scale-[1.02]"
                : "bg-white hover:bg-slate-50 border-slate-100/80 text-slate-800 shadow-3xs"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <Coins className={`w-6 h-6 ${activeTab === "belanja" ? "text-emerald-100" : "text-emerald-500"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "belanja" ? "text-emerald-200" : "text-slate-400"}`}>
                Saku 5
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-xs mt-2 truncate">{getTranslation("tab5Title", lang)}</h3>
              <p className={`text-[9px] leading-tight font-bold mt-0.5 line-clamp-2 ${activeTab === "belanja" ? "text-emerald-100" : "text-slate-400"}`}>
                {getTranslation("tab5Desc", lang)}
              </p>
            </div>
          </button>

          {/* Tab 6: Kamus */}
          <button
            id="btn-tab-kamus"
            onClick={() => setActiveTab("kamus")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[110px] ${
              activeTab === "kamus"
                ? "bg-violet-600 border-violet-700 text-white shadow-md scale-[1.02]"
                : "bg-white hover:bg-slate-50 border-slate-100/80 text-slate-800 shadow-3xs"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <BookOpenCheck className={`w-6 h-6 ${activeTab === "kamus" ? "text-violet-100" : "text-violet-600"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "kamus" ? "text-violet-200" : "text-slate-400"}`}>
                Saku 6
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-xs mt-2 truncate">{getTranslation("tab6Title", lang)}</h3>
              <p className={`text-[9px] leading-tight font-bold mt-0.5 line-clamp-2 ${activeTab === "kamus" ? "text-violet-100" : "text-slate-400"}`}>
                {getTranslation("tab6Desc", lang)}
              </p>
            </div>
          </button>

          {/* Tab 7: Solusi */}
          <button
            id="btn-tab-solusi"
            onClick={() => setActiveTab("solusi")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[110px] ${
              activeTab === "solusi"
                ? "bg-sky-500 border-sky-600 text-white shadow-md scale-[1.02]"
                : "bg-white hover:bg-slate-50 border-slate-100/80 text-slate-800 shadow-3xs"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <Wrench className={`w-6 h-6 ${activeTab === "solusi" ? "text-sky-100" : "text-sky-500"}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "solusi" ? "text-sky-200" : "text-slate-400"}`}>
                Saku 7
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-xs mt-2 truncate">{getTranslation("tab7Title", lang)}</h3>
              <p className={`text-[9px] leading-tight font-bold mt-0.5 line-clamp-2 ${activeTab === "solusi" ? "text-sky-100" : "text-slate-400"}`}>
                {getTranslation("tab7Desc", lang)}
              </p>
            </div>
          </button>
        </div>

        {/* Dynamic Workspace Container */}
        <div className="bg-slate-100/50 p-2 sm:p-5 rounded-[32px] border border-slate-150 shadow-3xs">
          <AnimatePresence mode="wait">
            {activeTab === "resep" && (
              <motion.div
                key="resep-panel"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <SakuResep onSpeak={speakText} isSpeaking={isSpeaking} lang={lang} />
              </motion.div>
            )}

            {activeTab === "sopan" && (
              <motion.div
                key="sopan-panel"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <SakuSopan onSpeak={speakText} isSpeaking={isSpeaking} lang={lang} />
              </motion.div>
            )}

            {activeTab === "curhat" && (
              <motion.div
                key="curhat-panel"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <SakuCurhat onSpeak={speakText} isSpeaking={isSpeaking} lang={lang} />
              </motion.div>
            )}

            {activeTab === "tanya" && (
              <motion.div
                key="tanya-panel"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <SakuTanya onSpeak={speakText} isSpeaking={isSpeaking} lang={lang} />
              </motion.div>
            )}

            {activeTab === "belanja" && (
              <motion.div
                key="belanja-panel"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <SakuBelanja onSpeak={speakText} isSpeaking={isSpeaking} lang={lang} />
              </motion.div>
            )}

            {activeTab === "kamus" && (
              <motion.div
                key="kamus-panel"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <SakuKamus onSpeak={speakText} isSpeaking={isSpeaking} lang={lang} />
              </motion.div>
            )}

            {activeTab === "solusi" && (
              <motion.div
                key="solusi-panel"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <SakuSolusi onSpeak={speakText} isSpeaking={isSpeaking} lang={lang} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer System Status & Branding */}
      <footer className="mt-12 text-center text-[11px] text-slate-400 max-w-xl mx-auto space-y-2 px-4">
        <p className="font-extrabold flex items-center justify-center gap-1.5 text-slate-500">
          <span>{getTranslation("footerWatermark", lang)}</span>
        </p>
        <p className="font-semibold leading-normal text-slate-400/80">
          {getTranslation("footerOfflineNote", lang)}
        </p>
        <div className="flex justify-center gap-4 text-[10px] pt-1">
          <span className="font-extrabold text-slate-400">SakuDaya AI (SDY) v1.5</span>
          <span>●</span>
          <span className="font-extrabold text-emerald-500">
            {lang === "id" ? "Berjalan Lancar" : "System Operational"}
          </span>
        </div>
      </footer>
    </div>
  );
}
