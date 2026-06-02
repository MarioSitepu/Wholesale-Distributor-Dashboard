# Alur Fitur (Feature Flows) 🚀

Dokumen ini menjelaskan alur kerja (flow) dari setiap fitur utama yang terdapat pada Dashboard Manajemen Distributor Grosir PT Anugerah Indotirta Raharja.

---

## 1. Analytics Dashboard Modern 📊
**Alur Kerja:**
1. **Login & Akses**: Pengguna (Super Admin / Admin Cabang) berhasil login dan diarahkan ke halaman utama (Dashboard).
2. **Kalkulasi Data**: Sistem secara otomatis membaca data pesanan, piutang, dan stok dari database (`localStorage` dengan prefix cabang).
3. **Visualisasi**: 
   - Menampilkan Key Performance Indicators (KPI) seperti Penjualan Hari Ini, Bulan Ini, Total Piutang, dan jumlah Stok Menipis.
   - Merender grafik (chart) tren penjualan dan komposisi kontribusi cabang (khusus Super Admin).
4. **Interaksi & Laporan**: Pengguna memfilter data (Berdasarkan Toko/Tanggal), melihat widget stok kritis, lalu dapat melakukan ekspor data ke format `.csv`.

---

## 2. Sistem Kasir & Katalog Pemesanan (Store Cashier) 🛒
**Alur Kerja:**
1. **Pemilihan Produk**: Admin Cabang masuk ke halaman Kasir dan mulai menambahkan produk ke keranjang belanja.
2. **Validasi Kategori (Cart Lock)**: Sistem memvalidasi item pertama. Jika admin mencoba memasukkan produk berbeda brand (misal Fiesta dan Shifudo bersamaan), sistem akan **menolak** dan menampilkan *Toaster Warning*.
3. **Validasi Stok**: Jika stok gudang tidak mencukupi, tombol "Tambah" akan dinonaktifkan secara otomatis.
4. **Checkout**: 
   - Admin memasukkan Nomor Faktur (Invoice ID) yang valid/unik, memilih Toko Pelanggan, dan menentukan Tanggal Pesanan.
   - Konfirmasi pesanan.
5. **Efek Samping (Side Effects) Sistem**: 
   - Pesanan baru dicatat ke dalam database `Orders`.
   - Stok fisik produk di gudang dipotong (nilai `totalOut` bertambah, `stock` berkurang).
   - Tagihan/Piutang baru atas nama toko diterbitkan dengan masa jatuh tempo standar **30 hari**.
   - Total hutang (Debt) pada profil toko tersebut bertambah.

---

## 3. Riwayat Pesanan & Audit Log (Order History) 📜
**Alur Kerja:**
1. **Akses Riwayat**: Pengguna membuka menu Riwayat Pesanan.
2. **Penyaringan (Filtering)**: Pengguna menggunakan filter Tanggal, Bulan, Brand, atau Toko (atau filter Cabang khusus Super Admin) untuk menemukan pesanan spesifik.
3. **Detail Transaksi**: Pengguna meng-klik (expand) salah satu baris pesanan untuk melihat rincian barang belanjaan, jumlah, harga satuan saat transaksi terjadi, dan subtotal.
4. **Audit & Ekspor**: Pengguna menekan tombol Ekspor CSV untuk mengunduh daftar laporan pesanan yang telah difilter.

---

## 4. Manajemen Stok Gudang (Warehouse Inventory) 📦
**Alur Kerja:**
1. **Pemantauan Stok**: Admin membuka halaman Stok Gudang. Sistem menampilkan daftar produk lengkap dengan indikator warna status stok (Habis/Merah, Menipis/Oranye, Aman/Hijau).
2. **Restock Barang**:
   - Admin menekan tombol "Restock" pada salah satu produk.
   - Menampilkan modal input jumlah stok yang baru masuk.
   - Admin memasukkan nilai dan menyimpan.
3. **Kalkulasi Matematis**: Sistem menghitung secara otomatis: menambah kuantitas di variabel `totalIn` sehingga `Stok Tersedia = totalIn - totalOut`.
4. **Update UI**: Jumlah stok diperbarui di layar, indikator warna disesuaikan jika melewati batas minimum.

---

## 5. Pengelolaan Piutang Toko (Accounts Receivable) 💸
**Alur Kerja:**
1. **Pemantauan Tagihan**: Admin Cabang masuk ke menu Piutang.
2. **Deteksi Jatuh Tempo**: Sistem membaca daftar tagihan dan otomatis memberikan highlight warna peringatan/badge pada tagihan yang umurnya lebih dari 30 hari dari tanggal pesanan.
3. **Pelunasan (Settlement)**:
   - Admin menerima pembayaran fisik/transfer dari toko.
   - Admin menekan tombol **"Tandai Lunas"** pada tagihan terkait.
   - Mengkonfirmasi aksi pelunasan.
4. **Sinkronisasi Buku**: Sistem mengubah status piutang menjadi "Lunas" dan secara instan mengurangi jumlah utang (`totalDebt`) pada profil toko pelanggan tersebut.

---

## 6. Buku Toko Pelanggan (Store Ledger) 🏪
**Alur Kerja:**
1. **Manajemen Data Toko**: Admin menambah toko pelanggan baru atau mengubah rincian toko yang ada di area kerjanya.
2. **Profil Toko**: Admin meng-klik salah satu nama toko pada daftar sidebar.
3. **Dashboard Toko**: Sistem menampilkan profil detail, status hutang aktif toko (akumulasi piutang belum lunas), dan menampilkan tabel seluruh riwayat belanja historis spesifik milik toko tersebut.

---

## 7. Buku Produk & Dynamic Pricing Engine v2 (Product Ledger) 🏷️
**Alur Kerja Utama (Hanya Super Admin):**
1. **Aksi CRUD**: Super Admin menambah produk baru, menghapus, atau mengubah nama/harga dasar produk.
2. **Sinkronisasi Global**: Sistem otomatis menyalin/mengkloning perubahan tersebut ke basis data **seluruh cabang** secara real-time. Jika produk baru, di-set dengan stok awal `0`.

**Alur Kerja Dynamic Pricing Engine:**
- **Jadwal Masa Depan (Scheduled)**: 
  1. Super Admin mengatur perubahan harga untuk tanggal di masa depan.
  2. Sistem menyimpan *rule* harga tersebut.
  3. Ketika sistem diakses pada hari H (atau setelahnya), sistem mendeteksi jadwal telah tercapai dan otomatis mengaktifkan harga baru untuk transaksi ke depannya.
- **Koreksi Surut (Retroactive / Backdate)**:
  1. Super Admin mengatur perubahan harga pada tanggal *di masa lalu*.
  2. Sistem segera mendeteksi bahwa ini adalah koreksi surut.
  3. Mesin (Engine) memindai semua transaksi pesanan mulai dari tanggal berlaku hingga hari ini.
  4. Mesin menghitung ulang subtotal faktur dan menyesuaikan nominal Piutang terkait. *(Catatan: Tagihan yang sudah "Lunas" tidak akan diubah).*

---

## 8. Manajemen Akun Cabang (Super Admin Console) 👥
**Alur Kerja:**
1. **Akses Konsol**: Super Admin masuk ke menu Manajemen Cabang.
2. **Registrasi Cabang**: Super Admin mengisi form pendaftaran cabang baru (Nama Cabang, Username, Password).
3. **Auto-Bootstrapping**: Saat tombol Simpan ditekan:
   - Sistem mendaftarkan kredensial baru.
   - Sistem secara otomatis membuatkan database awal untuk cabang tersebut (memuat mock data/produk dasar dengan stok `0` dan setup toko default).
4. **Go-Live**: Admin Cabang baru tersebut dapat langsung login dan menggunakan aplikasi (transaksi kasir, restock, dll) dengan aman di lingkup (scope) datanya sendiri tanpa mengganggu cabang lain.
