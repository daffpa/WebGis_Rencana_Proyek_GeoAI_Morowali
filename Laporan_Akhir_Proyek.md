# LAPORAN AKHIR PROYEK
## KAPITA SELEKTA DAN MAHA DATA SISTEM INFORMASI

**“Deteksi Perubahan Lahan Tambang dan Perairan Pesisir Morowali Menggunakan GeoAI Periode 2024–2025”**

**KELOMPOK 12:**
* Abdul Hafiz Atallah (1232002036)
* Abshina Atta Kaur (1232002056)
* Daffa Gusti Yanza (1242002037)
* Mia Ramadhani (1232002012)
* Naira Nafisah (1242002064)

**Dosen:** Zakiul Fahmi Jailani, S.Kom, MSc

**PROGRAM STUDI SISTEM INFORMASI**  
**FAKULTAS TEKNIK DAN ILMU KOMPUTER**  
**UNIVERSITAS BAKRIE**  
**2026**

---

## 1. Pendahuluan
Wilayah yang dipilih dalam proyek ini adalah Kabupaten Morowali, Sulawesi Tengah, dengan fokus pada Kecamatan Bahodopi dan kawasan sekitar Indonesia Morowali Industrial Park (IMIP). Wilayah ini dipilih karena memiliki batas administratif yang jelas, cakupan citra Sentinel-2 yang memadai, serta merupakan pusat industri pengolahan nikel terbesar di Indonesia dimana menjadikannya lokasi yang sangat relevan untuk mengkaji dampak ekspansi tambang terhadap lingkungan menggunakan pendekatan geospasial berbasis kecerdasan buatan (GeoAI).

Proyek ini menetapkan dua objek target yang saling melengkapi: **Lahan Terbuka** (area tambang terbuka/open pit dan stockpile), sebagai indikator langsung ekspansi tambang, dan **Perairan** (badan air pesisir), sebagai proksi kekeruhan dan sedimentasi yang mencerminkan dampak tidak langsung dari aktivitas tambang. Berdasarkan kedua objek tersebut, rumusan masalah yang diajukan adalah: apakah lahan tambang terbuka di Morowali mengalami pertambahan atau penyusutan antara tahun 2024 dan 2025, di mana lokasi perubahan terbesar terjadi, bagaimana pola tersebut berasosiasi secara spasial dengan perubahan karakter perairan pesisir di sekitarnya, dan seberapa dapat dipercaya hasil klasifikasi yang mendasari analisis tersebut.

Hasil analisis ini diharapkan bermanfaat bagi Pemerintah Daerah/Dinas Lingkungan Hidup Kabupaten Morowali sebagai bahan pemantauan lingkungan, pihak IMIP dan auditor ESG smelter nikel sebagai bahan evaluasi dampak operasional, serta peneliti dan akademisi yang mengkaji rantai pasok mineral kritis untuk kendaraan listrik (EV), sebagai data dasar yang dapat diperbarui secara berkala untuk memantau jejak lingkungan lokal dari industri nikel global.

---

## 2. Data & Preprocessing
Data utama yang digunakan adalah koleksi Sentinel-2 Surface Reflectance Harmonized (COPERNICUS/S2_SR_HARMONIZED), diakses melalui Google Earth Engine. Citra diambil pada rentang Juni–September 2024 dan Juni–September 2025 — periode musim kering yang sama untuk kedua tahun agar perbandingan tetap adil.

Setiap citra di filter berdasarkan tutupan awan (CLOUDY_PIXEL_PERCENTAGE < 20%), kemudian di-cloud mask menggunakan band QA60 (bit awan & cirrus) untuk menghilangkan piksel yang terkontaminasi awan. Citra bersih dari kedua tahun disusun menjadi median composite, lalu di-clip ke batas administratif Kecamatan Bahodopi, Kabupaten Morowali, yang bersumber dari Badan Informasi Geospasial (BIG)/GADM. Seluruh analisis dilakukan pada resolusi asli Sentinel-2, yaitu 10 meter.

Seluruh parameter dibuat identik antara tahun 2024 dan 2025 untuk menjamin konsistensi metode sebelum tahap klasifikasi.

### Tabel Parameter Preprocessing Sentinel-2 (Konsisten Antartahun)

| Parameter | Tahun 2024 | Tahun 2025 |
|---|---|---|
| **Koleksi citra** | COPERNICUS/S2_SR_HARMONIZED | COPERNICUS/S2_SR_HARMONIZED |
| **Rentang tanggal** | Juni – September 2024 | Juni – September 2025 |
| **Filter awan (metadata)** | CLOUDY_PIXEL_PERCENTAGE < 20% | CLOUDY_PIXEL_PERCENTAGE < 20% |
| **Cloud masking piksel** | Band QA60 (bit awan & cirrus) | Band QA60 (bit awan & cirrus) |
| **Metode komposit** | Median composite, Cloud Masked | Median composite, Cloud Masked |
| **Batas wilayah (clip)** | Batas administratif Kec. Bahodopi | Batas administratif Kec. Bahodopi |
| **Resolusi analis** | 10 m (Sentinel-2) | 10 m (Sentinel-2) |
| **Sumber batas** | GADM | GADM |

Komposit yang dihasilkan tersedia sebagai `S2_Morowali_B2B3B4B8_2024.tif` dan `S2_Morowali_B2B3B4B8_2025.tif`, mencakup band B2, B3, B4, B8, B11, dan B12.

---

## 3. Metodologi

### 3.1 Feature Stack
Feature Stack disusun dari band dasar Sentinel-2 (B2, B3, B4, B8, B11, B12) ditambah indeks spektral turunan yang dipilih sesuai objek target: NDVI/NDMI untuk vegetasi, NDBI/BSI untuk lahan terbuka, dan NDWI/NDTI untuk perairan/kekeruhan. Kombinasi ini memastikan tiap piksel punya representasi fitur yang cukup untuk membedakan kelas target dari kelas non-target pada masing-masing objek.

#### 3.1.1 Objek Lahan Terbuka — NDVI & NDBI/BSI
NDVI digunakan sebagai fitur utama untuk memisahkan vegetasi dari area non-vegetasi; nilai NDVI rendah hingga negatif mengindikasikan area terbuka seperti tambang, jalan tambang, dan stockpile ore. 
Area NDVI rendah terkonsentrasi di tengah hingga pesisir timur AOI — dikuatkan dengan NDBI/BSI, di mana nilai tinggi menandakan lahan terbuka/terbangun.

#### 3.1.2 Objek Perairan — NDWI & NDTI
Untuk objek Perairan, NDWI/MNDWI digunakan untuk memisahkan badan air dari daratan, sementara NDTI digunakan sebagai proksi tingkat kekeruhan/sedimen tersuspensi pada badan air pesisir dan muara. Nilai NDTI tinggi pada zona pesisir dekat outfall/pelabuhan IMIP mengindikasikan potensi sedimentasi akibat aktivitas tambang di hulu.

### 3.2 Objek Lahan Terbuka
**a. Ground Truth:** Total ground truth yang dikumpulkan untuk objek Lahan Terbuka adalah 400 titik (gabungan 2024 dan 2025). Setelah proses ekstraksi nilai piksel dan pembersihan data kosong/NaN, tersisa 390 titik valid yang digunakan untuk pelatihan model.

**b. Split Data Training Testing:** Split 70:30 dilakukan secara terpisah untuk setiap kombinasi tahun × kelas, kemudian digabungkan kembali guna untuk menjaga keseimbangan antar kombinasi.
* Training: 272 titik
* Testing: 118 titik

**c. Model Random Forest:** Model dilatih menggunakan RandomForestClassifier dengan penyetelan hyperparameter melalui 5-fold Cross-Validation (GridSearchCV), mengoptimalkan skor F1. 
Kombinasi parameter terbaik yang dipilih: `100 trees, max_depth=20, min_samples_split=2, class_weight='balanced'`, dengan skor F1 rata-rata cross-validation sebesar 0,917.

**d. Evaluasi Model (Lahan Terbuka):**
* Accuracy: 95,8%
* Precision: 98,2%
* Recall: 93,1%
* F1-Score: 95,6%

Model menunjukkan kinerja yang sangat baik dengan akurasi 95,8%. Precision yang tinggi (98,2%) menunjukkan model jarang salah menandai area non-tambang sebagai tambang.

**e. Hasil Klasifikasi dan Analisis Perubahan (Lahan Terbuka):**
* **Luas Lahan Terbuka 2024:** 11.820,23 Ha (14,78% dari AOI)
* **Luas Lahan Terbuka 2025:** 9.601,69 Ha (12,00% dari AOI)
* **Perubahan bersih (Net Change):** −2.218,54 Ha (−18,77%)

Lahan tambang terbuka di Bahodopi mengalami penyusutan bersih sebesar 2.218,54 Ha (−18,77%) antara 2024 dan 2025. Area loss (3.668,91 Ha) lebih dari dua kali lipat area gain (1.450,37 Ha), menunjukkan bahwa sebagian area tambang yang aktif pada 2024 telah direvegetasi, direklamasi, atau berubah fungsi pada 2025 — sementara ekspansi baru tetap terjadi di lokasi lain dalam AOI yang sama.

### 3.3 Objek Perairan
**(Data dan analisis spesifik perairan menggunakan model gabungan dengan performa moderat (F1-score 80,2%) yang menunjukkan peningkatan area kekeruhan).**

---

## 4. Dinamika Spasial: Pola Gain, Loss, dan Stabilitas 2024–2025
Meski Lahan Terbuka menyusut dan Perairan meluas (arah berlawanan), analisis klaster menunjukkan keduanya berhubungan secara spasial dalam dua pola berbeda.

* **Dampak dekat-sumber:** Klaster gain Lahan Terbuka terbesar berjarak <1 km dari klaster loss Perairan terbesar. Kedekatan ini mengindikasikan sedimentasi lokal — material dari pembukaan lahan mengendap di badan air terdekat, mengubah piksel air jadi daratan.
* **Dampak jauh-sumber:** Klaster gain Perairan raksasa berjarak ~12 km dari zona ekspansi tambang, namun tetap dalam satu sistem pesisir yang sama. Pola ini lebih konsisten dengan dispersi sedimen dari berbagai titik tambang yang terakumulasi di satu zona muara/outfall. 

Kombinasi kedua pola ini mendukung rumusan masalah proyek: ekspansi tambang berasosiasi dengan perubahan karakter perairan pesisir, baik secara langsung (dekat sumber) maupun terdispersi (jauh dari sumber) — sebagai jejak lingkungan lokal rantai pasok nikel untuk baterai EV global.

---

## 5. Kesimpulan dan Rekomendasi
### 5.1 Ringkasan Temuan
Proyek ini menjawab tiga pertanyaan utama yang dirumuskan di awal. Kedua objek target menunjukkan arah perubahan berlawanan antara 2024–2025: Lahan Terbuka menyusut dari 18,87% menjadi 17,82% luas Kecamatan Bahodopi (loss 7.962,14 Ha vs gain 2.182,46 Ha), sementara Perairan meluas dari 12,91% menjadi 14,08% (gain 8.131,87 Ha vs loss 3.977,26 Ha) dimana pola yang konsisten dengan hipotesis awal bahwa penyusutan tambang berasosiasi dengan perluasan kekeruhan pesisir. Tingkat kepercayaan hasil berbeda antar objek: model Lahan Terbuka sangat andal (F1-score 95,6%), sedangkan model Perairan lebih moderat (F1-score 80,2%).

### 5.2 Keterbatasan
Beberapa hal perlu digarisbawahi sebagai batasan sekaligus peluang pengembangan. Ground truth yang tersedia relatif kecil, dan analisis hanya mencakup ±71,5% luas kecamatan akibat gap tutupan awan yang tidak simetris antar tahun. Keterbatasan ini dapat diperbaiki dengan menambah titik sampel pada zona transisi spektral serta menyesuaikan ambang filter awan. Ke depan, klaster kunci di sekitar zona pesisir dekat kawasan tambang perlu dicek silang dengan data lapangan atau lokasi outfall resmi IMIP.

### 5.3 Tautan Proyek
* **Repository:** [Mozkook/geoai-morowali-lahan-perairan-kelompok12](https://github.com/Mozkook/geoai-morowali-lahan-perairan-kelompok12.git)
* **GitHub WebGIS:** [daffpa/WebGis_Rencana_Proyek_GeoAI_Morowali](https://github.com/daffpa/WebGis_Rencana_Proyek_GeoAI_Morowali.git)
* **WebGIS:** [https://web-gis-rencana-proyek-geo-ai-morow.vercel.app/](https://web-gis-rencana-proyek-geo-ai-morow.vercel.app/)

---

## 6. Kontribusi Anggota Kelompok
1. **Naira Nafisah (1242002064)**: Data Engineer & GitHub Manager
2. **Mia Ramadhani (1232002012)**: Data Engineer, Technical Writer
3. **Abdul Hafiz Atallah (1232002036)**: ML Specialist - Objek Lahan Terbuka
4. **Abshina Atta Kaur (1232002056)**: ML Specialist - Perairan
5. **Daffa Gusti Yanza (1242002037)**: GIS Analyst & Web Developer (Pembuat WebGIS interaktif)
