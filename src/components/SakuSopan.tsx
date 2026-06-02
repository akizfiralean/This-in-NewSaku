import React, { useState } from "react";
import { MessageSquareCode, Copy, Check, Sparkles, RotateCcw } from "lucide-react";
import { SopanResult, SakuLanguage } from "../types";
import { getTranslation } from "../translations";
import { motion } from "motion/react";

interface SakuSopanProps {
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  lang: SakuLanguage;
}

const TARGETS = [
  {
    value: "atasan",
    labels: {
      id: "🏢 Atasan / Bos Kerja",
      en: "🏢 Employer / Boss",
      zh: "🏢 上司 / 主管",
      ar: "🏢 رئيس العمل / المدير"
    } as Record<string, string>
  },
  {
    value: "dosen",
    labels: {
      id: "🎓 Dosen / Guru Sekolah",
      en: "🎓 Lecturer / Teacher",
      zh: "🎓 教授 / 教師",
      ar: "🎓 المحاضر / المعلم"
    } as Record<string, string>
  },
  {
    value: "pak-rt",
    labels: {
      id: "🏡 Pak RT / Ibu RW / Tetangga",
      en: "🏡 Local Leader / Neighbor",
      zh: "🏡 社區里長 / 鄰居",
      ar: "🏡 رئيس الحي / الجار"
    } as Record<string, string>
  },
  {
    value: "rekan",
    labels: {
      id: "🤝 Rekan Kerja / Mitra",
      en: "🤝 Colleague / Partner",
      zh: "🤝 同事 / 合作夥伴",
      ar: "🤝 الزميل / الشريك"
    } as Record<string, string>
  },
  {
    value: "pelanggan",
    labels: {
      id: "🛍️ Pelanggan / Pembeli",
      en: "🛍️ Customer / Buyer",
      zh: "🛍️ 客戶 / 買家",
      ar: "🛍️ العميل / المشتري"
    } as Record<string, string>
  },
  {
    value: "keluarga",
    labels: {
      id: "👵 Keluarga Besar / Orang Tua",
      en: "👵 Family / Parents",
      zh: "👵 家族長輩 / 父母",
      ar: "👵 العائلة / الآباء"
    } as Record<string, string>
  },
  {
    value: "teman",
    labels: {
      id: "💬 Teman Dekat / Sebaya",
      en: "💬 Close Friend / Peer",
      zh: "💬 好友 / 同輩",
      ar: "💬 صديق مقرب / زميل"
    } as Record<string, string>
  },
];

const PURPOSES = [
  {
    value: "izin-sakit",
    labels: {
      id: "🤒 Minta Izin Sakit atau Cuti Kerja/Kuliah",
      en: "🤒 Sick Leave / Day-Off Request",
      zh: "🤒 請病假 / 事假申請",
      ar: "🤒 طلب إجازة مرضية / غياب"
    } as Record<string, string>
  },
  {
    value: "rsvp",
    labels: {
      id: "💌 Balasan Kehadiran Acara / RSVP Undangan",
      en: "💌 RSVP / Event Attendance",
      zh: "💌 RSVP / 活動出席回覆",
      ar: "💌 تأكيد الحضور / RSVP"
    } as Record<string, string>
  },
  {
    value: "komplain",
    labels: {
      id: "📦 Komplain Paket Rusak / Layanan Kurang Baik",
      en: "📦 Complaint on Package / Service",
      zh: "📦 包裹破損 / 服務投訴",
      ar: "📦 شكوى بشأن الشحنة / الخدمة"
    } as Record<string, string>
  },
  {
    value: "kirim-tugas",
    labels: {
      id: "📝 Kirim Tugas Kuliah atau Laporan Kerjaan",
      en: "📝 Submit Report / Assignment",
      zh: "📝 提交報告 / 作業",
      ar: "📝 تسليم تقرير / وظيفة"
    } as Record<string, string>
  },
  {
    value: "tanya-harga",
    labels: {
      id: "💰 Bertanya Harga barang atau Ketersediaan Stok",
      en: "💰 Ask Price / Stock Availability",
      zh: "💰 詢問價格 / 庫存情況",
      ar: "💰 الاستفسار عن السعر / التوفر"
    } as Record<string, string>
  },
  {
    value: "minta-maaf",
    labels: {
      id: "⏰ Minta Maaf karena Terlambat atau Batal Janji",
      en: "⏰ Apologize for Delay / Cancellation",
      zh: "⏰ 遲到道歉 / 取消預約",
      ar: "⏰ الاعتذار عن التأخير / الإلغاء"
    } as Record<string, string>
  },
  {
    value: "salam",
    labels: {
      id: "🌟 Selamat Hari Raya atau Silaturahmi Sopan",
      en: "🌟 Holiday Greetings / Silaturahmi",
      zh: "🌟 節日問候 / 溫馨祝愿",
      ar: "🌟 تهنئة بالعيد / تحية طيبة"
    } as Record<string, string>
  },
];

export default function SakuSopan({ onSpeak, isSpeaking, lang }: SakuSopanProps) {
  const [target, setTarget] = useState("dosen");
  const [purpose, setPurpose] = useState("izin-sakit");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SopanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const resetAll = () => {
    setResult(null);
    setError(null);
    setDetail("");
  };

  const generateMessages = async () => {
    if (!target || !purpose) {
      setError(lang === "id" ? "Penerima dan tujuan pesan harus diisi!" : "Recipient and purpose must be specified!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCopiedKey(null);

    const activeTarget = (TARGETS.find((t) => t.value === target)?.labels[lang] || TARGETS.find((t) => t.value === target)?.labels.id || target);
    const activePurpose = (PURPOSES.find((p) => p.value === purpose)?.labels[lang] || PURPOSES.find((p) => p.value === purpose)?.labels.id || purpose);

    try {
      const response = await fetch("/api/sopan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: activeTarget,
          purpose: activePurpose,
          detail,
          lang,
        }),
      });

      if (!response.ok) {
        let errMsg = "Gagal menyusun pesan";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {
          errMsg = `HTTP error ${response.status}: ${response.statusText || "Server error"}`;
        }
        throw new Error(errMsg);
      }

      const data: SopanResult = await response.json();
      setResult(data);

      onSpeak(getTranslation("sopanSpeakResult", lang));
    } catch (err: any) {
      setError(err.message || "Gagal menyambung ke otak AI. Coba beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const speakText = (text: string) => {
    onSpeak(text);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {getTranslation("sopanBadge", lang)}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{getTranslation("sopanTitle", lang)}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{getTranslation("sopanDesc", lang)}</p>
          </div>
          {(detail || result) && (
            <button
              id="btn-sopan-reset"
              onClick={resetAll}
              className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-red-500 font-medium cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {getTranslation("btnReset", lang)}
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              {getTranslation("sopanLabelTarget", lang)}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARGETS.map((t) => (
                <button
                  id={`btn-target-${t.value}`}
                  key={t.value}
                  type="button"
                  onClick={() => setTarget(t.value)}
                  className={`text-left text-xs p-2.5 rounded-xl border transition-all truncate leading-relaxed cursor-pointer ${
                    target === t.value
                      ? "bg-indigo-50 border-indigo-400 text-indigo-800 font-extrabold shadow-2xs"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600 font-semibold"
                  }`}
                >
                  {t.labels[lang] || t.labels.id}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              {getTranslation("sopanLabelPurpose", lang)}
            </label>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {PURPOSES.map((p) => (
                <button
                  id={`btn-purpose-${p.value}`}
                  key={p.value}
                  type="button"
                  onClick={() => setPurpose(p.value)}
                  className={`text-left text-xs py-2.5 px-3 rounded-xl border transition-colors cursor-pointer ${
                    purpose === p.value
                      ? "bg-indigo-500 hover:bg-indigo-600 border-indigo-600 text-white font-bold shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-700 font-semibold"
                  }`}
                >
                  {p.labels[lang] || p.labels.id}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 flex justify-between items-center block">
              <span>{getTranslation("sopanLabelDetail", lang)}</span>
            </label>
            <textarea
              id="txt-context-detail"
              rows={3}
              placeholder={getTranslation("sopanPlaceholderDetail", lang)}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50 font-semibold leading-relaxed"
            />
          </div>

          <div className="pt-2">
            <button
              id="btn-sopan-generate"
              onClick={generateMessages}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:brightness-105 active:scale-98 text-white py-3.5 rounded-2xl font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{getTranslation("loadingTip", lang)}</span>
                </>
              ) : (
                <>
                  <MessageSquareCode className="w-5 h-5 text-indigo-100" />
                  <span>{getTranslation("btnGenerate", lang)}</span>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
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
          id="block-sopan-results"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="px-1 flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                {getTranslation("sopanBadge", lang)}
              </span>
              <h3 className="text-lg font-extrabold text-slate-950 mt-1">📬 {getTranslation("sopanSpeakResult", lang)}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-extrabold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {getTranslation("sopanResultSangatSopan", lang)}
                  </span>
                  <button
                    id="btn-sopan-tts-1"
                    onClick={() => speakText(result.pilihanSangatSopan)}
                    className="text-[10px] text-slate-400 hover:text-indigo-600 font-semibold cursor-pointer"
                  >
                    🔊 {getTranslation("btnListenVoice", lang).split(" ")[0]}
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line select-all min-h-[140px]">
                  {result.pilihanSangatSopan}
                </p>
              </div>
              <button
                id="btn-sopan-copy-1"
                onClick={() => copyToClipboard(result.pilihanSangatSopan, "sopan")}
                className={`mt-4 w-full text-xs font-extrabold py-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  copiedKey === "sopan"
                    ? "bg-green-500 border-green-600 text-white"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100"
                }`}
              >
                {copiedKey === "sopan" ? (
                  <>
                    <Check className="w-4 h-4" />
                    {getTranslation("btnCopied", lang)}
                  </>
                ) : (
                  <>
                    <span>📋 {getTranslation("btnCopy", lang)}</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                    {getTranslation("sopanResultRamahHangat", lang)}
                  </span>
                  <button
                    id="btn-sopan-tts-2"
                    onClick={() => speakText(result.pilihanRamahHangat)}
                    className="text-[10px] text-slate-400 hover:text-amber-600 font-semibold cursor-pointer"
                  >
                    🔊 {getTranslation("btnListenVoice", lang).split(" ")[0]}
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line select-all min-h-[140px]">
                  {result.pilihanRamahHangat}
                </p>
              </div>
              <button
                id="btn-sopan-copy-2"
                onClick={() => copyToClipboard(result.pilihanRamahHangat, "hangat")}
                className={`mt-4 w-full text-xs font-extrabold py-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  copiedKey === "hangat"
                    ? "bg-green-500 border-green-600 text-white"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100"
                }`}
              >
                {copiedKey === "hangat" ? (
                  <>
                    <Check className="w-4 h-4" />
                    {getTranslation("btnCopied", lang)}
                  </>
                ) : (
                  <>
                    <span>📋 {getTranslation("btnCopy", lang)}</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {getTranslation("sopanResultSingkatPadat", lang)}
                  </span>
                  <button
                    id="btn-sopan-tts-3"
                    onClick={() => speakText(result.pilihanSingkatPadat)}
                    className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    🔊 {getTranslation("btnListenVoice", lang).split(" ")[0]}
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line select-all min-h-[140px]">
                  {result.pilihanSingkatPadat}
                </p>
              </div>
              <button
                id="btn-sopan-copy-3"
                onClick={() => copyToClipboard(result.pilihanSingkatPadat, "padat")}
                className={`mt-4 w-full text-xs font-extrabold py-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  copiedKey === "padat"
                    ? "bg-green-500 border-green-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                {copiedKey === "padat" ? (
                  <>
                    <Check className="w-4 h-4" />
                    {getTranslation("btnCopied", lang)}
                  </>
                ) : (
                  <>
                    <span>📋 {getTranslation("btnCopy", lang)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
