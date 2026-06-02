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

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function HelpCenter() {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  useEffect(() => {
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

  const pdfOptions = useMemo(() => ({ disableRange: true }), []);

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
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="flex items-center gap-4 mb-4 bg-gray-50 px-4 py-2 rounded-lg w-full justify-between">
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
            options={pdfOptions}
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
            renderTextLayer={true}
            renderAnnotationLayer={true}
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
