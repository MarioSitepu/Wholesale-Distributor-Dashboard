import { useState, useEffect } from 'react';
import { Plus, Package, MapPin } from 'lucide-react';
import { getProducts, updateProduct, getGlobalProducts, getBranches, getCurrentBranch } from '../../utils/mockData';
import { toast, Toaster } from 'sonner';

export default function StockManagement() {
  const userStr = localStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.branch === 'Pusat';

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [products, setProducts] = useState(isSuperAdmin ? getGlobalProducts() : getProducts());
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState('');

  useEffect(() => {
    let allProducts = isSuperAdmin ? getGlobalProducts() : getProducts();
    if (isSuperAdmin && selectedBranch !== 'all') {
      allProducts = allProducts.filter(p => (p as any).branch === selectedBranch);
    }
    setProducts(allProducts);
  }, [isSuperAdmin, selectedBranch]);

  const handleRestock = () => {
    if (!selectedProduct || !restockAmount) return;

    const amount = parseInt(restockAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Jumlah restock tidak valid');
      return;
    }

    const product = products.find(p => {
      const pId = p.id;
      const pBranch = (p as any).branch || getCurrentBranch();
      const sProductParts = selectedProduct.split('|');
      return pId === sProductParts[1] && pBranch === sProductParts[0];
    });

    if (!product) return;

    const targetBranch = (product as any).branch || getCurrentBranch();
    
    // Create a copy to avoid state mutation issues
    const updatedProduct = {
      ...product,
      stock: Number(product.stock) + amount,
      totalIn: Number(product.totalIn) + amount
    };
    
    updateProduct(updatedProduct, targetBranch);
    
    // Refresh products based on current view
    let allProducts = isSuperAdmin ? getGlobalProducts() : getProducts();
    if (isSuperAdmin && selectedBranch !== 'all') {
      allProducts = allProducts.filter(p => (p as any).branch === selectedBranch);
    }
    setProducts(allProducts);
    setShowRestockModal(false);
    setSelectedProduct(null);
    setRestockAmount('');
    toast.success(`Berhasil restock ${product.name}`);
  };

  const openRestockModal = (productId: string) => {
    setSelectedProduct(productId);
    setShowRestockModal(true);
    setRestockAmount('');
  };

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50';
    if (stock < 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Kelola Stok</h1>
            <p className="text-gray-600 mt-1">Monitor dan tambah stok produk gudang</p>
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cabang
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok Awal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Masuk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Keluar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok Saat Ini
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const uniqueKey = `${(product as any).branch || getCurrentBranch()}|${product.id}`;
                  return (
                    <tr key={uniqueKey} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-blue-600">{(product as any).branch}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.initialStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.totalIn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.totalOut}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStockStatusColor(product.stock)}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openRestockModal(uniqueKey)}
                        className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Stok
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Produk</p>
                <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Stok Menipis</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {products.filter(p => p.stock < 50 && p.stock > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Stok Habis</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {products.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Restock Produk</h2>
            {selectedProduct && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Produk</p>
                <p className="font-medium text-gray-900">
                  {products.find(p => p.id === selectedProduct)?.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Stok saat ini: {products.find(p => p.id === selectedProduct)?.stock}
                </p>
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Restock
              </label>
              <input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan jumlah"
                min="1"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRestock}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Restock
              </button>
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setSelectedProduct(null);
                  setRestockAmount('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
