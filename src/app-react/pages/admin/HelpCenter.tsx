import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, UserPlus, Trash2, Key, MapPin, Search, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { toast, Toaster } from "sonner";
import { api } from "../../utils/apiClient";
import { accountSchema, AccountFormValues } from "../../schemas/accountSchema";
import { InputError } from "../../components/ui/ErrorMessage";
import { useAuthStore } from "../../../store/useAuthStore";
import { Link, useNavigate } from "../../router-compat";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function HelpCenter() {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(0.8);
  const user = useAuthStore((state) => state.user);
  const isSuperadmin = user?.role === 'superadmin';

  useEffect(() => {
    // Sesuaikan zoom awal untuk layar mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setScale(0.45);
    }

    // Script pembunuh Service Worker yang nyangkut di memori browser
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let r of registrations) {
          r.unregister();
          console.log("Service Worker yang nyangkut berhasil dihapus.");
        }
      });
    }
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-1">Pusat bantuan untuk admin cabang</p>
        </div>
        <div className="flex items-center gap-2">
           <a 
             href="/guidebook.pdf" 
             download 
             className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
           >
             <Download size={18} />
             <span>Unduh PDF</span>
           </a>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-blue-500" /> Pintasan Topik Cepat
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Menu Admin
            </h3>
            <select
              onChange={(e) => setPageNumber(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
              defaultValue=""
            >
              <option value="" disabled>Pilih Topik Panduan...</option>
              {[
                { label: "Login", page: 23 },
                { label: "Dashboard", page: 24 },
                { label: "• Informasi Penjualan, Piutang & Stok", page: 25 },
                { label: "• Tren Penjualan", page: 26 },
                { label: "• Produk Terlaris", page: 27 },
                { label: "• Pesanan Terbaru", page: 28 },
                { label: "• Laporan Penjualan Harian", page: 29 },
                { label: "• Export Penjualan Harian", page: 30 },
                { label: "Pesan Produk", page: 31 },
                { label: "• Pilih Toko", page: 32 },
                { label: "• Pilih Brand & Produk", page: 33 },
                { label: "• Atur Jumlah Produk", page: 34 },
                { label: "• Keranjang Belanja", page: 35 },
                { label: "• Checkout", page: 36 },
                { label: "Riwayat Pesanan", page: 37 },
                { label: "• Filter Riwayat", page: 38 },
                { label: "• Filter Toko & Brand", page: 39 },
                { label: "• Detail Riwayat", page: 40 },
                { label: "• Export Excel", page: 41 },
                { label: "Buku Produk", page: 42 },
                { label: "• Cari Produk", page: 43 },
                { label: "• Tambah Produk", page: 44 },
                { label: "Kelola Piutang", page: 45 },
                { label: "Kelola Daftar Toko", page: 46 },
                { label: "• Pilih Toko", page: 47 },
                { label: "• Tambah Toko", page: 48 },
                { label: "• Konfirmasi Berhasil", page: 49 },
              ].map((shortcut) => (
                <option key={shortcut.page} value={shortcut.page} className={shortcut.label.startsWith('•') ? "text-gray-500" : "font-bold text-gray-900"}>
                  {shortcut.label.startsWith('•') ? `\u00A0\u00A0\u00A0\u00A0${shortcut.label}` : shortcut.label}
                </option>
              ))}
            </select>
          </div>

          {isSuperadmin && (
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <h3 className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" /> Menu Superadmin
              </h3>
              <select
                onChange={(e) => setPageNumber(Number(e.target.value))}
                className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm font-medium text-blue-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                defaultValue=""
              >
                <option value="" disabled>Pilih Topik Superadmin...</option>
                {[
                  { label: "Hak Superadmin", page: 50 },
                  { label: "Kelola Akun", page: 51 },
                  { label: "• Tambah Akun", page: 52 },
                  { label: "• Simpan Akun", page: 53 },
                  { label: "• Ubah Password", page: 54 },
                  { label: "• Hapus Akun", page: 55 },
                  { label: "Kelola Riwayat Pesanan", page: 56 },
                  { label: "• Export & Hapus Riwayat", page: 57 },
                  { label: "• Konfirmasi Penghapusan", page: 58 },
                  { label: "Kelola Produk", page: 59 },
                  { label: "• Atur Kategori", page: 60 },
                  { label: "• Tambah/Hapus Kategori", page: 61 },
                  { label: "• Tambah Produk", page: 62 },
                  { label: "• Edit Produk", page: 63 },
                  { label: "• Simpan Edit", page: 64 },
                  { label: "• Jadwal Perubahan Harga", page: 65 },
                  { label: "• Hapus Produk", page: 66 },
                  { label: "Help Center", page: 67 },
                ].map((shortcut) => (
                  <option key={shortcut.page} value={shortcut.page} className={shortcut.label.startsWith('•') ? "text-gray-500" : "font-bold text-gray-900"}>
                    {shortcut.label.startsWith('•') ? `\u00A0\u00A0\u00A0\u00A0${shortcut.label}` : shortcut.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="flex flex-wrap items-center gap-4 mb-4 bg-gray-50 px-4 py-2 rounded-lg w-full justify-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              disabled={pageNumber <= 1}
              onClick={previousPage}
              className="p-2 hover:bg-gray-200 rounded-full disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium">
              Halaman {pageNumber || (numPages ? 1 : '--')} dari {numPages || '--'}
            </span>
            <button
              disabled={pageNumber >= (numPages || -1)}
              onClick={nextPage}
              className="p-2 hover:bg-gray-200 rounded-full disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
          </div>
        </div>
        
        <div className="border border-gray-200 overflow-auto max-h-[800px] w-full flex justify-center bg-gray-100 rounded-lg p-4">
          <Document
            file="/guidebook.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-12 text-gray-500">
                Memuat dokumen...
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center p-12 text-red-500">
                <p>Gagal membaca/merender dokumen PDF.</p>
              </div>
            }
          >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg"
          />
          </Document>
        </div>
      </div>
    </div>
  );
}

/*
Pengembangan lanjutan:
1. Kolom Pencarian (Search Bar)
2. FAQ
3. Tiket Dukungan (Support Ticket): Formulir online bagi pelanggan untuk mengirimkan laporan masalah teknis atau keluhan spesifik yang akan diproses dan dilacak oleh tim.
4. Kontak Resmi (Contact Us): Nomor telepon - alamat email - jam operasional layanan
5. Portal Komunitas (Forum): Ruang diskusi antar pengguna atau dengan staf ahli di mana Anda dapat mengajukan pertanyaan dan melihat solusi dari masalah yang pernah dialami orang lain.
*/
