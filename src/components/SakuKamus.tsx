import React, { useState } from "react";
import { BookOpen, Sparkles, ArrowRight, RotateCcw, AlertCircle } from "lucide-react";
import { KamusResult, SakuLanguage } from "../types";
import { getTranslation } from "../translations";
import { motion } from "motion/react";

interface SakuKamusProps {
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  lang: SakuLanguage;
}

const LOCALIZED_SLANGS: Record<SakuLanguage, string[]> = {
  id: [
    "FOMO",
    "Rizz",
    "Cap / No Cap",
    "Ghosting",
    "TBL (Takut Banget Loh)",
    "Menyala Abangkuh",
  ],
  en: [
    "FOMO",
    "Rizz",
    "Cap / No Cap",
    "Ghosting",
    "Sus",
    "Slay",
  ],
  zh: [
    "FOMO",
    "Rizz",
    "Cap / No Cap",
    "Ghosting",
    "泰褲辣",
    "精神內耗",
  ],
  ar: [
    "FOMO",
    "Rizz",
    "No Cap",
    "Ghosting",
    "ترند",
    "ليفل الوحش",
  ]
};

export default function SakuKamus({ onSpeak, isSpeaking, lang }: SakuKamusProps) {
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KamusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetAll = () => {
    setResult(null);
    setError(null);
    setPhrase("");
  };

  const explainSlang = async (selectedPhrase?: string) => {
    const activePhrase = selectedPhrase || phrase.trim();
    if (!activePhrase) {
      setError(lang === "id" ? "Silakan ketik istilah gaul terlebih dahulu!" : "Please write down a slang word first!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/kamus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phrase: activePhrase,
          lang,
        }),
      });

      if (!response.ok) {
        let errMsg = "Failed to explain word";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          errMsg = `HTTP error ${response.status}: ${response.statusText || "Server error"}`;
        }
        throw new Error(errMsg);
      }

      const data: KamusResult = await response.json();
      setResult(data);

      const localizedVoice = getTranslation("kamusSpeakResult", lang)
        .replace("{word}", data.kataAsli)
        .replace("{literal}", data.artiHarfiah)
        .replace("{meaning}", data.penjelasanSantai);
      onSpeak(localizedVoice);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve translation. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const speakKamus = () => {
    if (!result) return;
    onSpeak(`${getTranslation("kamusResultKata", lang)} ${result.kataAsli}. ${getTranslation("kamusResultArti", lang)} ${result.artiHarfiah}. ${getTranslation("kamusResultPenjelasan", lang)} ${result.penjelasanSantai}. ${getTranslation("kamusResultContoh", lang)} ${result.contohKalimat}`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Selection Frame */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {getTranslation("kamusBadge", lang)}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{getTranslation("kamusTitle", lang)}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{getTranslation("kamusDesc", lang)}</p>
          </div>
          {(phrase || result) && (
            <button
              id="btn-kamus-reset"
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
              {getTranslation("kamusLabelPhrase", lang)}
            </label>
            <div className="relative">
              <input
                id="inp-kamus-phrase"
                type="text"
                placeholder={getTranslation("kamusPlaceholderPhrase", lang)}
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    explainSlang();
                  }
                }}
                className="w-full text-xs pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500 text-slate-800 bg-slate-50 font-semibold"
              />
              <button
                id="btn-kamus-submit-icon"
                onClick={() => explainSlang()}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl p-2 cursor-pointer transition-colors disabled:opacity-50"
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

          {/* Quick Click Slang Bubble */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              {getTranslation("quickSlangLabel", lang)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(LOCALIZED_SLANGS[lang] || LOCALIZED_SLANGS.id).map((s) => (
                <button
                  id={`btn-quick-slang-${s.replace(/[^a-zA-Z]/g, '').slice(0, 10)}`}
                  key={s}
                  type="button"
                  onClick={() => {
                    setPhrase(s);
                    explainSlang(s);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-full border border-slate-100 transition-all cursor-pointer shadow-3xs"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result Area */}
      {result && (
        <motion.div
          id="block-kamus-results"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-violet-50/60 border border-violet-200 rounded-3xl p-6 relative overflow-hidden space-y-4"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-violet-200/50">
            <div>
              <span className="text-[10px] bg-violet-200/50 text-violet-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {getTranslation("kamusBadge", lang)}
              </span>
              <h3 className="text-2xl font-extrabold text-violet-950 mt-1.5 leading-tight">
                {result.kataAsli}
              </h3>
            </div>
            <button
              id="btn-kamus-tts"
              onClick={speakKamus}
              className={`text-xs px-4 py-2 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm border shrink-0 ${
                isSpeaking
                  ? "bg-red-500 border-red-600 text-white animate-pulse"
                  : "bg-white border-violet-200 text-violet-800 hover:bg-violet-100"
              }`}
            >
              <span>{isSpeaking ? "⏹️ Mute" : `📢 ${getTranslation("btnListenVoice", lang)}`}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Word Literal/Translational box */}
            <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-2xs space-y-1.5">
              <h4 className="font-extrabold text-[10px] uppercase text-violet-600 tracking-wider">
                {getTranslation("kamusResultArti", lang)}
              </h4>
              <p className="text-sm text-slate-900 font-extrabold">{result.artiHarfiah}</p>
            </div>

            {/* General explanation card */}
            <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-2xs space-y-2.5">
              <h4 className="font-extrabold text-[10px] uppercase text-violet-600 tracking-wider">
                {getTranslation("kamusResultPenjelasan", lang)}
              </h4>
              <p className="text-xs text-slate-800 leading-relaxed font-semibold whitespace-pre-line">
                {result.penjelasanSantai}
              </p>
            </div>

            {/* Example sentence */}
            <div className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
                <BookOpen className="w-32 h-32" />
              </div>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-violet-100 bg-white/10 px-2.5 py-1 rounded-full">
                {getTranslation("kamusResultContoh", lang)}
              </span>
              <p className="text-xs sm:text-sm font-bold leading-relaxed mt-3 italic">
                &ldquo;{result.contohKalimat}&rdquo;
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
