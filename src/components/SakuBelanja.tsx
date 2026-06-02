import React, { useState } from "react";
import { Coins, Sparkles, Plus, X, ArrowRight, RotateCcw, AlertCircle } from "lucide-react";
import { BelanjaResult, SakuLanguage } from "../types";
import { getTranslation } from "../translations";
import { motion } from "motion/react";

interface SakuBelanjaProps {
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  lang: SakuLanguage;
}

export default function SakuBelanja({ onSpeak, isSpeaking, lang }: SakuBelanjaProps) {
  const [inputText, setInputText] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BelanjaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetAll = () => {
    setResult(null);
    setError(null);
    setInputText("");
    setBudget("");
  };

  const calculateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanItems = inputText
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    if (cleanItems.length === 0) {
      setError(lang === "id" ? "Silakan ketik daftar belanja Anda terlebih dahulu!" : "Please write down your grocery list first!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/belanja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cleanItems,
          budgetLimit: budget,
          lang,
        }),
      });

      if (!response.ok) {
        let errMsg = "Failed to make list analysis";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          errMsg = `HTTP error ${response.status}: ${response.statusText || "Server error"}`;
        }
        throw new Error(errMsg);
      }

      const data: BelanjaResult = await response.json();
      setResult(data);

      const localizedVoice = getTranslation("belanjaSpeakResult", lang)
        .replace("{cost}", data.totalEstimasi);
      onSpeak(localizedVoice);
    } catch (err: any) {
      setError(err.message || "Failed to analyze layout. Retry later.");
    } finally {
      setLoading(false);
    }
  };

  const speakBudget = () => {
    if (!result) return;
    const itemExplanation = result.daftarBelanjaAnalis
      .map((item) => `${item.barang}: ${item.takaran}, ${item.estimasiBiaya} (${item.alternatifLebihMurah}).`)
      .join(" ");
    onSpeak(`${result.namaRencana}. ${getTranslation("belanjaTotalEstimasi", lang)} ${result.totalEstimasi}. ${itemExplanation} ${result.tipsHemat}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {getTranslation("belanjaBadge", lang)}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{getTranslation("belanjaTitle", lang)}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{getTranslation("belanjaDesc", lang)}</p>
          </div>
          {(inputText || budget || result) && (
            <button
              id="btn-belanja-reset"
              onClick={resetAll}
              className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-red-500 font-medium cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {getTranslation("btnReset", lang)}
            </button>
          )}
        </div>

        <form onSubmit={calculateBudget} className="space-y-4">
          {/* Grocery items inputs */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              {getTranslation("belanjaLabelItems", lang)}
            </label>
            <textarea
              id="inp-belanja-items"
              rows={3}
              placeholder={getTranslation("belanjaPlaceholderItems", lang)}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 resize-none font-semibold leading-relaxed"
            />
          </div>

          {/* Budget ceiling */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              {getTranslation("belanjaLabelBudget", lang)}
            </label>
            <input
              id="inp-belanja-budget"
              type="text"
              placeholder={getTranslation("belanjaPlaceholderBudget", lang)}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full text-xs px-4 py-3 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 font-semibold"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-2.5 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="btn-belanja-submit"
            type="submit"
            disabled={loading}
            className="w-full py-4 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl hover:brightness-105 active:scale-98 transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{getTranslation("loadingTip", lang)}</span>
              </>
            ) : (
              <>
                <Coins className="w-4.5 h-4.5" />
                <span>{getTranslation("btnGenerate", lang)}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result list display */}
      {result && (
        <motion.div
          id="block-belanja-results"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-6 relative overflow-hidden space-y-5"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-emerald-200/50">
            <div>
              <span className="text-[10px] bg-emerald-200/50 text-emerald-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {getTranslation("belanjaResultTitle", lang)}
              </span>
              <h3 className="text-xl font-extrabold text-emerald-950 mt-1.5 leading-tight">{result.namaRencana}</h3>
            </div>
            <button
              id="btn-belanja-tts"
              onClick={speakBudget}
              className={`text-xs px-4 py-2 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm border shrink-0 ${
                isSpeaking
                  ? "bg-red-500 border-red-600 text-white animate-pulse"
                  : "bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              <span>{isSpeaking ? "⏹️ Mute" : `📢 ${getTranslation("btnListenVoice", lang)}`}</span>
            </button>
          </div>

          {/* Budget item lists */}
          <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-500/10 text-emerald-950 font-bold border-b border-emerald-100">
                    <th className="p-3">{getTranslation("belanjaTableItem", lang)}</th>
                    <th className="p-3">{getTranslation("belanjaTableAmount", lang)}</th>
                    <th className="p-3">{getTranslation("belanjaTableCost", lang)}</th>
                    <th className="p-3">{getTranslation("belanjaTableAlt", lang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {result.daftarBelanjaAnalis.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{item.barang}</td>
                      <td className="p-3 text-slate-600">{item.takaran}</td>
                      <td className="p-3 text-emerald-700">{item.estimasiBiaya}</td>
                      <td className="p-3 text-amber-700">{item.alternatifLebihMurah || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sum total Card */}
          <div className="bg-emerald-600 text-white rounded-2xl p-4.5 flex justify-between items-center shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider">{getTranslation("belanjaTotalEstimasi", lang)}</span>
            <span className="text-lg font-extrabold tracking-tight">{result.totalEstimasi}</span>
          </div>

          {/* Saving tips */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-3xs space-y-2.5">
            <h4 className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
              {getTranslation("belanjaTipsHemat", lang)}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-line">
              {result.tipsHemat}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
