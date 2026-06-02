import React, { useState } from "react";
import { Heart, Sparkles, Smile, MessageSquareHeart, RotateCcw, Activity } from "lucide-react";
import { CurhatResult, SakuLanguage } from "../types";
import { getTranslation } from "../translations";
import { motion } from "motion/react";

interface SakuCurhatProps {
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  lang: SakuLanguage;
}

const FEELINGS = [
  { value: "sedih", label_id: "😔 Sedih & Kecewa", label_en: "😔 Sad & Disappointed", label_zh: "😔 伤心与沮丧", label_ar: "😔 حزين ومخيب للأمل" },
  { value: "stres", label_id: "🤯 Stres & Mumet", label_en: "🤯 Stressed & Overwhelmed", label_zh: "🤯 压力与疲惫", label_ar: "🤯 متوتر ومرهق" },
  { value: "lemas", label_id: "😴 Lemas & Lelah", label_en: "😴 Tired & Exhausted", label_zh: "😴 疲倦与无力", label_ar: "😴 متعب ومرهق للغاية" },
  { value: "senang", label_id: "😊 Senang & Bahagia", label_en: "😊 Happy & Joyful", label_zh: "😊 开心与幸福", label_ar: "😊 سعيد ومبتهج" },
  { value: "cemas", label_id: "🥶 Cemas/Overthink", label_en: "🥶 Anxious/Overthinking", label_zh: "🥶 焦虑与胡思乱想", label_ar: "🥶 قلق والتفكير الزائد" },
  { value: "marah", label_id: "😠 Marah & Kesal", label_en: "😠 Angry & Annoyed", label_zh: "😠 生气与愤怒", label_ar: "😠 غاضب ومنزعج" },
];

export default function SakuCurhat({ onSpeak, isSpeaking, lang }: SakuCurhatProps) {
  const [feeling, setFeeling] = useState<string>("sedih");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CurhatResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFeeling = (val: string) => {
    setFeeling(val);
  };

  const resetAll = () => {
    setResult(null);
    setError(null);
    setStory("");
  };

  const getLocalizedFeelingLabel = (f: typeof FEELINGS[0]) => {
    if (lang === "en") return f.label_en;
    if (lang === "zh") return f.label_zh;
    if (lang === "ar") return f.label_ar;
    return f.label_id;
  };

  const submitCurhat = async () => {
    if (!feeling && !story.trim()) {
      setError(lang === "id" ? "Silakan klik perasaan atau ketik cerita!" : "Please choose your mood or write a story!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const matchFeat = FEELINGS.find((f) => f.value === feeling);
    const activeFeelingLabel = matchFeat ? getLocalizedFeelingLabel(matchFeat) : feeling;

    try {
      const response = await fetch("/api/curhat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeling: activeFeelingLabel,
          story: story.trim() || "(Empty story)",
          lang,
        }),
      });

      if (!response.ok) {
        let errMsg = "Gagal mengirim curhatan";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          errMsg = `HTTP error ${response.status}: ${response.statusText || "Server error"}`;
        }
        throw new Error(errMsg);
      }

      const data: CurhatResult = await response.json();
      setResult(data);

      onSpeak(getTranslation("curhatSpeakResultIntro", lang));
    } catch (err: any) {
      setError(err.message || "Something went wrong. Let's try again.");
    } finally {
      setLoading(false);
    }
  };

  const speakReply = () => {
    if (!result) return;
    onSpeak(`${result.balasanSobat}. ${getTranslation("curhatResultAfirmasi", lang)}: "${result.afirmasiSaku}". ${getTranslation("curhatResultAktivitas", lang)}: ${result.aktivitasMenolong}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {getTranslation("curhatBadge", lang)}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{getTranslation("curhatTitle", lang)}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{getTranslation("curhatDesc", lang)}</p>
          </div>
          {(story || result) && (
            <button
              id="btn-curhat-reset"
              onClick={resetAll}
              className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-red-500 font-medium cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {getTranslation("btnReset", lang)}
            </button>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-2 block">
              {getTranslation("curhatLabelFeeling", lang)}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {FEELINGS.map((f) => {
                const isSelected = feeling === f.value;
                const label = getLocalizedFeelingLabel(f);
                return (
                  <button
                    id={`btn-mood-${f.value}`}
                    key={f.value}
                    onClick={() => selectFeeling(f.value)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-rose-50 border-rose-400 text-rose-950 font-bold scale-[0.98] shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600 font-semibold"
                    }`}
                  >
                    <span className="text-xs leading-relaxed truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 flex justify-between items-center block">
              <span>{getTranslation("curhatLabelStory", lang)}</span>
            </label>
            <textarea
              id="txt-curhat-story"
              rows={4}
              placeholder={getTranslation("curhatPlaceholderStory", lang)}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800 bg-slate-50 font-semibold leading-relaxed"
            />
          </div>

          <div>
            <button
              id="btn-curhat-submit"
              onClick={submitCurhat}
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-105 active:scale-98 text-white py-3.5 rounded-2xl font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{getTranslation("loadingTip", lang)}</span>
                </>
              ) : (
                <>
                  <MessageSquareHeart className="w-5 h-5 text-rose-100" />
                  <span>{getTranslation("btnGenerate", lang)}</span>
                  <Sparkles className="w-4 h-4 text-rose-200" />
                </>
              )}
            </button>
            {error && (
              <p className="text-xs font-extrabold text-red-500 mt-2 bg-red-50 px-3 py-1.5 rounded-lg text-center w-full">
                ⚠️ {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {result && (
        <motion.div
          id="block-curhat-results"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50/60 border border-rose-200 rounded-3xl p-6 space-y-5"
        >
          <div className="flex sm:flex-row flex-col justify-between items-start gap-4 pb-4 border-b border-rose-200/50">
            <div>
              <span className="text-[10px] bg-rose-200/50 text-rose-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {getTranslation("curhatBadge", lang)}
              </span>
              <h3 className="text-xl font-extrabold text-rose-950 mt-1.5 flex items-center gap-2 leading-tight">
                🌱 {getTranslation("curhatResultListening", lang)}
              </h3>
            </div>
            <button
              id="btn-curhat-tts"
              onClick={speakReply}
              className={`text-xs px-4 py-2 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm border shrink-0 ${
                isSpeaking
                  ? "bg-red-500 border-red-600 text-white animate-pulse"
                  : "bg-white border-rose-200 text-rose-800 hover:bg-amber-100"
              }`}
            >
              <span>{isSpeaking ? "⏹️ Mute" : `📢 ${getTranslation("btnListenVoice", lang)}`}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-2xs space-y-2 relative overflow-hidden">
            <h4 className="font-extrabold text-xs text-rose-950 uppercase tracking-widest text-rose-600 mb-1">
              {lang === "id" ? "💌 Balasan Oka" : lang === "en" ? "💌 Oka's Response" : lang === "zh" ? "💌 Oka 的回覆" : "💌 رد Oka"}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-line">
              {result.balasanSobat}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
                <Heart className="w-32 h-32" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-rose-100 bg-white/15 px-2.5 py-1 rounded-full">
                  🌟 {getTranslation("curhatResultAfirmasi", lang)}
                </span>
                <p className="text-sm font-extrabold leading-relaxed mt-4 italic">
                  &ldquo;{result.afirmasiSaku}&rdquo;
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  🔋 {getTranslation("curhatResultAktivitas", lang)}
                </span>
                <div className="flex items-start gap-3 mt-4">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-emerald-950">
                      {lang === "id" ? "Saran Langkah:" : lang === "en" ? "Suggested Action:" : lang === "zh" ? "建議行動：" : "الخطوة المقترحة:"}
                    </h5>
                    <p className="text-xs text-emerald-900 font-semibold mt-1 leading-relaxed">
                      {result.aktivitasMenolong}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-6 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5" />
                <span>{lang === "id" ? "Damai & Tenang" : lang === "en" ? "Peace & Calm" : lang === "zh" ? "平和與安寧" : "السلام والهدوء"}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
