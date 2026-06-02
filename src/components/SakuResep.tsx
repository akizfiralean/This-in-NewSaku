import React, { useState, useEffect, useRef } from "react";
import { ChefHat, Plus, X, Sparkles, Clock, Coins, Users, Lightbulb, Search, ArrowRight, RotateCcw } from "lucide-react";
import { ResepResult, QuickIngredient, SakuLanguage } from "../types";
import { getTranslation, INGREDIENT_NAMES, translateIngredients } from "../translations";
import { motion } from "motion/react";

interface SakuResepProps {
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  lang: SakuLanguage;
}

const QUICK_INGREDIENTS: QuickIngredient[] = [
  { name: "Telur", category: "protein", icon: "🍳" },
  { name: "Tahu", category: "protein", icon: "⬜" },
  { name: "Tempe", category: "protein", icon: "🍱" },
  { name: "Ayam", category: "protein", icon: "🍗" },
  { name: "Daging Sapi", category: "protein", icon: "🥩" },
  { name: "Nasi Dingin", category: "karbo", icon: "🍚" },
  { name: "Mi Instan", category: "karbo", icon: "🍜" },
  { name: "Kentang", category: "karbo", icon: "🥔" },
  { name: "Wortel", category: "sayur", icon: "🥕" },
  { name: "Bayam", category: "sayur", icon: "🌿" },
  { name: "Kangkung", category: "sayur", icon: "🌱" },
  { name: "Cabe", category: "bumbu", icon: "🌶️" },
  { name: "Bawang Merah", category: "bumbu", icon: "🧅" },
  { name: "Bawang Putih", category: "bumbu", icon: "🧄" },
  { name: "Tomat", category: "sayur", icon: "🍅" },
  { name: "Susu", category: "protein", icon: "🥛" },
];

export default function SakuResep({ onSpeak, isSpeaking, lang }: SakuResepProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [speed, setSpeed] = useState("normal");
  const [dietary, setDietary] = useState("all");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<ResepResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prevLangRef = useRef<SakuLanguage>(lang);

  useEffect(() => {
    if (prevLangRef.current !== lang) {
      setIngredients((prev) => translateIngredients(prev, prevLangRef.current, lang));
      prevLangRef.current = lang;
    }
  }, [lang]);

  const toggleIngredient = (name: string) => {
    if (ingredients.includes(name)) {
      setIngredients(ingredients.filter((item) => item !== name));
    } else {
      setIngredients([...ingredients, name]);
    }
  };

  const addCustomIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInput.trim();
    if (clean && !ingredients.includes(clean)) {
      setIngredients([...ingredients, clean]);
      setCustomInput("");
    }
  };

  const removeIngredient = (name: string) => {
    setIngredients(ingredients.filter((item) => item !== name));
  };

  const resetAll = () => {
    setIngredients([]);
    setRecipe(null);
    setError(null);
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      setError(getTranslation("recipeErrorIng", lang));
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const response = await fetch("/api/resep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, speed, dietary, lang }),
      });

      if (!response.ok) {
        let errMsg = "Gagal membuat resep";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          errMsg = `HTTP error ${response.status}: ${response.statusText || "Server error"}`;
        }
        throw new Error(errMsg);
      }

      const data: ResepResult = await response.json();
      setRecipe(data);

      const voiceIntro = getTranslation("recipePromptSpeakResult", lang)
        .replace("{name}", data.namaMasakan)
        .replace("{portion}", data.porsi)
        .replace("{time}", data.waktuMemasak);
      onSpeak(voiceIntro);
    } catch (err: any) {
      setError(err.message || "Ada kendala teknis. Pastikan internetmu aktif dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const speakInstruct = () => {
    if (!recipe) return;
    const textToSpeak = `${recipe.namaMasakan}. ${getTranslation("recipeIngredients", lang)} ${recipe.bahanBahan.join(", ")}. ${getTranslation("recipeSteps", lang)} ${recipe.langkahLangkah.map((l, i) => `${i + 1}: ${l}`).join(". ")}. ${getTranslation("recipeTips", lang)} ${recipe.tipsCerdas}`;
    onSpeak(textToSpeak);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {getTranslation("recipeBadge", lang)}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{getTranslation("recipeTitle", lang)}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{getTranslation("recipeDesc", lang)}</p>
          </div>
          {ingredients.length > 0 && (
            <button
              id="btn-cook-reset"
              onClick={resetAll}
              className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-red-500 font-medium cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {getTranslation("btnReset", lang)}
            </button>
          )}
        </div>

        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-600 mb-2 block">
            {getTranslation("recipeLabelTouch", lang)}
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {QUICK_INGREDIENTS.map((item) => {
              const displayName = INGREDIENT_NAMES[item.name]?.[lang] || item.name;
              const active = ingredients.includes(displayName);
              return (
                <button
                  id={`btn-ing-${item.name.replace(/\s+/g, '-')}`}
                  key={item.name}
                  onClick={() => toggleIngredient(displayName)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl text-center border transition-all duration-250 cursor-pointer ${
                    active
                      ? "bg-amber-500 border-amber-600 text-white shadow-sm scale-95"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-800"
                  }`}
                >
                  <span className="text-xl mb-1">{item.icon}</span>
                  <span className="text-[10px] font-medium leading-tight truncate w-full">
                    {displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={addCustomIngredient} className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="inp-custom-ingredient"
              type="text"
              placeholder={getTranslation("inputPlaceholderCustom", lang)}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50 font-semibold"
            />
          </div>
          <button
            id="btn-add-ingredient"
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-4 py-2.5 rounded-2xl font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{getTranslation("recipeIngredients", lang).split(":")[0]}</span>
          </button>
        </form>

        {ingredients.length > 0 && (
          <div className="mb-4">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              {getTranslation("recipeIngredients", lang)}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl">
              {ingredients.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-slate-800 text-xs font-medium rounded-full border border-slate-100 shadow-2xs"
                >
                  {name}
                  <button
                    id={`btn-del-${name.replace(/\s+/g, '-')}`}
                    type="button"
                    onClick={() => removeIngredient(name)}
                    className="text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-50">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              {getTranslation("recipeSpeedChoice", lang)}
            </label>
            <div className="flex gap-2">
              {[
                { label: getTranslation("recipeNormal", lang), value: "normal" },
                { label: getTranslation("recipeExpress", lang), value: "cepat" },
              ].map((opt) => (
                <button
                  id={`btn-speed-${opt.value}`}
                  key={opt.value}
                  type="button"
                  onClick={() => setSpeed(opt.value)}
                  className={`flex-1 text-center text-xs py-2 rounded-xl border transition-colors cursor-pointer font-bold ${
                    speed === opt.value
                      ? "bg-amber-50 border-amber-300 text-amber-700 font-extrabold"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              {getTranslation("recipeDietLabel", lang)}
            </label>
            <select
              id="sel-dietary"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800 font-semibold"
            >
              <option value="all">{getTranslation("recipeDietDefault", lang)}</option>
              <option value="vegetarian">{getTranslation("recipeDietVegetarian", lang)}</option>
              <option value="halal">{getTranslation("recipeDietHalal", lang)}</option>
              <option value="elderly">{getTranslation("recipeDietElderly", lang)}</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <button
            id="btn-cooking-cook"
            onClick={generateRecipe}
            disabled={loading || ingredients.length === 0}
            className={`w-full py-4 rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all ${
              ingredients.length === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 hover:shadow-md active:scale-98 text-white"
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{getTranslation("loadingTip", lang)}</span>
              </>
            ) : (
              <>
                <ChefHat className="w-5 h-5 text-amber-100" />
                <span>{getTranslation("btnGenerate", lang)}</span>
                <Sparkles className="w-4 h-4 text-amber-200" />
              </>
            )}
          </button>
          
          {error && (
            <p className="text-xs font-extrabold text-red-500 mt-2 bg-red-50 px-3 py-1.5 rounded-lg w-full text-center">
              ⚠️ {error}
            </p>
          )}
        </div>
      </div>

      {recipe && (
        <motion.div
          id="block-recipe-result"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
            <ChefHat className="w-64 h-64 text-amber-900" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-amber-100">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-200/50 px-3 py-1 rounded-full">
                {getTranslation("recipeBadge", lang)} Menu
              </span>
              <h3 className="text-2xl font-extrabold text-amber-900 mt-1.5 leading-tight">
                {recipe.namaMasakan}
              </h3>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button
                id="btn-recipe-tts"
                onClick={speakInstruct}
                className={`text-xs px-3.5 py-2 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-sm border ${
                  isSpeaking
                    ? "bg-red-500 border-red-600 text-white animate-pulse"
                    : "bg-white border-amber-200 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <span>{isSpeaking ? "⏹️ Mute" : `📢 ${getTranslation("btnListenVoice", lang)}`}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-4 my-1">
            <div className="bg-white p-3 rounded-2xl border border-amber-100 text-center">
              <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1.5" />
              <span className="text-[10px] text-slate-400 font-medium block">{getTranslation("recipeTime", lang)}</span>
              <span className="text-xs font-extrabold text-slate-800">{recipe.waktuMemasak}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-amber-100 text-center">
              <Users className="w-4 h-4 text-amber-600 mx-auto mb-1.5" />
              <span className="text-[10px] text-slate-400 font-medium block">{getTranslation("recipePortion", lang)}</span>
              <span className="text-xs font-extrabold text-slate-800">{recipe.porsi}</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-amber-100 text-center">
              <Coins className="w-4 h-4 text-amber-600 mx-auto mb-1.5" />
              <span className="text-[10px] text-slate-400 font-medium block">{getTranslation("recipeCost", lang)}</span>
              <span className="text-[10px] font-extrabold text-slate-800 truncate block">
                {recipe.perkiraanBiaya}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-4">
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                📝 {getTranslation("recipeIngredients", lang)}
              </h4>
              <ul className="space-y-2 bg-white/50 p-4 rounded-2xl border border-amber-100/50">
                {recipe.bahanBahan.map((bahan, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-800 font-semibold">
                    <input
                      id={`chk-ingredient-${idx}`}
                      type="checkbox"
                      className="mt-0.5 rounded-sm border-amber-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{bahan}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                🍳 {getTranslation("recipeSteps", lang)}
              </h4>
              <ol className="space-y-3">
                {recipe.langkahLangkah.map((langkah, idx) => (
                  <li key={idx} className="flex gap-3 bg-white/80 p-3 rounded-2xl border border-amber-100/50">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-800 text-xs font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold mt-0.5 animate-fade-in">
                      {langkah}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {recipe.tipsCerdas && (
            <div className="mt-6 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-4 rounded-2xl border border-amber-200/60 flex items-start gap-3">
              <div className="bg-amber-500 text-white rounded-xl p-1.5 shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[11px] font-extrabold text-amber-950 uppercase tracking-widest">
                  {getTranslation("recipeTips", lang)}
                </h5>
                <p className="text-xs text-amber-900 font-semibold mt-1 leading-relaxed">
                  {recipe.tipsCerdas}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
