# Point of Sale (POS) Application

Aplikasi Point of Sale (POS) modern berbasis web yang dibangun dengan arsitektur *client-server* terpisah, menggunakan tumpukan teknologi (tech stack) JavaScript yang kuat. Aplikasi ini dirancang untuk memudahkan manajemen penjualan, inventaris produk, hingga pembuatan laporan bisnis.

## 🚀 Fitur Utama

- **Sistem Autentikasi & Otorisasi**: Manajemen pengguna dengan dukungan multi-peran (Pemilik / Karyawan).
- **Manajemen Produk & Kategori**: Operasi CRUD penuh untuk inventaris produk, dukungan gambar, dan kategorisasi.
- **Kasir & Transaksi**: Pencatatan transaksi real-time, manajemen riwayat penjualan, dan dukungan pembayaran terintegrasi (termasuk QRIS).
- **Laporan & Analitik**: Visualisasi data laporan penjualan dan stok. Ekspor data dengan mudah ke dalam format PDF dan CSV.
- **Progressive Web App (PWA)**: Akses offline dan instalasi di berbagai perangkat, didukung oleh Workbox.

## 🛠️ Tech Stack

### Frontend
- **Framework & Library**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/)
- **State Management & Data Fetching**: [Axios](https://axios-http.com/)
- **UI Components & Icons**: [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/), SweetAlert2, React Toastify
- **PWA**: Workbox

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MySQL](https://www.mysql.com/) (menggunakan `mysql2`)
- **Keamanan**: `bcrypt` untuk hashing kata sandi, `jsonwebtoken` untuk autentikasi API.
- **Upload File**: `multer` untuk mengelola unggahan gambar produk.
- **Pembuat Laporan**: `pdfkit` untuk membuat laporan PDF dan `json2csv` untuk format CSV.

## 📁 Struktur Direktori

```text
pos-app/
├── backend/          # RESTful API, logika bisnis, dan integrasi database
└── frontend/         # Antarmuka pengguna berbasis React
```

## ⚙️ Persyaratan Sistem
Pastikan perangkat Anda sudah terinstal:
- Node.js (v18 atau lebih baru direkomendasikan)
- MySQL Server

## 🏃 Cara Menjalankan Secara Lokal

### 1. Menjalankan Backend
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Konfigurasikan _environment variables_:
   - Buat file `.env` di folder `backend`.
   - Sesuaikan konfigurasi database (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME), JWT_SECRET, dan port server.
4. Jalankan server backend (mode pengembangan):
   ```bash
   npm run start
   ```

### 2. Menjalankan Frontend
1. Buka terminal baru dan masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Konfigurasikan _environment variables_:
   - Buat file `.env` di folder `frontend` jika diperlukan (misalnya `VITE_API_URL` untuk mengarahkan ke URL backend lokal).
4. Jalankan _development server_:
   ```bash
   npm run dev
   ```

Aplikasi frontend sekarang dapat diakses melalui browser Anda (secara default di `http://localhost:5173`), yang akan terhubung ke backend server lokal Anda.

## 📝 Lisensi
Proyek ini bersifat tertutup atau sesuai dengan lisensi internal tim pengembang.
