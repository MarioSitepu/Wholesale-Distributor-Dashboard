# Wholesale Distributor Dashboard (Fiesta & Shifudo)

Dashboard manajemen distributor grosir modern yang dirancang khusus untuk mengelola produk brand **Fiesta** dan **Shifudo** di berbagai cabang perusahaan.

## 🚀 Fitur Utama

### 1. Sistem Multi-Cabang (Branch Isolation)
*   Mendukung operasional di 3 cabang utama: **Palembang**, **Baturaja**, dan **Jambi**.
*   Data inventaris dan transaksi terisolasi per cabang untuk akurasi laporan.

### 2. Manajemen Produk Cerdas
*   **Pengkategorian Brand**: Pemisahan produk antara Fiesta dan Shifudo.
*   **Price Management v2**:
    *   **Scheduled Price Change**: Atur jadwal kenaikan/penurunan harga di masa depan secara otomatis.
    *   **Retroactive Update**: Ubah harga dengan tanggal berlaku surut (backdate), sistem akan otomatis mengoreksi total belanja dan piutang pada transaksi lama yang terdampak.
*   **Daftar Produk & Riwayat**: Detail produk lengkap dengan grafik penjualan dan log transaksi per barang.

### 3. Sistem Pemesanan & Kasir (Store Management)
*   **Cart Category Lock**: Mencegah pencampuran produk Fiesta dan Shifudo dalam satu bon belanja (Invoice) untuk kemudahan administrasi.
*   **UI/UX Premium**: Feedback visual saat keranjang terkunci dan animasi transisi yang halus.
*   **Riwayat Pesanan**: Filter canggih berdasarkan Toko, Brand, Hari, atau Bulan.

### 4. Pelaporan & Ekspor
*   **Export to CSV**: Unduh laporan riwayat pesanan yang telah difilter ke dalam format CSV untuk keperluan audit atau input ke Excel/Google Sheets.
*   **Buku Toko (Store Ledger)**: Kelola daftar toko pelanggan, piutang, dan riwayat belanja per toko.

## 🛠️ Tech Stack

*   **Frontend**: React.js dengan TypeScript.
*   **Build Tool**: Vite.
*   **Styling**: Vanilla CSS & Tailwind CSS (Modern Aesthetics).
*   **Icons**: Lucide React.
*   **Data Persistence**: LocalStorage (Branch-prefixed).

## 📦 Cara Menjalankan

1. Clone repositori ini.
2. Jalankan `npm install` untuk menginstal dependensi.
3. Jalankan `npm run dev` untuk memulai server pengembangan.
4. Login menggunakan salah satu akun admin cabang (Palembang/Baturaja/Jambi).

---

Developed with ❤️ for Wholesale Efficiency.