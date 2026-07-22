# Proyek GeoAI Morowali: Deteksi Perubahan Lahan Tambang

## 📌 Informasi Proyek
- **Mata Kuliah:** Kapita Selekta / GeoAI
- **Anggota Kelompok:** [Nama Anggota 1], [Nama Anggota 2], [Nama Anggota 3]
- **Kota/Kabupaten:** Kabupaten Morowali, Sulawesi Tengah
- **Objek Target:** Lahan Terbuka (akibat tambang) & Kekeruhan Air
- **Deskripsi Singkat:** Proyek ini bertujuan untuk mendeteksi perubahan tutupan lahan dan kekeruhan air di Kabupaten Morowali menggunakan citra satelit Sentinel-2 (2024 vs 2025) dan algoritma *Random Forest Classifier*. Hasil deteksi disajikan dalam bentuk dashboard WebGIS interaktif.

## 📂 Struktur Repositori

Repositori ini disusun berdasarkan ketentuan minimum proyek:

- `gee/` : Berisi script Google Earth Engine untuk tahap *preprocessing*, *sampling*, training model *Random Forest*, dan *export* hasil.
- `webgis/` : Berisi *source code* aplikasi WebGIS interaktif yang dibangun menggunakan Next.js, MapLibre GL JS, dan Tailwind CSS.
- `data/` : Berisi data spasial (GeoJSON) hasil klasifikasi (target 2024 & 2025, gain, loss). *Catatan: Untuk file berukuran besar, tautan unduhan disediakan di dalam folder ini.*
- `results/` : Berisi ringkasan hasil evaluasi model (*Confusion Matrix*, nilai *Accuracy, Precision, Recall, F1-Score*).
- `report/` : Berisi dokumen laporan akhir proyek (PDF).

## 🚀 Cara Membuka WebGIS (Lokal)

Jika Anda ingin menjalankan WebGIS ini secara lokal:

1. Pastikan Anda memiliki **Node.js** (versi 18+) terinstal.
2. Buka terminal dan masuk ke folder `webgis`:
   ```bash
   cd webgis
   ```
3. Instal semua dependensi:
   ```bash
   npm install
   ```
4. Jalankan *development server*:
   ```bash
   npm run dev
   ```
5. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 🔗 Tautan Penting
- **WebGIS (Live):** [Tautan Deploy WebGIS Anda (misal Vercel)]
- **Laporan Akhir (PDF):** [Tautan ke laporan PDF di folder report]
