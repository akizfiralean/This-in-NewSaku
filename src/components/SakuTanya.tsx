import React, { useState } from "react";
import { HelpCircle, Sparkles, BookOpen, GraduationCap, ArrowRight, RotateCcw } from "lucide-react";
import { TanyaResult, SakuLanguage } from "../types";
import { getTranslation } from "../translations";
import { motion } from "motion/react";

interface SakuTanyaProps {
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  lang: SakuLanguage;
}

const QUICK_QUESTIONS_ID = [
  "Kenapa langit warnanya Biru? 🌥️",
  "Apa itu Inflasi uang? 💸",
  "Bagaimana cara kerja Internet? 🌐",
  "Apa itu Kecerdasan Buatan (AI)? 🤖",
  "Kenapa kita perlu tidur? 😴",
  "Apa itu Gravitasi bumi? 🍎",
];

const QUICK_QUESTIONS_EN = [
  "Why is the sky blue? 🌥️",
  "What is inflation? 💸",
  "How does the Internet work? 🌐",
  "What is Artificial Intelligence (AI)? 🤖",
  "Why do we need to sleep? 😴",
  "What is gravity? 🍎",
];

const QUICK_QUESTIONS_ZH = [
  "为什么天空是蓝色的？🌥️",
  "什么是通货膨胀？💸",
  "互联网是如何工作的？🌐",
  "什么是人工智能（AI）？🤖",
  "我们为什么要睡觉？😴",
  "什么是重力？🍎",
];

const QUICK_QUESTIONS_AR = [
  "لماذا السماء زرقاء؟ 🌥️",
  "ما هو التضخم؟ 💸",
  "كيف يعمل الإنترنت؟ 🌐",
  "ما هو الذكاء الاصطناعي؟ 🤖",
  "لماذا نحتاج إلى النوم؟ 😴",
  "ما هي الجاذبية؟ 🍎",
];

export default function SakuTanya({ onSpeak, isSpeaking, lang }: SakuTanyaProps) {
  const [audiens, setAudiens] = useState("anak");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TanyaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetAll = () => {
    setResult(null);
    setError(null);
    setQuestion("");
  };

  const getQuickQuestions = () => {
    if (lang === "en") return QUICK_QUESTIONS_EN;
    if (lang === "zh") return QUICK_QUESTIONS_ZH;
    if (lang === "ar") return QUICK_QUESTIONS_AR;
    return QUICK_QUESTIONS_ID;
  };

  const AUDIENCES = [
    { value: "anak", label: getTranslation("tanyaAudienceChild", lang), sub: getTranslation("tanyaAudienceChildSub", lang) },
    { value: "lansia", label: getTranslation("tanyaAudienceElder", lang), sub: getTranslation("tanyaAudienceElderSub", lang) },
    { value: "awam", label: getTranslation("tanyaAudienceGeneral", lang), sub: getTranslation("tanyaAudienceGeneralSub", lang) },
  ];

  const askQuestion = async (selectedQuest?: string) => {
    const activeQuestion = selectedQuest || question.trim();
    if (!activeQuestion) {
      setError(lang === "id" ? "Silakan ketik pertanyaan terlebih dahulu!" : "Please write a question first!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tanya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audiens,
          question: activeQuestion,
          lang,
        }),
      });

      if (!response.ok) {
        let errMsg = "Gagal memperoleh penjelasan";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          errMsg = `HTTP error ${response.status}: ${response.statusText || "Server error"}`;
        }
        throw new Error(errMsg);
      }

      const data: TanyaResult = await response.json();
      setResult(data);

      onSpeak(`${data.judulAnalogi}. ${data.penjelasanPendek}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Let's try again.");
    } finally {
      setLoading(false);
    }
  };

  const speakExplanation = () => {
    if (!result) return;
    onSpeak(`${result.judulAnalogi}. ${result.penjelasanPendek}. ${getTranslation("tanyaResultSatuKalimat", lang)}: ${result.satuKalimatInti}`);
  };

  const quickQuests = getQuickQuestions();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {getTranslation("tanyaBadge", lang)}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{getTranslation("tanyaTitle", lang)}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{getTranslation("tanyaDesc", lang)}</p>
          </div>
          {(question || result) && (
            <button
              id="btn-tanya-reset"
              onClick={resetAll}
              className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-red-500 font-medium cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {getTranslation("btnReset", lang)}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Audience Dial */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-2 block">
              💡 {getTranslation("tanyaLabelAudience", lang)}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {AUDIENCES.map((aud) => {
                const isSelected = audiens === aud.value;
                return (
                  <button
                    id={`btn-aud-${aud.value}`}
                    key={aud.value}
                    type="button"
                    onClick={() => setAudiens(aud.value)}
                    className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-50 border-teal-400 text-teal-950 font-bold scale-[0.98] shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold block">{aud.label}</span>
                    <span className="text-[10px] text-slate-400 font-semibold leading-relaxed block mt-1">
                      {aud.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Entry Box */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              📝 {getTranslation("tanyaLabelQuestion", lang)}
            </label>
            <div className="relative">
              <input
                id="inp-tanya-question"
                type="text"
                placeholder={getTranslation("tanyaPlaceholderQuestion", lang)}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    askQuestion();
                  }
                }}
                className="w-full text-xs pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-800 bg-slate-50 font-semibold"
              />
              <button
                id="btn-tanya-submit-icon"
                onClick={() => askQuestion()}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl p-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Click Prompts */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              {getTranslation("quickTanyaLabel", lang)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickQuests.map((q) => (
                <button
                  id={`btn-quick-q-${q.replace(/[^a-zA-Z]/g, '').slice(0, 10)}`}
                  key={q}
                  type="button"
                  onClick={() => {
                    setQuestion(q);
                    askQuestion(q);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-full border border-slate-100 transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <motion.div
          id="block-tanya-results"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-50/60 border border-teal-200 rounded-3xl p-6 relative overflow-hidden space-y-5"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-teal-200/50">
            <div>
              <span className="text-[10px] bg-teal-200/50 text-teal-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {getTranslation("tanyaBadge", lang)}
              </span>
              <h3 className="text-xl font-extrabold text-teal-950 mt-1.5 leading-tight">
                {result.judulAnalogi}
              </h3>
            </div>
            <button
              id="btn-tanya-tts"
              onClick={speakExplanation}
              className={`text-xs px-4 py-2 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm border shrink-0 ${
                isSpeaking
                  ? "bg-red-500 border-red-600 text-white animate-pulse"
                  : "bg-white border-teal-200 text-teal-800 hover:bg-teal-100"
              }`}
            >
              <span>{isSpeaking ? "⏹️ Mute" : `📢 ${getTranslation("btnListenVoice", lang)}`}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-2xs space-y-2.5">
            <h4 className="font-extrabold text-xs text-teal-950 flex items-center gap-1.5 uppercase tracking-wide text-teal-600">
              <BookOpen className="w-4 h-4 text-teal-500" />
              <span>{getTranslation("tanyaResultPenjelasan", lang)}</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-line">
              {result.penjelasanPendek}
            </p>
          </div>

          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-10">
              <GraduationCap className="w-32 h-32" />
            </div>
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-teal-100 bg-white/10 px-2.5 py-1 rounded-full">
              💡 {getTranslation("tanyaResultSatuKalimat", lang)}
            </span>
            <p className="text-sm font-bold leading-snug mt-3">
              &ldquo;{result.satuKalimatInti}&rdquo;
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
