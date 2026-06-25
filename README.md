# PT Anugerah Indotirta Raharja — Wholesale Distributor Management Dashboard 🚀

Dashboard manajemen distributor grosir modern dan terintegrasi yang dirancang khusus untuk mengelola berbagai produk brand FMCG & Frozen Food (seperti **Fiesta**, **Shifudo**, **Okefood**, dan lainnya) di berbagai cabang perusahaan. Sistem ini memadukan kemudahan operasional kasir cabang dengan pengawasan performa bisnis terpusat bagi jajaran direksi/Super Admin (Pusat).

Sistem ini didesain dengan estetika premium, performa responsif, serta alur data tersentralisasi secara aman menggunakan **Prisma ORM** dan **JWT Authentication** demi efisiensi operasional harian.

---

## 📌 Gambaran Umum Sistem & Arsitektur

Aplikasi ini menggunakan Next.js (App Router) dengan arsitektur fullstack modular. Frontend dibangun dengan React dan TypeScript, sementara Backend menggunakan Next.js API Routes yang terhubung ke database relasional melalui **Prisma ORM**.

```mermaid
graph TD
    subgraph klien ["Klien / UI (React)"]
        UA[Admin Pusat / Super Admin] -->|Akses Global| DB[Dashboard Analisis]
        UB[Admin Cabang] -->|Akses Terbatas| DB
    end

    subgraph backend ["Backend (Next.js API Routes)"]
        DB --> API[API Endpoints]
        API --> Auth[JWT Authentication]
        API --> PE[Pricing & Stock Engine]
    end

    subgraph layer_penyimpanan ["Layer Penyimpanan (Relational DB)"]
        API --> Prisma[Prisma ORM]
        Prisma --> SQL[(Database SQL)]
    end
```

### 1. Sistem Multi-Cabang Tersentralisasi 🔒
*   **Database Relasional**: Menggantikan penyimpanan lokal (localStorage), sistem kini menggunakan database sungguhan melalui Prisma ORM untuk menjamin integritas, keamanan, dan skalabilitas data antar cabang.
*   **Autentikasi Aman**: Login menggunakan sistem JWT (JSON Web Token) dan hashing password dengan bcrypt.
*   **Sinkronisasi Global**: Modifikasi nama produk, harga, dan kategori oleh Super Admin akan langsung tersinkronisasi ke seluruh cabang secara otomatis.

---

## 👥 Sistem Peran & Akses Pengguna (Role Management)

Sistem menggunakan Autentikasi JWT dengan role tersentralisasi di database:

| Peran (Role) | Fitur Utama |
| :--- | :--- |
| **Super Admin** | Konsolidasi seluruh cabang, manajemen akun cabang, master kategori, perubahan harga global. |
| **Branch Admin** | Kasir lokal, kelola stok gudang cabang, piutang & buku toko wilayah cabang masing-masing. |

---

## 🛠️ Kupas Tuntas Fitur Aplikasi

### 1. Analytics Dashboard Modern 📊
*   **Key Performance Indicators (KPIs)**: Penjualan Hari Ini, Penjualan Bulan Ini, Total Piutang, dan Stok Menipis.
*   **Visualisasi Data Interaktif (Recharts)**: Grafik Penjualan Mingguan dan Kontribusi Cabang.
*   **Live Widgets**: Notifikasi stok kritis dan feed pesanan terbaru.

### 2. Sistem Kasir & Katalog Pemesanan (Store Cashier) 🛒
*   **Batas Kategori Keranjang (Cart Category Lock)**: Validasi ketat kategori produk dalam satu invoice (Faktur).
*   **Manajemen Pemesanan Fleksibel**: Validasi stok real-time yang terhubung langsung ke backend server.
*   **Manajemen Stok Otomatis**: Integrasi mutasi stok gudang dengan pembukuan piutang toko.

### 3. Riwayat Pesanan & Manajemen Piutang 📜💸
*   **Audit Log**: Pencarian dan filter transaksi historis tingkat lanjut berbasis tanggal.
*   **Sistem Peringatan Jatuh Tempo**: Visualisasi cerdas untuk piutang yang telah lewat tenggat waktu.
*   **Pelunasan Instan**: "One-Click Settlement" terintegrasi API untuk melunasi tagihan yang mensinkronisasi utang toko.

### 4. Manajemen Stok Gudang & Buku Toko 📦🏪
*   **Indikator Status Stok**: Visualisasi peringatan stok aman, menipis, atau habis (Out of Stock).
*   **Profil Detil Pelanggan**: Penelusuran riwayat transaksi per toko secara granular.

### 5. Buku Produk & Dynamic Pricing Engine 🏷️
*   **Manajemen Terpusat**: Operasi CRUD produk yang terkonsolidasi via API Next.js.
*   **Dynamic Price Changes**: Perubahan harga dasar terdistribusi dengan aman melalui relasi schema Prisma.

---

## 🛠️ Tech Stack & Dependensi

Proyek ini dibangun di atas teknologi fullstack modern berkinerja tinggi:

*   **Framework**: [Next.js](https://nextjs.org/) (React 18/19, TypeScript, App Router)
*   **Styling**: Vanilla CSS & [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components**: [Radix UI](https://www.radix-ui.com/), [Framer Motion](https://www.framer.com/motion/)
*   **Icons**: [Lucide React](https://lucide.dev/) & MUI Icons
*   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
*   **Database & ORM**: [Prisma ORM](https://www.prisma.io/)
*   **Authentication**: JSON Web Token (`jsonwebtoken`) & `bcryptjs`
*   **Forms & Validation**: `react-hook-form` & `zod`
*   **Charts**: [Recharts](https://recharts.org/)

---

## 📦 Cara Menjalankan Project Secara Lokal

Ikuti langkah-langkah berikut untuk menjalankan aplikasi:

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Pengaturan Environment Variables (Database & Auth)
Buat file `.env` di *root* direktori dan sesuaikan parameter koneksi databasenya.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/namadb" # Sesuaikan dengan DB lokal Anda
JWT_SECRET="rahasia_jwt_super_aman_anda"
```

### 3. Migrasi Database & Seeding
Jalankan perintah Prisma untuk membentuk skema database dan mengisi *seed data* awal:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```
*(Catatan: `npx prisma db seed` akan menjalankan script `prisma/seed.ts` untuk membuat user admin awal).*

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser Anda dan akses halaman: **`http://localhost:3000`**

---

Developed with ❤️ by **PT Anugerah Indotirta Raharja Tech Team**.
*Copyright © 2026. All rights reserved.*