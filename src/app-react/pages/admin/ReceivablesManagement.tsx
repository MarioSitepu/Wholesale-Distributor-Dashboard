import { useState, useEffect, useCallback } from 'react';
import { Check, AlertCircle, MapPin } from 'lucide-react';
import { getReceivables, updateReceivable, getGlobalReceivables, getBranches, Receivable } from '../../utils/mockData';
import { toast, Toaster } from 'sonner';

export default function ReceivablesManagement() {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.branch === 'Pusat';

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [branches, setBranches] = useState<string[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load branches list (Super Admin only)
  useEffect(() => {
    if (isSuperAdmin) {
      getBranches()
        .then(setBranches)
        .catch(err => toast.error('Gagal memuat cabang: ' + err.message));
    }
  }, [isSuperAdmin]);

  // Load receivables dynamically
  const loadReceivables = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = isSuperAdmin 
        ? await getGlobalReceivables()
        : await getReceivables();
      
      const filtered = isSuperAdmin && selectedBranch !== 'all'
        ? data.filter(r => (r as any).branch === selectedBranch)
        : data;
      
      setReceivables(filtered);
    } catch (err: any) {
      toast.error('Gagal memuat data piutang: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, selectedBranch]);

  useEffect(() => {
    loadReceivables();
  }, [loadReceivables]);

  const handleMarkAsPaid = async (id: string) => {
    const receivable = receivables.find(r => r.id === id);
    if (!receivable) return;

    try {
      await updateReceivable(id, true);
      toast.success('Piutang ditandai sebagai lunas');
      loadReceivables();
    } catch (err: any) {
      toast.error('Gagal memperbarui status piutang: ' + err.message);
    }
  };

  const unpaidReceivables = receivables.filter(r => !r.isPaid);
  const paidReceivables = receivables.filter(r => r.isPaid);

  const totalUnpaid = unpaidReceivables.reduce((sum, r) => sum + r.amount, 0);

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !dueDate.includes('Z'); // Simple timezone check helper
  };

  const receivablesByStore = unpaidReceivables.reduce((acc, r) => {
    if (!acc[r.storeId]) {
      acc[r.storeId] = {
        storeName: r.storeName,
        total: 0,
        count: 0,
      };
    }
    acc[r.storeId].total += r.amount;
    acc[r.storeId].count += 1;
    return acc;
  }, {} as Record<string, { storeName: string; total: number; count: number }>);

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Kelola Piutang</h1>
            <p className="text-gray-600 mt-1">Pantau dan kelola piutang toko</p>
          </div>
          
          {isSuperAdmin && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
              <MapPin className="w-5 h-5 text-blue-600" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-gray-700 cursor-pointer"
              >
                <option value="all">Semua Cabang</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Piutang Belum Lunas</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      Rp {totalUnpaid.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Piutang Jatuh Tempo</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {unpaidReceivables.filter(r => isOverdue(r.dueDate)).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toko dengan Piutang</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {Object.keys(receivablesByStore).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ringkasan per Toko</h2>
              {Object.keys(receivablesByStore).length === 0 ? (
                <p className="text-gray-500 text-center py-8">Tidak ada piutang</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(receivablesByStore).map(([storeId, data]) => (
                    <div key={storeId} className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in">
                      <h3 className="font-semibold text-gray-900 mb-2">{data.storeName}</h3>
                      <p className="text-sm text-gray-500 mb-1">{data.count} pesanan belum lunas</p>
                      <p className="text-xl font-semibold text-red-600">
                        Rp {data.total.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Piutang Belum Lunas</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Toko
                      </th>
                      {isSuperAdmin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                          Cabang
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No. Faktur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jumlah Piutang
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jatuh Tempo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right pr-12">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unpaidReceivables.length === 0 ? (
                      <tr>
                        <td colSpan={isSuperAdmin ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                          Tidak ada piutang belum lunas
                        </td>
                      </tr>
                    ) : (
                      unpaidReceivables.map((receivable) => {
                        const overdue = isOverdue(receivable.dueDate);
                        return (
                          <tr key={receivable.id} className={overdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {receivable.storeName}
                            </td>
                            {isSuperAdmin && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-blue-600">{(receivable as any).branch}</div>
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {receivable.orderId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              Rp {receivable.amount.toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <span className={overdue ? 'text-red-600 font-bold' : 'text-gray-900'}>
                                  {new Date(receivable.dueDate).toLocaleDateString('id-ID')}
                                </span>
                                {overdue && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase tracking-wide">
                                    Jatuh Tempo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right pr-6">
                              <button
                                onClick={() => handleMarkAsPaid(receivable.id)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 ml-auto shadow-md shadow-green-100 font-semibold"
                              >
                                <Check className="w-4 h-4" />
                                Tandai Lunas
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {paidReceivables.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Riwayat Piutang Lunas</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Toko
                        </th>
                        {isSuperAdmin && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                            Cabang
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID Pesanan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paidReceivables.map((receivable) => (
                        <tr key={receivable.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {receivable.storeName}
                          </td>
                          {isSuperAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-blue-600">{(receivable as any).branch}</div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {receivable.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rp {receivable.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">
                              Lunas
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
