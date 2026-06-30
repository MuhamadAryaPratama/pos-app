# Dokumentasi Fitur Backend POS App

Berdasarkan struktur kode pada `c:\Project\pos-app\backend`, aplikasi Point of Sale (POS) ini memiliki fitur-fitur utama sebagai berikut:

## 1. Autentikasi dan Manajemen Pengguna (`/api/auth`)
Fitur ini menangani akses pengguna dan profil mereka, mendukung multi-role seperti `pemilik` (owner) dan `karyawan` (employee).
- **Register & Login**: Pendaftaran pengguna baru dan masuk ke sistem menggunakan JWT token.
- **Manajemen Kata Sandi**: Fitur lupa kata sandi (forgot password) dan reset kata sandi.
- **Manajemen Profil**: Melihat dan memperbarui profil pengguna yang sedang login.
- **Logout**: Keluar dari sistem dengan aman.

## 2. Manajemen Produk (`/api/products`)
Fitur untuk mengelola katalog barang yang dijual. Terdapat pembatasan hak akses berbasis peran (Role-Based Access Control).
- **Lihat Produk**: Semua pengguna terautentikasi (pemilik & karyawan) dapat melihat daftar produk dan detail produk.
- **Tambah, Ubah, Hapus Produk (CRUD)**: Hanya pengguna dengan peran `pemilik` yang dapat melakukan operasi modifikasi produk.
- **Unggah Gambar**: Mendukung pengunggahan gambar produk saat menambah atau mengubah produk.

## 3. Manajemen Kategori (`/api/categories`)
Fitur untuk mengelompokkan produk.
- **Lihat Kategori**: Pemilik dan karyawan dapat melihat daftar kategori dan detail kategori spesifik.
- **Produk Berdasarkan Kategori**: Mengambil daftar produk yang berada di bawah kategori tertentu.
- **Statistik Kategori**: Menampilkan ringkasan statistik untuk setiap kategori (hanya untuk `pemilik`).
- **Tambah, Ubah, Hapus Kategori**: Operasi pengelolaan kategori dibatasi hanya untuk `pemilik`.

## 4. Pemrosesan Transaksi (`/api/transactions`)
Fitur inti kasir untuk mencatat penjualan.
- **Buat Transaksi**: Pemilik dan karyawan dapat membuat catatan transaksi baru.
- **Riwayat Transaksi**: Melihat daftar semua transaksi, detail transaksi tunggal, dan transaksi hari ini.
- **Pembayaran QRIS**: Mendukung alur pembayaran QRIS khusus, termasuk melihat transaksi QRIS yang berstatus *pending*, melakukan konfirmasi (*confirm*), dan membatalkan (*cancel*) pembayaran QRIS.
- **Hapus Transaksi**: Hanya `pemilik` yang diizinkan untuk menghapus data transaksi.

## 5. Sistem Laporan (`/api/reports`)
Fitur untuk memantau kinerja bisnis melalui laporan penjualan dan stok.
- **Laporan Stok**: 
  - Melihat laporan stok barang beserta visualisasi data (berdasarkan penjualan).
  - Mengunduh laporan stok dalam format **CSV** dan **PDF** (dapat diakses oleh semua pengguna).
- **Laporan Transaksi**:
  - Melihat laporan transaksi lengkap dengan paginasi dan statistik.
  - Mengunduh laporan transaksi dalam format **CSV** dan **PDF** (fitur unduh massal ini dibatasi hanya untuk `pemilik`).
  - Mengunduh detail spesifik dari satu transaksi ke format PDF (misal: untuk struk pembayaran).
