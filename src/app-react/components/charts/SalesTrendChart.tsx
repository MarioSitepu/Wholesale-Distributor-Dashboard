import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SalesTrendChartProps {
  data: {
    date: string;
    total: number;
  }[];
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function SalesTrendChart({ data }: SalesTrendChartProps) {
  // Hitung lebar minimal agar grafik otomatis memiliki scroll yang nyaman
  // Berikan jarak ekstra (gap) per titik berdasarkan rentang waktu:
  let itemWidth = 70; // Default untuk tahun (12 data)
  if (data.length <= 5)
    itemWidth = 180; // Bulan (Teks panjang spt "Minggu 1 (1-7)")
  else if (data.length <= 7) itemWidth = 120; // Minggu (Teks hari)

  // Lebar minimum absolut adalah 800px agar di mobile/layar kecil tetap memunculkan scroll
  const minWidth = Math.max(800, data.length * itemWidth);

  return (
    <div className="w-full overflow-x-auto pb-4 -mb-4 custom-scrollbar">
      <div style={{ minWidth: `${minWidth}px` }}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 60, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              dy={10}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `Rp ${(value / 1000000).toFixed(1)}M`;
                }
                return formatRupiah(value);
              }}
              width={80}
            />
            <Tooltip
              formatter={(value: number) => [
                formatRupiah(value),
                "Total Penjualan",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
