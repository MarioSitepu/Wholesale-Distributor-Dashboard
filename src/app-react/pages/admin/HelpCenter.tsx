import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, UserPlus, Trash2, Key, MapPin, Search } from "lucide-react";
import { toast, Toaster } from "sonner";
import { api } from "../../utils/apiClient";
import { accountSchema, AccountFormValues } from "../../schemas/accountSchema";
import { InputError } from "../../components/ui/ErrorMessage";
import { useAuthStore } from "../../../store/useAuthStore";
import { Link, useNavigate } from "../../router-compat";

export default function HelpCenter() {
  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-1">Pusat bantuan untuk admin cabang</p>
        </div>
      </div>
      <Link
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.25rem",
          backgroundColor: "#3b82f6",
          color: "#fff",
          borderRadius: "0.375rem",
          textDecoration: "none",
        }}
        href="/guidebook.pdf"
        target="_blank"
        rel="noopener noreferrer"
      >
        Guide Book
      </Link>
    </div>
  );
}
