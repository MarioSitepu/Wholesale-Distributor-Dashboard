import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, UserPlus, Trash2, Key, MapPin, Search } from "lucide-react";
import { toast, Toaster } from "sonner";
import { api } from "../../utils/apiClient";
import { accountSchema, AccountFormValues } from "../../schemas/accountSchema";
import { InputError } from "../../components/ui/ErrorMessage";
import { useAuthStore } from "../../../store/useAuthStore";
import { useNavigate } from "../../router-compat";

export type User = {
  username: string;
  role: string;
  branch: string;
};

export default function AccountManagement() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user && user.role !== "superadmin") {
      toast.error("Anda tidak memiliki izin mengakses halaman ini.");
      navigate("/admin");
    }
  }, [user, navigate]);

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");
  const [updatePassword, setUpdatePassword] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
      role: "admin",
      branch: "",
    },
  });
  const selectedRole = watch("role");
  const selectedBranch = watch("branch");

  useEffect(() => {
    if (selectedRole === "superadmin") {
      if (selectedBranch !== "Pusat") {
        setValue("branch", "Pusat", { shouldValidate: true });
      }
      return;
    }

    if (selectedRole === "admin" && selectedBranch === "Pusat") {
      setValue("branch", "", { shouldValidate: true });
    }
  }, [selectedBranch, selectedRole, setValue]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<User[]>("/api/accounts");
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat akun");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "superadmin") {
      loadUsers();
    }
  }, [user]);

  if (!user || user.role !== "superadmin") return null;

  const handleAdd = async (data: AccountFormValues) => {
    try {
      await api.post("/api/accounts", {
        username: data.username,
        password: data.password,
        role: data.role,
        branch: data.branch || "Pusat",
      });
      toast.success("Akun baru berhasil ditambahkan");
      setIsAdding(false);
      reset();
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan akun");
    }
  };

  const handleDelete = async (username: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${username}?`)) {
      try {
        await api.delete(`/api/accounts/${username}`);
        toast.success("Akun berhasil dihapus");
        loadUsers();
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus akun");
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatePassword) {
      toast.error("Password baru harus diisi");
      return;
    }

    try {
      await api.patch(`/api/accounts/${targetUsername}`, {
        password: updatePassword,
      });
      toast.success(`Password untuk ${targetUsername} berhasil diubah`);
      setIsChangingPassword(false);
      setTargetUsername("");
      setUpdatePassword("");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.branch.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Kelola Akun Cabang
          </h1>
          <p className="text-gray-600 mt-1">
            Manajemen kredensial dan akses admin tiap cabang
          </p>
        </div>
        <button
          onClick={() => {
            reset({
              username: "",
              password: "",
              role: "admin",
              branch: "",
            });
            setIsAdding(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          <UserPlus className="w-5 h-5" />
          Tambah Akun Baru
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan username atau nama cabang..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all text-lg"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.username}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Shield className="w-6 h-6" />
                </div>
                {user.username !== "superadmin" && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => {
                        setTargetUsername(user.username);
                        setIsChangingPassword(true);
                      }}
                      title="Ganti Password"
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                    >
                      <Key className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.username)}
                      title="Hapus Akun"
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Nama Cabang
                  </p>
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    {user.branch}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Username
                    </p>
                    <p className="text-sm font-mono text-gray-700">
                      {user.username}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                      Role
                    </p>
                    <p className="text-sm font-semibold text-gray-700 capitalize">
                      {user.role || "Admin"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tambah Akun Cabang
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                Buat kredensial login baru untuk admin cabang baru.
              </p>

              <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                    Role
                  </label>
                  <select
                    {...register("role")}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                  <InputError message={errors.role?.message} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                    Nama Cabang
                  </label>
                  {selectedRole === "superadmin" ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      Cabang dikunci ke Pusat untuk role Superadmin.
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Contoh: Lampung"
                        {...register("branch")}
                        className={`w-full bg-gray-50 border rounded-xl py-3 px-4 outline-none transition-all ${
                          errors.branch
                            ? "border-red-500 focus:ring-2 focus:ring-red-500"
                            : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                        }`}
                      />
                      <InputError message={errors.branch?.message} />
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: adminlampung"
                    {...register("username")}
                    className={`w-full bg-gray-50 border rounded-xl py-3 px-4 outline-none transition-all ${
                      errors.username
                        ? "border-red-500 focus:ring-2 focus:ring-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                    }`}
                  />
                  <InputError message={errors.username?.message} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                    Password
                  </label>
                  <input
                    type="text"
                    placeholder="Password login (min 8 karakter)"
                    {...register("password")}
                    className={`w-full bg-gray-50 border rounded-xl py-3 px-4 outline-none transition-all ${
                      errors.password
                        ? "border-red-500 focus:ring-2 focus:ring-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                    }`}
                  />
                  <InputError message={errors.password?.message} />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      reset({
                        username: "",
                        password: "",
                        role: "admin",
                        branch: "",
                      });
                      setIsAdding(false);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Akun"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ganti Password
              </h2>
              <p className="text-gray-500 mb-6 text-sm">
                Masukkan password baru untuk akun{" "}
                <span className="font-bold">{targetUsername}</span>.
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">
                    Password Baru
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Minimal 6 karakter"
                    value={updatePassword}
                    onChange={(e) => setUpdatePassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setTargetUsername("");
                      setUpdatePassword("");
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100"
                  >
                    Ubah Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
