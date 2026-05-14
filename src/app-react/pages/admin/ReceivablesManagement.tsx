import { useState, useEffect } from 'react';
import { Check, AlertCircle, MapPin } from 'lucide-react';
import { getReceivables, updateReceivable, getGlobalReceivables, getBranches } from '../../utils/mockData';
import { toast, Toaster } from 'sonner';

export default function ReceivablesManagement() {
  const userStr = localStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.branch === 'Pusat';

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [receivables, setReceivables] = useState(isSuperAdmin ? getGlobalReceivables() : getReceivables());

  useEffect(() => {
    let allReceivables = isSuperAdmin ? getGlobalReceivables() : getReceivables();
    if (isSuperAdmin && selectedBranch !== 'all') {
      allReceivables = allReceivables.filter(r => (r as any).branch === selectedBranch);
    }
    setReceivables(allReceivables);
  }, [isSuperAdmin, selectedBranch]);

  const handleMarkAsPaid = (id: string) => {
    const receivable = receivables.find(r => r.id === id);
    if (!receivable) return;

    const branchToUse = (receivable as any).branch || user?.branch;
    updateReceivable(id, true, branchToUse);
    
    // Refresh data
    let allReceivables = isSuperAdmin ? getGlobalReceivables() : getReceivables();
    if (isSuperAdmin && selectedBranch !== 'all') {
      allReceivables = allReceivables.filter(r => (r as any).branch === selectedBranch);
    }
    setReceivables(allReceivables);
    
    toast.success('Piutang ditandai sebagai lunas');
  };

  const unpaidReceivables = receivables.filter(r => !r.isPaid);
  const paidReceivables = receivables.filter(r => r.isPaid);

  const totalUnpaid = unpaidReceivables.reduce((sum, r) => sum + r.amount, 0);

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
                {getBranches().map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          )}
        </div>

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
                <div key={storeId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unpaidReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada piutang belum lunas
                    </td>
                  </tr>
                ) : (
                  unpaidReceivables.map((receivable) => {
                    const overdue = isOverdue(receivable.dueDate);
                    return (
                      <tr key={receivable.id} className={overdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {receivable.storeName}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-blue-600">{(receivable as any).branch}</div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {receivable.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Rp {receivable.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
                              {new Date(receivable.dueDate).toLocaleDateString('id-ID')}
                            </span>
                            {overdue && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Jatuh Tempo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleMarkAsPaid(receivable.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receivable.storeName}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">{(receivable as any).branch}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receivable.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {receivable.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
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
      </div>
    </>
  );
}
