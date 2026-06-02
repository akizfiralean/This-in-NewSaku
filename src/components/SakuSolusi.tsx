import React, { useState } from "react";
import { Sparkles, ArrowRight, RotateCcw, AlertCircle, Wrench, ShieldAlert } from "lucide-react";
import { SolusiResult, SakuLanguage } from "../types";
import { getTranslation } from "../translations";
import { motion } from "motion/react";

interface SakuSolusiProps {
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  lang: SakuLanguage;
}

const LOCALIZED_PROBLEMS: Record<SakuLanguage, string[]> = {
  id: [
    "Membersihkan panci gosong / berkarat 🍳",
    "Mengatasi engsel pintu berisik berdecit 🚪",
    "Baju kena noda kecap atau kopi 👕",
    "Menghilangkan bau kulkas tidak sedap 🧊",
    "Kunci gembok macet / seret 🔑",
  ],
  en: [
    "Cleaning a burnt / rusty pot 🍳",
    "Fixing a squeaky door hinge 🚪",
    "Soy sauce or coffee stain on clothes 👕",
    "Removing bad smell from the fridge 🧊",
    "Stuck lock / padlock key 🔑",
  ],
  zh: [
    "清潔燒焦或生鏽的鍋具 🍳",
    "修復吱吱作響的門鉸鏈 🚪",
    "衣服沾上醬油或咖啡污漬 👕",
    "去除冰箱難聞的氣味 🧊",
    "鎖頭/掛鎖卡接不順暢 🔑",
  ],
  ar: [
    "تنظيف طنجرة محروقة أو صدئة 🍳",
    "إصلاح مفصلة الباب التي تصدر صوتاً 🚪",
    "بقعة صلصة الصويا أو القهوة من الملابس 👕",
    "إزالة الروائح الكريهة من الثلاجة 🧊",
    "إصلاح قفل أو مفتاح معطل 🔑",
  ]
};

export default function SakuSolusi({ onSpeak, isSpeaking, lang }: SakuSolusiProps) {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolusiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetAll = () => {
    setResult(null);
    setError(null);
    setProblem("");
  };

  const solveProblem = async (selectedProblem?: string) => {
    const activeProblem = selectedProblem || problem.trim();
    if (!activeProblem) {
      setError(lang === "id" ? "Silakan ketik atau pilih masalah rumah tangga terlebih dahulu!" : "Please write down a household problem first!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/solusi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: activeProblem,
          lang,
        }),
      });

      if (!response.ok) {
        let errMsg = "Failed to make DIY guide";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          errMsg = `HTTP error ${response.status}: ${response.statusText || "Server error"}`;
        }
        throw new Error(errMsg);
      }

      const data: SolusiResult = await response.json();
      setResult(data);

      const localizedVoice = getTranslation("solusiSpeakResult", lang)
        .replace("{problem}", data.namaMasalah)
        .replace("{diff}", data.tingkatKesulitan);
      onSpeak(localizedVoice);
    } catch (err: any) {
      setError(err.message || "Failed to contact system fixer. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const speakSolusi = () => {
    if (!result) return;
    const stepsText = result.langkahSolusi.map((step, idx) => `Step ${idx + 1}: ${step}.`).join(" ");
    const materialsText = result.bahanRumahan.join(", ");
    onSpeak(`${result.namaMasalah}. ${getTranslation("solusiResultKesulitan", lang)} ${result.tingkatKesulitan}. ${getTranslation("solusiResultBahan", lang)} ${materialsText}. ${getTranslation("solusiResultLangkah", lang)} ${stepsText}. ${getTranslation("solusiResultCegah", lang)} ${result.tipsPencegahan}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Input Panel */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {getTranslation("solusiBadge", lang)}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{getTranslation("solusiTitle", lang)}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{getTranslation("solusiDesc", lang)}</p>
          </div>
          {(problem || result) && (
            <button
              id="btn-solusi-reset"
              onClick={resetAll}
              className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-red-500 font-medium cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {getTranslation("btnReset", lang)}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Input text box */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              {getTranslation("solusiLabelProblem", lang)}
            </label>
            <div className="relative">
              <input
                id="inp-solusi-problem"
                type="text"
                placeholder={getTranslation("solusiPlaceholderProblem", lang)}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    solveProblem();
                  }
                }}
                className="w-full text-xs pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-800 bg-slate-50 font-semibold"
              />
              <button
                id="btn-solusi-submit-icon"
                onClick={() => solveProblem()}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl p-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-2.5 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Click Bullet Problems */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              {getTranslation("quickSolusiLabel", lang)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(LOCALIZED_PROBLEMS[lang] || LOCALIZED_PROBLEMS.id).map((p) => (
                <button
                  id={`btn-quick-solusi-${p.replace(/[^a-zA-Z]/g, '').slice(0, 10)}`}
                  key={p}
                  type="button"
                  onClick={() => {
                    setProblem(p);
                    solveProblem(p);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-full border border-slate-100 transition-all cursor-pointer shadow-3xs"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result Display Frame */}
      {result && (
        <motion.div
          id="block-solusi-results"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sky-50/60 border border-sky-200 rounded-3xl p-6 relative overflow-hidden space-y-5"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-sky-200/50">
            <div>
              <span className="text-[10px] bg-sky-200/50 text-sky-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {getTranslation("solusiBadge", lang)}
              </span>
              <h3 className="text-xl font-extrabold text-sky-950 mt-1.5 leading-tight">
                {result.namaMasalah}
              </h3>
            </div>
            <button
              id="btn-solusi-tts"
              onClick={speakSolusi}
              className={`text-xs px-4 py-2 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm border shrink-0 ${
                isSpeaking
                  ? "bg-red-500 border-red-600 text-white animate-pulse"
                  : "bg-white border-sky-200 text-sky-800 hover:bg-sky-100"
              }`}
            >
              <span>{isSpeaking ? "⏹️ Mute" : `📢 ${getTranslation("btnListenVoice", lang)}`}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Difficulty Level Card */}
            <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-3xs space-y-1 shrink-0">
              <span className="text-[10px] uppercase font-bold text-sky-600">
                {getTranslation("solusiResultKesulitan", lang)}
              </span>
              <p className="text-sm font-extrabold text-slate-900">{result.tingkatKesulitan}</p>
            </div>

            {/* Prep Materials Card */}
            <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-3xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-sky-600">
                {getTranslation("solusiResultBahan", lang)}
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.bahanRumahan.map((mat, i) => (
                  <span key={i} className="bg-slate-50 text-slate-800 border border-slate-100 text-[10px] font-bold px-2 px-2.5 py-1 rounded-lg">
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Core instruction steps */}
          <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-3xs space-y-3">
            <h4 className="font-extrabold text-xs text-sky-950 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 pb-2">
              <Wrench className="w-4 h-4 text-sky-500" />
              <span>{getTranslation("solusiResultLangkah", lang)}</span>
            </h4>
            <ol className="space-y-3.5 text-xs text-slate-700 leading-relaxed font-semibold list-decimal pl-4">
              {result.langkahSolusi.map((step, idx) => (
                <li key={idx} className="marker:text-sky-500 marker:font-extrabold">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Preventative Tips card */}
          <div className="bg-gradient-to-r from-sky-500 to-cyan-600 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
              <ShieldAlert className="w-32 h-32" />
            </div>
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-sky-100 bg-white/10 px-2.5 py-1 rounded-full">
              {getTranslation("solusiResultCegah", lang)}
            </span>
            <p className="text-xs sm:text-sm font-bold leading-relaxed mt-3 whitespace-pre-line">
              {result.tipsPencegahan}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
