# Requirements: Kontrak Integrasi API (FE & BE Handshake)

## Pendahuluan

Dokumen ini mendefinisikan semua kebutuhan API yang diperlukan oleh Frontend (FE) aplikasi **Wholesale Distributor Dashboard** milik PT Anugerah Indotirta Raharja. Tujuannya adalah menjadi kontrak yang jelas antara tim FE dan tim Backend (BE) sebelum implementasi dimulai, sehingga tidak ada bongkar pasang kode akibat ketidakcocokan data.

Saat ini seluruh data dikelola via `localStorage` melalui `mockData.ts`. Migrasi ke backend nyata membutuhkan kontrak API yang presisi — nama key JSON di response harus **persis sama** dengan yang digunakan FE.

---

## Glosarium

| Istilah | Definisi |
|---|---|
| **Cabang** | Unit bisnis regional (contoh: Palembang, Baturaja, Jambi) |
| **Pusat / Super Admin** | Admin dengan akses lintas semua cabang (`branch === 'Pusat'`) |
| **Admin Cabang** | Admin dengan akses terbatas ke satu cabang saja |
| **Faktur / Invoice** | Nomor unik yang diinput manual saat checkout pesanan |
| **Piutang** | Tagihan yang belum dibayar oleh toko ke distributor |
| **Restock** | Penambahan stok masuk ke gudang |
| **Scheduled Price** | Perubahan harga produk yang dijadwalkan berlaku di tanggal tertentu |
| **KPI** | Key Performance Indicator — metrik ringkasan di dashboard |

---

## Requirement 1: Autentikasi & Manajemen Sesi

**User Story:** Sebagai admin (cabang maupun pusat), saya ingin bisa login dengan username dan password, sehingga saya mendapatkan akses ke dashboard sesuai peran dan cabang saya.

### Acceptance Criteria

1. WHEN admin mengirim `POST /auth/login` dengan `{ "username": string, "password": string }`, THEN sistem SHALL mengembalikan `{ "token": string, "user": { "username": string, "role": "admin", "branch": string } }` dengan HTTP 200 jika kredensial valid. Token SHALL memiliki masa berlaku 8 jam sejak diterbitkan.
2. WHEN kredensial tidak valid, THEN sistem SHALL mengembalikan HTTP 401 dengan `{ "message": "Username atau password salah" }`.
3. WHEN token dikirim pada header `Authorization: Bearer <token>`, THEN sistem SHALL memvalidasi token dan mengidentifikasi cabang pengguna dari payload token. IF token tidak valid atau sudah kedaluwarsa, THEN sistem SHALL mengembalikan HTTP 401 dengan `{ "message": "Token tidak valid atau sudah kedaluwarsa" }`.
4. WHEN admin logout via `POST /auth/logout`, THEN sistem SHALL menginvalidasi token sesi tersebut. IF token yang sama digunakan setelah logout, THEN sistem SHALL mengembalikan HTTP 401.
5. IF `branch === 'Pusat'`, THEN sistem SHALL mengizinkan akses ke data semua cabang (mode Super Admin).
6. IF `branch !== 'Pusat'`, THEN sistem SHALL membatasi akses hanya ke data cabang yang bersangkutan.

### Correctness Properties

- **P1.1**: Setiap token yang dikeluarkan harus unik dan tidak dapat dipalsukan.
- **P1.2**: Admin cabang tidak boleh pernah menerima data dari cabang lain dalam response API manapun.
- **P1.3**: Token yang sudah diinvalidasi (logout) tidak boleh pernah diterima kembali oleh sistem.

---

## Requirement 2: Manajemen Akun Cabang

**User Story:** Sebagai Super Admin (Pusat), saya ingin bisa melihat, menambah, dan menghapus akun admin cabang, sehingga saya dapat mengontrol siapa yang memiliki akses ke sistem.

### Acceptance Criteria

1. WHEN Super Admin mengirim `GET /accounts`, THEN sistem SHALL mengembalikan array `User[]` dengan field `{ "username": string, "role": "admin", "branch": string }` — **tanpa field `password`** dalam response.
2. WHEN Super Admin mengirim `POST /accounts` dengan `{ "username": string, "password": string, "role": "admin", "branch": string }`, THEN sistem SHALL membuat akun baru dan mengembalikan HTTP 201 dengan objek user yang dibuat (tanpa password).
3. IF username sudah digunakan, THEN sistem SHALL mengembalikan HTTP 409 dengan `{ "message": "Username sudah digunakan" }`.
4. WHEN Super Admin mengirim `DELETE /accounts/:username`, THEN sistem SHALL menghapus akun tersebut dan mengembalikan HTTP 200.
5. IF username yang dihapus adalah `superadmin`, THEN sistem SHALL mengembalikan HTTP 403 dengan `{ "message": "Tidak dapat menghapus superadmin" }`.
6. WHEN akun baru dibuat untuk cabang baru, THEN sistem SHALL secara otomatis menginisialisasi data produk (dengan stok 0, menyalin katalog dari cabang lain) dan data toko awal untuk cabang tersebut.

### Correctness Properties

- **P2.1**: Password tidak boleh pernah dikembalikan dalam response API apapun.
- **P2.2**: Hanya Super Admin yang boleh mengakses endpoint `/accounts`.

---

## Requirement 3: Manajemen Produk & Kategori

**User Story:** Sebagai admin, saya ingin bisa melihat, menambah, mengedit, dan menghapus produk beserta kategorinya, sehingga katalog produk selalu akurat.

### Acceptance Criteria

1. WHEN admin mengirim `GET /products?branch=:branch`, THEN sistem SHALL mengembalikan array produk dengan field `{ "id": string, "name": string, "category": string, "price": number, "stock": number, "totalIn": number, "totalOut": number }`.
2. IF pengguna adalah Super Admin dan menyertakan `?branch=all`, THEN sistem SHALL mengembalikan semua produk dari semua cabang, masing-masing dengan tambahan field `"branch": string`.
3. WHEN admin mengirim `POST /products` dengan `{ "id": string, "name": string, "category": string, "price": number }`, THEN sistem SHALL menambahkan produk ke **semua cabang** dengan `stock: 0, totalIn: 0, totalOut: 0` untuk cabang lain, dan nilai yang dikirim untuk cabang pengirim.
4. WHEN Super Admin mengirim `PUT /products/:id` dengan `{ "name": string, "price": number, "category": string }`, THEN sistem SHALL memperbarui nama, harga, dan kategori di **semua cabang** (stok masing-masing cabang tidak berubah).
5. WHEN Super Admin mengirim `DELETE /products/:id`, THEN sistem SHALL menghapus produk dari semua cabang.
6. IF `id` produk sudah ada, THEN `POST /products` SHALL mengembalikan HTTP 409.
7. WHEN admin mengirim `GET /categories`, THEN sistem SHALL mengembalikan `{ "categories": string[] }`.
8. WHEN Super Admin mengirim `POST /categories` dengan `{ "name": string }`, THEN sistem SHALL menambahkan kategori baru.
9. WHEN Super Admin mengirim `DELETE /categories/:name`, THEN sistem SHALL menghapus kategori (produk yang sudah ada tidak terhapus).

### Correctness Properties

- **P3.1**: `stock` harus selalu sama dengan `totalIn - totalOut`. Jika tidak konsisten, sistem harus mengoreksi otomatis.
- **P3.2**: Perubahan nama/harga produk oleh Super Admin harus tersinkronisasi ke semua cabang secara atomik.

---

## Requirement 4: Manajemen Stok (Restock)

**User Story:** Sebagai admin, saya ingin bisa menambah stok masuk (restock) untuk produk tertentu di cabang saya, sehingga inventaris gudang selalu up-to-date.

### Acceptance Criteria

1. WHEN admin mengirim `GET /stock?branch=:branch`, THEN sistem SHALL mengembalikan daftar produk dengan field stok: `{ "id": string, "name": string, "category": string, "totalIn": number, "totalOut": number, "stock": number, "branch": string }`.
2. WHEN admin mengirim `POST /stock/restock` dengan `{ "productId": string, "branch": string, "amount": number }`, THEN sistem SHALL menambahkan `amount` ke `totalIn` produk tersebut di cabang yang ditentukan, dan memperbarui `stock = totalIn - totalOut`.
3. IF `amount` bukan bilangan bulat positif, THEN sistem SHALL mengembalikan HTTP 400 dengan `{ "message": "Jumlah restock tidak valid" }`.
4. WHEN admin mengirim `GET /stock/export?branch=:branch`, THEN sistem SHALL mengembalikan data CSV dengan kolom: `ID Produk, Nama Produk, Kategori, Total Masuk, Total Keluar, Stok Saat Ini` (ditambah kolom `Cabang` jika Super Admin).

### Correctness Properties

- **P4.1**: Setelah restock, nilai `stock` harus selalu `= totalIn - totalOut` dan tidak boleh negatif.

---

## Requirement 5: Penjadwalan Harga (Scheduled Price)

**User Story:** Sebagai Super Admin, saya ingin bisa menjadwalkan perubahan harga produk yang berlaku di tanggal tertentu, sehingga harga dapat diubah secara terkontrol dan retroaktif.

### Acceptance Criteria

1. WHEN Super Admin mengirim `GET /scheduled-prices?branch=:branch`, THEN sistem SHALL mengembalikan array `{ "id": string, "productId": string, "productName": string, "newPrice": number, "startDate": string (YYYY-MM-DD) }`. IF tidak ada jadwal, THEN sistem SHALL mengembalikan array kosong `[]`.
2. WHEN Super Admin mengirim `POST /scheduled-prices` dengan `{ "productId": string, "newPrice": number, "startDate": string (YYYY-MM-DD) }`, THEN sistem SHALL menyimpan jadwal dan mengembalikan HTTP 201 dengan objek yang dibuat beserta field `"warning": boolean` yang bernilai `true` jika `startDate < tanggal hari ini` (menandakan data historis akan dikoreksi).
3. WHEN Super Admin mengirim `DELETE /scheduled-prices/:id`, THEN sistem SHALL menghapus jadwal tersebut. IF `id` tidak ditemukan, THEN sistem SHALL mengembalikan HTTP 404 dengan `{ "message": "Jadwal tidak ditemukan" }`.
4. WHEN scheduled job berjalan dan menemukan jadwal dengan `startDate <= tanggal hari ini`, THEN sistem SHALL secara atomik: (a) memperbarui harga produk di semua cabang, (b) memperbarui harga item di semua pesanan yang `createdAt >= startDate` dan `isPaid === false`, (c) memperbarui `amount` piutang yang terkait dengan pesanan tersebut, dan (d) menghapus jadwal yang sudah diproses — hanya jika langkah (a)–(c) berhasil semua.
5. IF `newPrice <= 0` atau format `startDate` bukan `YYYY-MM-DD`, THEN sistem SHALL mengembalikan HTTP 400 dengan `{ "message": "Input tidak valid" }`.
6. IF sudah ada jadwal dengan `productId` dan `startDate` yang sama, THEN sistem SHALL mengembalikan HTTP 409 dengan `{ "message": "Jadwal untuk produk dan tanggal ini sudah ada" }`.

### Correctness Properties

- **P5.1**: Pesanan yang sudah lunas (`isPaid === true`) tidak boleh pernah diubah harganya oleh scheduled price.
- **P5.2**: Setelah scheduled price diproses, tidak boleh ada jadwal dengan `startDate <= hari ini` yang tersisa.
- **P5.3**: Pemrosesan scheduled price harus atomik — jika salah satu langkah gagal, tidak ada perubahan yang tersimpan.

---

## Requirement 6: Manajemen Toko

**User Story:** Sebagai admin, saya ingin bisa melihat, menambah, mengedit, dan menghapus data toko pelanggan, sehingga daftar toko selalu akurat.

### Acceptance Criteria

1. WHEN admin mengirim `GET /stores?branch=:branch`, THEN sistem SHALL mengembalikan array `{ "id": string, "name": string, "branch": string, "totalDebt": number }`.
2. IF Super Admin dan `?branch=all`, THEN sistem SHALL mengembalikan toko dari semua cabang.
3. WHEN admin mengirim `POST /stores` dengan `{ "name": string, "branch": string }`, THEN sistem SHALL membuat toko baru dengan `id` yang di-generate server (format: `STR-{BRANCH_CODE}-{TIMESTAMP}`) dan `totalDebt: 0`, mengembalikan HTTP 201.
4. WHEN admin mengirim `PUT /stores/:id` dengan `{ "name": string }`, THEN sistem SHALL memperbarui nama toko.
5. WHEN admin mengirim `DELETE /stores/:id`, THEN sistem SHALL menghapus toko dari cabang yang bersangkutan.
6. WHEN piutang toko dilunasi, THEN sistem SHALL secara otomatis mengurangi `totalDebt` toko tersebut sebesar jumlah piutang yang dilunasi.

### Correctness Properties

- **P6.1**: `totalDebt` toko harus selalu sama dengan jumlah `amount` dari semua piutang yang `isPaid === false` milik toko tersebut.

---

## Requirement 7: Manajemen Pesanan

**User Story:** Sebagai admin, saya ingin bisa membuat pesanan baru untuk toko tertentu dan melihat riwayat semua pesanan, sehingga transaksi penjualan tercatat dengan benar.

### Acceptance Criteria

1. WHEN admin mengirim `POST /orders` dengan body berikut, THEN sistem SHALL secara atomik membuat pesanan, mengurangi stok produk, membuat piutang baru, dan menambah `totalDebt` toko, lalu mengembalikan HTTP 201 dengan objek pesanan yang dibuat:
   ```json
   {
     "id": "string (nomor faktur, unik, diinput manual)",
     "storeId": "string",
     "storeName": "string",
     "branch": "string",
     "items": [
       {
         "productId": "string",
         "productName": "string",
         "quantity": "number",
         "price": "number"
       }
     ],
     "total": "number",
     "createdAt": "string (ISO 8601)"
   }
   ```
2. IF `id` (nomor faktur) sudah digunakan, THEN sistem SHALL mengembalikan HTTP 409 dengan `{ "message": "Nomor faktur sudah digunakan" }`.
3. IF stok produk manapun dalam pesanan tidak mencukupi (`stock < quantity`), THEN sistem SHALL mengembalikan HTTP 422 dengan `{ "message": "Stok tidak mencukupi", "productId": string }` dan tidak membuat pesanan.
4. IF `items` kosong atau `total` tidak sama dengan `sum(item.quantity * item.price)`, THEN sistem SHALL mengembalikan HTTP 400 dengan `{ "message": "Data pesanan tidak valid" }`.
5. WHEN admin mengirim `GET /orders?branch=:branch&date=:YYYY-MM-DD`, THEN sistem SHALL mengembalikan array pesanan yang difilter berdasarkan cabang dan tanggal (timezone lokal server).
6. WHEN admin mengirim `GET /orders?branch=:branch&month=:YYYY-MM`, THEN sistem SHALL mengembalikan array pesanan yang difilter berdasarkan cabang dan bulan.
7. IF Super Admin dan `?branch=all`, THEN sistem SHALL mengembalikan pesanan dari semua cabang, masing-masing dengan field `"branch": string`.
8. WHEN admin mengirim `GET /orders/daily-report?branch=:branch&date=:YYYY-MM-DD&storeId=:storeId`, THEN sistem SHALL mengembalikan array baris laporan: `[{ "orderId": string, "storeName": string, "branch": string, "productName": string, "quantity": number, "price": number, "total": number }]`. IF `storeId` tidak disertakan atau `storeId=all`, THEN sistem SHALL mengembalikan semua toko.
9. WHEN pesanan dibuat, THEN sistem SHALL secara otomatis membuat piutang dengan `dueDate = createdAt + 30 hari` dan `isPaid: false`.

### Correctness Properties

- **P7.1**: Setelah pesanan dibuat, `stock` setiap produk dalam pesanan harus berkurang sebesar `quantity` yang dipesan.
- **P7.2**: `total` pesanan harus selalu sama dengan `sum(item.quantity * item.price)` untuk semua item.
- **P7.3**: Setiap pesanan yang dibuat harus memiliki tepat satu piutang yang terkait.
- **P7.4**: Pembuatan pesanan harus atomik — jika salah satu langkah (kurangi stok, buat piutang, tambah debt) gagal, tidak ada perubahan yang tersimpan.

---

## Requirement 8: Manajemen Piutang

**User Story:** Sebagai admin, saya ingin bisa melihat semua piutang yang belum lunas dan menandai piutang sebagai lunas, sehingga arus kas dapat dipantau dengan akurat.

### Acceptance Criteria

1. WHEN admin mengirim `GET /receivables?branch=:branch`, THEN sistem SHALL mengembalikan array `{ "id": string, "storeId": string, "storeName": string, "orderId": string, "amount": number, "dueDate": string (ISO 8601), "isPaid": boolean }`.
2. IF Super Admin dan `?branch=all`, THEN sistem SHALL mengembalikan piutang dari semua cabang, masing-masing dengan field `"branch": string`.
3. WHEN admin mengirim `PATCH /receivables/:id` dengan `{ "isPaid": true }`, THEN sistem SHALL:
   a. Memperbarui `isPaid` menjadi `true`.
   b. Mengurangi `totalDebt` toko terkait sebesar `amount` piutang tersebut.
4. WHEN admin mengirim `GET /receivables/summary?branch=:branch`, THEN sistem SHALL mengembalikan `{ "totalUnpaid": number, "overdueCount": number, "storeCount": number }`.
5. IF `dueDate < tanggal hari ini` dan `isPaid === false`, THEN piutang tersebut dianggap **jatuh tempo (overdue)**.

### Correctness Properties

- **P8.1**: Setelah piutang ditandai lunas, `totalDebt` toko harus berkurang tepat sebesar `amount` piutang tersebut, tidak lebih dan tidak kurang.
- **P8.2**: Piutang yang sudah `isPaid === true` tidak boleh bisa diubah kembali menjadi `isPaid === false`.

---

## Requirement 9: Dashboard & Analytics

**User Story:** Sebagai admin, saya ingin melihat KPI ringkasan (penjualan hari ini, penjualan bulan ini, total piutang, stok menipis) dan grafik tren penjualan mingguan, sehingga saya dapat memantau performa bisnis secara cepat.

### Acceptance Criteria

1. WHEN admin mengirim `GET /dashboard/kpi?branch=:branch`, THEN sistem SHALL mengembalikan:
   ```json
   {
     "dailySales": "number",
     "monthlySales": "number",
     "totalReceivables": "number",
     "lowStockCount": "number"
   }
   ```
2. WHEN admin mengirim `GET /dashboard/weekly-sales?branch=:branch`, THEN sistem SHALL mengembalikan array 7 hari terakhir: `[{ "name": string (nama hari, contoh: "Sen"), "sales": number }]`.
3. IF Super Admin, THEN `GET /dashboard/branch-contribution` SHALL mengembalikan `[{ "name": string (nama cabang), "value": number (total penjualan) }]`.
4. WHEN admin mengirim `GET /dashboard/low-stock?branch=:branch`, THEN sistem SHALL mengembalikan produk dengan `stock < 50`: `[{ "id": string, "name": string, "category": string, "stock": number, "branch": string }]`.
5. WHEN admin mengirim `GET /dashboard/recent-orders?branch=:branch`, THEN sistem SHALL mengembalikan 5 pesanan terbaru: `[{ "id": string, "storeName": string, "total": number, "branch": string }]`.
6. IF Super Admin dan `?branch=:specificBranch`, THEN semua endpoint dashboard SHALL memfilter data hanya untuk cabang tersebut.

### Correctness Properties

- **P9.1**: `dailySales` harus sama dengan jumlah `total` semua pesanan yang `createdAt` berada di tanggal hari ini (timezone lokal server).
- **P9.2**: `lowStockCount` harus sama dengan jumlah produk yang `stock < 50`.

---

## Requirement 10: Manajemen Cabang

**User Story:** Sebagai Super Admin, saya ingin mendapatkan daftar semua cabang yang terdaftar, sehingga saya dapat memfilter data berdasarkan cabang di seluruh halaman.

### Acceptance Criteria

1. WHEN Super Admin mengirim `GET /branches`, THEN sistem SHALL mengembalikan `{ "branches": string[] }` — daftar nama cabang selain `'Pusat'`.
2. Daftar cabang harus diurutkan secara alfabetis.
3. Cabang baru otomatis muncul di daftar ini ketika akun admin cabang baru dibuat (lihat Requirement 2).

---

## ERD (Entity Relationship Diagram)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Branch    │       │  Category   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ username PK │       │ name PK     │       │ name PK     │
│ password    │       └──────┬──────┘       └─────────────┘
│ role        │              │ 1                    │ 1
│ branch FK──►│──────────────┘              ┌───────┴──────┐
└─────────────┘                             │              │
                                            ▼ N            │
                                     ┌─────────────┐       │
                                     │   Product   │       │
                                     ├─────────────┤       │
                                     │ id PK       │◄──────┘
                                     │ name        │
                                     │ category FK │
                                     │ price       │
                                     │ stock       │
                                     │ totalIn     │
                                     │ totalOut    │
                                     │ branch FK   │
                                     └──────┬──────┘
                                            │ 1
                              ┌─────────────┴──────────────┐
                              │                            │
                              ▼ N                          ▼ N
                       ┌─────────────┐            ┌──────────────────┐
                       │ OrderItem   │            │  ScheduledPrice  │
                       ├─────────────┤            ├──────────────────┤
                       │ productId FK│            │ id PK            │
                       │ productName │            │ productId FK     │
                       │ quantity    │            │ productName      │
                       │ price       │            │ newPrice         │
                       │ orderId FK  │            │ startDate        │
                       └──────┬──────┘            │ branch FK        │
                              │ N                 └──────────────────┘
                              │
                       ┌──────┴──────┐
                       │    Order    │
                       ├─────────────┤
                       │ id PK       │◄──────────────────────┐
                       │ storeId FK  │                       │
                       │ storeName   │                       │
                       │ branch FK   │                       │
                       │ total       │                       │
                       │ createdAt   │                       │
                       └──────┬──────┘                       │
                              │ 1                            │
                              ▼ 1                            │
                       ┌─────────────┐                       │
                       │ Receivable  │                       │
                       ├─────────────┤                       │
                       │ id PK       │                       │
                       │ storeId FK  │                       │
                       │ storeName   │                       │
                       │ orderId FK──┼───────────────────────┘
                       │ amount      │
                       │ dueDate     │
                       │ isPaid      │
                       │ branch FK   │
                       └──────┬──────┘
                              │ N
                              │
                       ┌──────┴──────┐
                       │    Store    │
                       ├─────────────┤
                       │ id PK       │
                       │ name        │
                       │ branch FK   │
                       │ totalDebt   │
                       └─────────────┘
```

**Relasi Utama:**
- `User` → `Branch`: Many-to-One (banyak user bisa di satu cabang)
- `Product` → `Branch`: Many-to-One (setiap produk milik satu cabang, tapi produk yang sama ada di semua cabang)
- `Product` → `Category`: Many-to-One
- `Order` → `Store`: Many-to-One
- `Order` → `Branch`: Many-to-One
- `Order` → `OrderItem`: One-to-Many
- `OrderItem` → `Product`: Many-to-One
- `Order` → `Receivable`: One-to-One (setiap pesanan punya tepat satu piutang)
- `Receivable` → `Store`: Many-to-One
- `ScheduledPrice` → `Product`: Many-to-One

---

## Ringkasan Daftar API yang Dibutuhkan FE

| # | Method | Endpoint | Deskripsi | Halaman FE |
|---|--------|----------|-----------|------------|
| 1 | POST | `/auth/login` | Login admin | Login |
| 2 | POST | `/auth/logout` | Logout | Semua |
| 3 | GET | `/branches` | Daftar cabang | Semua (filter) |
| 4 | GET | `/accounts` | Daftar akun | Kelola Akun |
| 5 | POST | `/accounts` | Tambah akun | Kelola Akun |
| 6 | DELETE | `/accounts/:username` | Hapus akun | Kelola Akun |
| 7 | GET | `/products?branch=` | Daftar produk | Buku Produk, Order |
| 8 | POST | `/products` | Tambah produk | Buku Produk |
| 9 | PUT | `/products/:id` | Edit produk | Buku Produk |
| 10 | DELETE | `/products/:id` | Hapus produk | Buku Produk |
| 11 | GET | `/categories` | Daftar kategori | Buku Produk, Order |
| 12 | POST | `/categories` | Tambah kategori | Buku Produk |
| 13 | DELETE | `/categories/:name` | Hapus kategori | Buku Produk |
| 14 | GET | `/scheduled-prices?branch=` | Daftar jadwal harga | Buku Produk |
| 15 | POST | `/scheduled-prices` | Tambah jadwal harga | Buku Produk |
| 16 | DELETE | `/scheduled-prices/:id` | Hapus jadwal harga | Buku Produk |
| 17 | GET | `/stock?branch=` | Data stok | Kelola Stok |
| 18 | POST | `/stock/restock` | Tambah stok | Kelola Stok |
| 19 | GET | `/stock/export?branch=` | Export CSV stok | Kelola Stok |
| 20 | GET | `/stores?branch=` | Daftar toko | Buku Toko, Order |
| 21 | POST | `/stores` | Tambah toko | Buku Toko |
| 22 | PUT | `/stores/:id` | Edit toko | Buku Toko |
| 23 | DELETE | `/stores/:id` | Hapus toko | Buku Toko |
| 24 | POST | `/orders` | Buat pesanan | Pesan Produk |
| 25 | GET | `/orders?branch=&date=` | Riwayat pesanan (harian) | Riwayat Pesanan |
| 26 | GET | `/orders?branch=&month=` | Riwayat pesanan (bulanan) | Riwayat Pesanan |
| 27 | GET | `/orders/daily-report` | Laporan harian | Dashboard |
| 28 | GET | `/receivables?branch=` | Daftar piutang | Piutang |
| 29 | PATCH | `/receivables/:id` | Tandai lunas | Piutang |
| 30 | GET | `/receivables/summary?branch=` | Ringkasan piutang | Piutang |
| 31 | GET | `/dashboard/kpi?branch=` | KPI cards | Dashboard |
| 32 | GET | `/dashboard/weekly-sales?branch=` | Grafik mingguan | Dashboard |
| 33 | GET | `/dashboard/branch-contribution` | Kontribusi cabang | Dashboard (Pusat) |
| 34 | GET | `/dashboard/low-stock?branch=` | Produk stok menipis | Dashboard |
| 35 | GET | `/dashboard/recent-orders?branch=` | Pesanan terbaru | Dashboard |
