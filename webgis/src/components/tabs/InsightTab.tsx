'use client';
// ============================================================
// InsightTab — Tab 4: Insight Naratif + AI Chat
// Menampilkan ringkasan temuan, narasi insight, dan AI chat
// yang menjawab pertanyaan berdasarkan knowledge base proyek
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react';
import { useMapStore } from '@/store/mapStore';
import { getFeatureAreaHa } from '@/lib/geoUtils';
import {
  TrendingUp, TrendingDown, AlertTriangle, Activity,
  MessageCircle, Send, Bot, User, Sparkles,
  ArrowRight, ChevronDown, ChevronUp, BookOpen,
  MapPin, BarChart3, Droplets, Trees,
} from 'lucide-react';

// ============================================================
// Knowledge Base — Dibuat dari Laporan Akhir Proyek
// ============================================================
const KNOWLEDGE_BASE = {
  wilayah: `Kabupaten Morowali, Sulawesi Tengah, dengan fokus pada Kecamatan Bahodopi dan kawasan sekitar Indonesia Morowali Industrial Park (IMIP). Wilayah ini merupakan pusat industri pengolahan nikel terbesar di Indonesia.`,

  objekTarget: `Dua objek target: (1) Lahan Terbuka — area tambang terbuka/open pit dan stockpile sebagai indikator langsung ekspansi tambang, dan (2) Perairan — badan air pesisir sebagai proksi kekeruhan dan sedimentasi yang mencerminkan dampak tidak langsung dari aktivitas tambang.`,

  dataSumber: `Sentinel-2 Surface Reflectance Harmonized (COPERNICUS/S2_SR_HARMONIZED) diakses melalui Google Earth Engine. Citra diambil pada periode Juni–September 2024 dan Juni–September 2025 (musim kering). Resolusi 10 meter. Cloud mask menggunakan band QA60. Metode komposit: Median composite.`,

  metodologi: `Feature Stack terdiri dari band B2, B3, B4, B8, B11, B12 + indeks turunan (NDVI, NDBI/BSI untuk lahan; NDWI, NDTI untuk air). Model: Random Forest Classifier dengan 5-fold Cross-Validation (GridSearchCV), optimasi F1-score. Hyperparameter terbaik: 100 trees, max_depth=20, min_samples_split=2, class_weight='balanced'.`,

  hasilLahan: {
    luas2024: 11820.23,
    luas2025: 9601.69,
    persentase2024: 14.78,
    persentase2025: 12.00,
    netChange: -2218.54,
    netChangePercent: -18.77,
    gain: 1450.37,
    loss: 3668.91,
    accuracy: 95.8,
    precision: 98.2,
    recall: 93.1,
    f1: 95.6,
  },

  hasilPerairan: {
    f1: 80.2,
    threshold: 0.46,
  },

  temuanUtama: `Lahan tambang terbuka menyusut bersih 2.218,54 Ha (−18,77%) antara 2024 dan 2025. Area loss (3.668,91 Ha) lebih dari dua kali lipat area gain (1.450,37 Ha). Sebagian area tambang yang aktif pada 2024 telah direvegetasi, direklamasi, atau berubah fungsi pada 2025 — sementara ekspansi baru tetap terjadi di lokasi lain.`,

  dinamikaSpasial: `Klaster gain Lahan Terbuka terbesar berjarak <1 km dari klaster loss Perairan terbesar (dampak dekat-sumber: sedimentasi lokal). Klaster gain Perairan raksasa berjarak ~12 km dari zona ekspansi tambang namun tetap dalam satu sistem pesisir (dampak jauh-sumber: dispersi sedimen terakumulasi di zona muara/outfall).`,

  keterbatasan: `Ground truth relatif kecil. Analisis mencakup ±71,5% luas kecamatan akibat gap tutupan awan yang tidak simetris. Model Perairan lebih moderat (F1 80,2%) dibanding Lahan Terbuka (F1 95,6%).`,

  tim: `Kelompok 12: Naira Nafisah (Data Engineer), Mia Ramadhani (Data Engineer & Writer), Abdul Hafiz Atallah (ML Lahan), Abshina Atta Kaur (ML Perairan), Daffa Gusti Yanza (GIS & Web Developer). Dosen: Zakiul Fahmi Jailani, S.Kom, MSc.`,
};

// ============================================================
// AI Chat Response Generator (Local, No API)
// ============================================================
function generateAIResponse(question: string, liveStats: LiveStats): string {
  const q = question.toLowerCase().trim();

  // Greeting
  if (q.match(/^(halo|hai|hi|hello|hey|assalamualaikum|selamat)/)) {
    return `Halo! 👋 Saya adalah asisten AI untuk proyek GeoAI Morowali. Saya bisa membantu menjelaskan:\n\n• **Hasil analisis** lahan tambang dan kekeruhan perairan\n• **Metodologi** yang digunakan (Random Forest, Sentinel-2)\n• **Temuan utama** dari perbandingan 2024–2025\n• **Dinamika spasial** dan pola perubahan\n\nSilakan ajukan pertanyaan Anda! 🗺️`;
  }

  // About the project
  if (q.match(/(tentang|apa ini|proyek|project|webgis|tujuan)/)) {
    return `**Proyek GeoAI Morowali** adalah sistem WebGIS interaktif untuk mendeteksi perubahan lahan tambang dan perairan pesisir di ${KNOWLEDGE_BASE.wilayah}\n\n**Objek Target:**\n${KNOWLEDGE_BASE.objekTarget}\n\nProyek ini menggunakan citra satelit Sentinel-2 (resolusi 10m) dan model Machine Learning Random Forest untuk mengklasifikasikan perubahan antara tahun 2024 dan 2025.`;
  }

  // Lahan questions
  if (q.match(/(lahan|tambang|open pit|stockpile|ekspansi|revegetasi|reklamasi)/)) {
    const h = KNOWLEDGE_BASE.hasilLahan;
    let response = `**📊 Analisis Lahan Terbuka (Tambang)**\n\n`;
    response += `| Metrik | Nilai |\n|---|---|\n`;
    response += `| Luas 2024 | **${h.luas2024.toLocaleString('id-ID')} Ha** (${h.persentase2024}% AOI) |\n`;
    response += `| Luas 2025 | **${h.luas2025.toLocaleString('id-ID')} Ha** (${h.persentase2025}% AOI) |\n`;
    response += `| Perubahan Bersih | **${h.netChange.toLocaleString('id-ID')} Ha** (${h.netChangePercent}%) |\n`;
    response += `| Area Gain (Ekspansi) | +${h.gain.toLocaleString('id-ID')} Ha |\n`;
    response += `| Area Loss (Penyusutan) | -${h.loss.toLocaleString('id-ID')} Ha |\n\n`;
    response += `**Interpretasi:** ${KNOWLEDGE_BASE.temuanUtama}`;

    if (liveStats.gainLahan) {
      response += `\n\n📡 *Data live dari GeoJSON:* Gain = ${liveStats.gainLahan.totalLuas.toFixed(2)} Ha (${liveStats.gainLahan.featureCount} poligon)`;
    }
    return response;
  }

  // Perairan / kekeruhan questions
  if (q.match(/(air|perairan|kekeruhan|keruh|sedimen|pesisir|laut|sungai|ndwi|ndti)/)) {
    let response = `**💧 Analisis Kekeruhan Perairan**\n\n`;
    response += `Model perairan menggunakan Random Forest gabungan (combined) 2024+2025 dengan threshold **${KNOWLEDGE_BASE.hasilPerairan.threshold}** dan F1-score **${KNOWLEDGE_BASE.hasilPerairan.f1}%**.\n\n`;
    response += `Indeks yang digunakan: **NDWI** (memisahkan badan air dari daratan) dan **NDTI** (proksi tingkat kekeruhan/sedimen tersuspensi).\n\n`;
    response += `**Dinamika:** ${KNOWLEDGE_BASE.dinamikaSpasial}`;

    if (liveStats.gainAir || liveStats.lossAir) {
      response += `\n\n📡 *Data live:*`;
      if (liveStats.gainAir) response += ` Gain Air = ${liveStats.gainAir.totalLuas.toFixed(2)} Ha;`;
      if (liveStats.lossAir) response += ` Loss Air = ${liveStats.lossAir.totalLuas.toFixed(2)} Ha`;
    }
    return response;
  }

  // Model / evaluasi questions
  if (q.match(/(model|akurasi|accuracy|precision|recall|f1|random forest|evaluasi|performa|kinerja)/)) {
    const h = KNOWLEDGE_BASE.hasilLahan;
    return `**🤖 Evaluasi Model Machine Learning**\n\n**Model Lahan Terbuka (Random Forest):**\n| Metrik | Skor |\n|---|---|\n| Accuracy | **${h.accuracy}%** |\n| Precision | **${h.precision}%** |\n| Recall | **${h.recall}%** |\n| F1-Score | **${h.f1}%** |\n\nHyperparameter: 100 trees, max_depth=20, min_samples_split=2, class_weight='balanced'. Optimasi via 5-fold Cross-Validation (GridSearchCV) terhadap skor F1.\n\n**Model Perairan (RF Gabungan):**\n• F1-Score: **${KNOWLEDGE_BASE.hasilPerairan.f1}%** (moderat)\n• Threshold: ${KNOWLEDGE_BASE.hasilPerairan.threshold}\n\n⚠️ Model perairan memiliki performa lebih rendah karena variabilitas spektral badan air yang lebih kompleks dibanding lahan terbuka.`;
  }

  // Data / sentinel / preprocessing
  if (q.match(/(data|sentinel|citra|satelit|preprocessing|band|gee|earth engine|google earth)/)) {
    return `**🛰️ Data & Preprocessing**\n\n${KNOWLEDGE_BASE.dataSumber}\n\n**Band yang digunakan:** B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR1), B12 (SWIR2)\n\n**Indeks Spektral:**\n• **NDVI** — Vegetasi (lahan terbuka = NDVI rendah)\n• **NDBI/BSI** — Built-up/Bare Soil Index\n• **NDWI** — Water Index (pemisah air-daratan)\n• **NDTI** — Turbidity Index (kekeruhan)`;
  }

  // Metodologi
  if (q.match(/(metod|cara|teknik|algoritma|feature|fitur|stack|pendekatan|langkah)/)) {
    return `**⚙️ Metodologi**\n\n${KNOWLEDGE_BASE.metodologi}\n\n**Alur Kerja:**\n1. Koleksi citra Sentinel-2 → Cloud masking → Median composite\n2. Feature engineering (band + indeks spektral)\n3. Ground truth collection (400 titik gabungan)\n4. Split 70:30 (stratified per tahun × kelas)\n5. Training Random Forest + GridSearchCV\n6. Klasifikasi → Post-processing → GeoJSON\n7. Change detection (overlay 2024 vs 2025)\n8. WebGIS deployment`;
  }

  // Change detection / perubahan
  if (q.match(/(perubahan|change|gain|loss|delta|perbedaan|banding|perbandingan|2024|2025)/)) {
    const h = KNOWLEDGE_BASE.hasilLahan;
    return `**🔄 Deteksi Perubahan 2024 → 2025**\n\n**Lahan Terbuka:**\n• 2024: ${h.luas2024.toLocaleString('id-ID')} Ha → 2025: ${h.luas2025.toLocaleString('id-ID')} Ha\n• Net change: **${h.netChange.toLocaleString('id-ID')} Ha (${h.netChangePercent}%)**\n• Gain (ekspansi baru): +${h.gain.toLocaleString('id-ID')} Ha\n• Loss (penyusutan/reklamasi): -${h.loss.toLocaleString('id-ID')} Ha\n\n**Dinamika Spasial:**\n${KNOWLEDGE_BASE.dinamikaSpasial}\n\n**Kesimpulan:** Area loss 2,5× lebih besar dari area gain — menunjukkan net reklamasi/revegetasi, meski ekspansi tetap berlangsung di titik lain.`;
  }

  // Tim / kelompok
  if (q.match(/(tim|kelompok|anggota|siapa|pembuat|dosen|mahasiswa)/)) {
    return `**👥 Tim Proyek (Kelompok 12)**\n\n${KNOWLEDGE_BASE.tim}\n\n*Program Studi Sistem Informasi, Fakultas Teknik dan Ilmu Komputer, Universitas Bakrie, 2026.*`;
  }

  // Keterbatasan
  if (q.match(/(keterbatasan|limit|kelemahan|kekurangan|masalah|kendala)/)) {
    return `**⚠️ Keterbatasan Proyek**\n\n${KNOWLEDGE_BASE.keterbatasan}\n\n**Rekomendasi:**\n• Tambah titik sampel pada zona transisi spektral\n• Sesuaikan ambang filter awan untuk coverage lebih luas\n• Cek silang klaster perubahan dengan data lapangan\n• Verifikasi lokasi outfall resmi IMIP`;
  }

  // Morowali / IMIP
  if (q.match(/(morowali|imip|nikel|smelter|sulawesi|bahodopi|industri)/)) {
    return `**📍 Tentang Wilayah Kajian**\n\n${KNOWLEDGE_BASE.wilayah}\n\nIMIP (Indonesia Morowali Industrial Park) mengoperasikan fasilitas smelter nikel berskala besar. Aktivitas tambang nikel open-pit dan pengolahan ore di sekitar kawasan ini menjadi driver utama perubahan lahan dan sedimentasi pesisir yang terdeteksi dalam analisis GeoAI ini.\n\nProyek ini relevan untuk pemantauan jejak lingkungan lokal dari rantai pasok mineral kritis (nikel) untuk baterai kendaraan listrik (EV) secara global.`;
  }

  // Ringkasan
  if (q.match(/(ringkas|kesimpulan|summary|rangkum|singkat|temuan|hasil)/)) {
    const h = KNOWLEDGE_BASE.hasilLahan;
    return `**📋 Ringkasan Hasil Proyek**\n\n1. **Lahan Terbuka:** Menyusut **${Math.abs(h.netChangePercent)}%** (dari ${h.luas2024.toLocaleString('id-ID')} Ha → ${h.luas2025.toLocaleString('id-ID')} Ha)\n2. **Akurasi Model Lahan:** F1 = **${h.f1}%** (sangat andal)\n3. **Model Perairan:** F1 = **${KNOWLEDGE_BASE.hasilPerairan.f1}%** (moderat)\n4. **Pola Spasial:** Ekspansi tambang berasosiasi dengan perubahan kekeruhan pesisir, baik langsung (<1 km) maupun terdispersi (~12 km)\n5. **Net trend:** Reklamasi/revegetasi lebih dominan dari ekspansi baru\n\n*Data diolah dari citra Sentinel-2 (10m) menggunakan Random Forest Classifier.*`;
  }

  // Default / catch-all
  return `Saya belum memiliki informasi spesifik untuk pertanyaan tersebut, tetapi saya bisa membantu tentang:\n\n• **"Apa hasil analisis lahan?"** — Data luas & perubahan\n• **"Bagaimana perubahan perairan?"** — Kekeruhan & sedimentasi\n• **"Berapa akurasi model?"** — Evaluasi ML\n• **"Data apa yang digunakan?"** — Sentinel-2 & preprocessing\n• **"Bagaimana metodologinya?"** — Alur kerja & algoritma\n• **"Apa kesimpulannya?"** — Ringkasan temuan\n• **"Siapa tim pembuat?"** — Anggota kelompok\n\nCoba ajukan pertanyaan dengan kata kunci di atas! 🎯`;
}

// ============================================================
// Types
// ============================================================
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LiveStats {
  gainLahan: { totalLuas: number; featureCount: number } | null;
  lossLahan: { totalLuas: number; featureCount: number } | null;
  gainAir: { totalLuas: number; featureCount: number } | null;
  lossAir: { totalLuas: number; featureCount: number } | null;
  netLahan: number;
  netAir: number;
}

// ============================================================
// Suggested Questions
// ============================================================
const SUGGESTED_QUESTIONS = [
  { icon: <Trees size={12} />, text: 'Bagaimana perubahan lahan tambang?', color: '#f97316' },
  { icon: <Droplets size={12} />, text: 'Bagaimana kondisi kekeruhan air?', color: '#06b6d4' },
  { icon: <BarChart3 size={12} />, text: 'Berapa akurasi model ML?', color: '#a78bfa' },
  { icon: <MapPin size={12} />, text: 'Apa kesimpulan proyek ini?', color: '#22c55e' },
];

// ============================================================
// Main Component
// ============================================================
export default function InsightTab() {
  const geoJsonCache = useMapStore((s) => s.geoJsonCache);
  const [activeSection, setActiveSection] = useState<'insight' | 'chat'>('insight');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Halo! 👋 Saya **GeoAI Assistant** — siap membantu menjelaskan temuan analisis deteksi perubahan lahan tambang dan perairan di Kabupaten Morowali.\n\nAnda bisa bertanya tentang **hasil klasifikasi**, **metodologi**, **evaluasi model**, atau topik lain dari proyek ini. Mulai dari mana? 🗺️`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Compute live stats
  const liveStats = useMemo((): LiveStats => {
    const computeStats = (layerId: string) => {
      const data = geoJsonCache[layerId as keyof typeof geoJsonCache];
      if (!data?.features?.length) return null;
      let totalLuas = 0;
      let featureCount = 0;
      for (const f of data.features) {
        featureCount++;
        totalLuas += getFeatureAreaHa(f as Parameters<typeof getFeatureAreaHa>[0]);
      }
      return { totalLuas, featureCount };
    };

    const gainLahan = computeStats('gain_lahan');
    const lossLahan = computeStats('loss_lahan');
    const gainAir = computeStats('gain_air');
    const lossAir = computeStats('loss_air');

    return {
      gainLahan,
      lossLahan,
      gainAir,
      lossAir,
      netLahan: (gainLahan?.totalLuas ?? 0) - (lossLahan?.totalLuas ?? 0),
      netAir: (gainAir?.totalLuas ?? 0) - (lossAir?.totalLuas ?? 0),
    };
  }, [geoJsonCache]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSend = (text?: string) => {
    const msg = text || inputValue.trim();
    if (!msg) return;

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay for natural feel
    setTimeout(() => {
      const response = generateAIResponse(msg, liveStats);
      const aiMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <div className="space-y-3">
      {/* Section Toggle */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setActiveSection('insight')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
          style={activeSection === 'insight' ? {
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
            color: '#f97316',
            border: '1px solid rgba(249,115,22,0.25)',
          } : {
            color: 'var(--color-text-dim)',
            border: '1px solid transparent',
          }}
        >
          <BookOpen size={12} />
          Ringkasan
        </button>
        <button
          onClick={() => setActiveSection('chat')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
          style={activeSection === 'chat' ? {
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
            color: '#8b5cf6',
            border: '1px solid rgba(139,92,246,0.25)',
          } : {
            color: 'var(--color-text-dim)',
            border: '1px solid transparent',
          }}
        >
          <MessageCircle size={12} />
          AI Chat
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
        </button>
      </div>

      {/* ============= INSIGHT SECTION ============= */}
      {activeSection === 'insight' && (
        <div className="space-y-3 animate-fade-in">
          {/* Narrative Summary Card */}
          <NarrativeCard
            title="Temuan Utama"
            emoji="🔍"
            color="#f97316"
            content={KNOWLEDGE_BASE.temuanUtama}
          />

          {/* Key Metrics */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
            <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <BarChart3 size={14} className="text-cyan-400" />
              <h3 className="text-[10px] font-semibold theme-text-muted uppercase tracking-widest">
                Perbandingan 2024 vs 2025
              </h3>
            </div>
            <div className="p-3 space-y-3">
              <ComparisonBar
                label="Lahan Terbuka"
                val2024={KNOWLEDGE_BASE.hasilLahan.luas2024}
                val2025={KNOWLEDGE_BASE.hasilLahan.luas2025}
                unit="Ha"
                color2024="#fb923c"
                color2025="#f97316"
              />
              <div className="flex items-center gap-2 px-1">
                <TrendingDown size={12} className="text-emerald-400" />
                <span className="text-[10px] theme-text-muted">
                  Penyusutan bersih <strong className="text-emerald-400">{Math.abs(KNOWLEDGE_BASE.hasilLahan.netChangePercent)}%</strong> — area revegetasi 2,5× lebih besar dari ekspansi baru
                </span>
              </div>
            </div>
          </div>

          {/* Spatial Dynamics */}
          <NarrativeCard
            title="Dinamika Spasial"
            emoji="🌏"
            color="#06b6d4"
            content={KNOWLEDGE_BASE.dinamikaSpasial}
          />

          {/* Model Confidence */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
            <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <Activity size={14} className="text-violet-400" />
              <h3 className="text-[10px] font-semibold theme-text-muted uppercase tracking-widest">
                Tingkat Kepercayaan Model
              </h3>
            </div>
            <div className="p-3 space-y-2">
              <ConfidenceBar label="Lahan Terbuka (F1)" value={KNOWLEDGE_BASE.hasilLahan.f1} color="#22c55e" />
              <ConfidenceBar label="Perairan (F1)" value={KNOWLEDGE_BASE.hasilPerairan.f1} color="#f59e0b" />
              <p className="text-[9px] theme-text-dim mt-1 leading-relaxed">
                Model lahan sangat andal; model perairan moderat — variabilitas spektral badan air lebih kompleks.
              </p>
            </div>
          </div>

          {/* Live Stats from GeoJSON */}
          {liveStats.gainLahan && (
            <InsightCard
              title="Data Live dari Peta"
              icon={<Activity size={14} />}
              iconColor="#94a3b8"
              items={[
                {
                  label: 'Gain Lahan Terbuka',
                  value: liveStats.gainLahan ? `+${liveStats.gainLahan.totalLuas.toFixed(2)} Ha` : '—',
                  color: '#f97316',
                },
                {
                  label: 'Loss Lahan Terbuka',
                  value: liveStats.lossLahan ? `-${liveStats.lossLahan.totalLuas.toFixed(2)} Ha` : '—',
                  color: '#4ade80',
                },
                {
                  label: 'Δ Neto Lahan',
                  value: `${liveStats.netLahan > 0 ? '+' : ''}${liveStats.netLahan.toFixed(2)} Ha`,
                  color: liveStats.netLahan > 0 ? '#f97316' : '#4ade80',
                  bold: true,
                },
                {
                  label: 'Gain Zona Keruh',
                  value: liveStats.gainAir ? `+${liveStats.gainAir.totalLuas.toFixed(2)} Ha` : '—',
                  color: '#06b6d4',
                },
                {
                  label: 'Loss Zona Keruh',
                  value: liveStats.lossAir ? `-${liveStats.lossAir.totalLuas.toFixed(2)} Ha` : '—',
                  color: '#a78bfa',
                },
              ]}
            />
          )}

          {/* Limitations note */}
          <div className="rounded-xl p-3" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={12} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] theme-text-muted leading-relaxed">
                {KNOWLEDGE_BASE.keterbatasan}
              </p>
            </div>
          </div>

          {/* CTA to chat */}
          <button
            onClick={() => setActiveSection('chat')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-semibold transition-all duration-200 cursor-pointer hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#a78bfa',
            }}
          >
            <Sparkles size={12} />
            Punya pertanyaan? Tanya AI Chat
            <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* ============= AI CHAT SECTION ============= */}
      {activeSection === 'chat' && (
        <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
          {/* Chat messages */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin space-y-3 pr-1">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: msg.role === 'assistant'
                      ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                      : 'linear-gradient(135deg, #f97316, #ea580c)',
                  }}
                >
                  {msg.role === 'assistant' ? <Bot size={12} className="text-white" /> : <User size={12} className="text-white" />}
                </div>

                {/* Bubble */}
                <div
                  className="rounded-xl px-3 py-2 max-w-[85%]"
                  style={{
                    background: msg.role === 'assistant'
                      ? 'var(--color-bg-surface)'
                      : 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
                    border: `1px solid ${msg.role === 'assistant' ? 'var(--color-border)' : 'rgba(249,115,22,0.25)'}`,
                  }}
                >
                  <div className="text-[11px] theme-text-secondary leading-relaxed whitespace-pre-wrap chat-content">
                    {renderMarkdown(msg.content)}
                  </div>
                  <span className="text-[8px] theme-text-dim mt-1 block text-right">
                    {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                  <Bot size={12} className="text-white" />
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 py-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q.text)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all duration-200 cursor-pointer hover:scale-105"
                  style={{
                    background: `${q.color}10`,
                    border: `1px solid ${q.color}30`,
                    color: q.color,
                  }}
                >
                  {q.icon}
                  {q.text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya tentang data GeoAI..."
              className="flex-1 rounded-xl px-3 py-2.5 text-[11px] theme-text-secondary outline-none transition-all duration-200"
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
              }}
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping || !inputValue.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                border: '1px solid rgba(139,92,246,0.4)',
              }}
            >
              <Send size={13} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function NarrativeCard({ title, emoji, color, content }: {
  title: string; emoji: string; color: string; content: string;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between cursor-pointer"
        style={{ borderBottom: expanded ? '1px solid var(--color-border)' : 'none' }}
      >
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color }}>
            {title}
          </h3>
        </div>
        {expanded ? <ChevronUp size={12} className="theme-text-dim" /> : <ChevronDown size={12} className="theme-text-dim" />}
      </button>
      {expanded && (
        <div className="px-3 py-2.5">
          <p className="text-[11px] theme-text-secondary leading-relaxed">{content}</p>
        </div>
      )}
    </div>
  );
}

function ComparisonBar({ label, val2024, val2025, unit, color2024, color2025 }: {
  label: string; val2024: number; val2025: number; unit: string; color2024: string; color2025: string;
}) {
  const max = Math.max(val2024, val2025);
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] theme-text-muted font-medium">{label}</span>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[9px] theme-text-dim w-8">2024</span>
          <div className="flex-1 h-4 rounded-md overflow-hidden" style={{ background: 'var(--color-bg-card)' }}>
            <div
              className="h-full rounded-md flex items-center px-1.5 transition-all duration-500"
              style={{ width: `${(val2024 / max) * 100}%`, backgroundColor: color2024 }}
            >
              <span className="text-[8px] font-bold text-white whitespace-nowrap">{val2024.toLocaleString('id-ID')} {unit}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] theme-text-dim w-8">2025</span>
          <div className="flex-1 h-4 rounded-md overflow-hidden" style={{ background: 'var(--color-bg-card)' }}>
            <div
              className="h-full rounded-md flex items-center px-1.5 transition-all duration-500"
              style={{ width: `${(val2025 / max) * 100}%`, backgroundColor: color2025 }}
            >
              <span className="text-[8px] font-bold text-white whitespace-nowrap">{val2025.toLocaleString('id-ID')} {unit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] theme-text-muted flex-shrink-0 w-28">{label}</span>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-card)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{value}%</span>
    </div>
  );
}

function InsightCard({ title, icon, iconColor, items }: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  items: { label: string; value: string; color: string; bold?: boolean }[];
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ color: iconColor }}>{icon}</span>
        <h3 className="text-[10px] font-semibold theme-text-muted uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="p-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center gap-2">
            <span className="text-xs theme-text-muted">{item.label}</span>
            <span
              className={`text-xs tabular-nums ${item.bold ? 'font-bold text-sm' : 'font-medium'}`}
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple markdown-like renderer for chat
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableRows: string[][] = [];

  const processInline = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
        }
        parts.push(<strong key={key++} className="font-semibold theme-text">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Code
      const codeMatch = remaining.match(/`(.+?)`/);
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
        }
        parts.push(
          <code key={key++} className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'var(--color-bg-card)' }}>
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
        continue;
      }

      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    return <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table row
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator row
      if (line.match(/^\|[-|:\s]+\|$/)) continue;

      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      // End table, render it
      inTable = false;
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-1">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                {tableRows[0]?.map((cell, ci) => (
                  <th key={ci} className="text-left px-1.5 py-1 theme-text-muted font-semibold" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {processInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-1.5 py-1 theme-text-secondary" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {processInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={`br-${i}`} className="h-1.5" />);
      continue;
    }

    // Bullet list
    if (line.match(/^[•\-\*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-1.5 items-start pl-1">
          <span className="text-violet-400 mt-0.5">•</span>
          <span>{processInline(line.replace(/^[•\-\*]\s/, ''))}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={i} className="flex gap-1.5 items-start pl-1">
          <span className="text-violet-400 font-bold mt-0.5 min-w-[12px] text-right">{num}.</span>
          <span>{processInline(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
      continue;
    }

    // Normal text
    elements.push(<div key={i}>{processInline(line)}</div>);
  }

  // Flush remaining table
  if (inTable && tableRows.length > 0) {
    elements.push(
      <div key="table-end" className="overflow-x-auto my-1">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              {tableRows[0]?.map((cell, ci) => (
                <th key={ci} className="text-left px-1.5 py-1 theme-text-muted font-semibold" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {processInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-1.5 py-1 theme-text-secondary" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {processInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <>{elements}</>;
}
