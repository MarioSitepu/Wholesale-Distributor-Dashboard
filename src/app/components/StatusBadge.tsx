interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'in-stock' | 'limited' | 'out-of-stock';
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const configs = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: label || 'Menunggu Konfirmasi' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: label || 'Diproses' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: label || 'Selesai' },
    'in-stock': { bg: 'bg-green-100', text: 'text-green-800', label: label || 'Tersedia' },
    limited: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: label || 'Terbatas' },
    'out-of-stock': { bg: 'bg-red-100', text: 'text-red-800', label: label || 'Habis' },
  };

  const config = configs[status];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
