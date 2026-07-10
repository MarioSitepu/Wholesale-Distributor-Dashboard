const fs = require('fs');

let content = fs.readFileSync('src/app-react/pages/admin/AdminDashboard.tsx', 'utf8');

// 1. Replace states
content = content.replace(/const \[allOrders[\s\S]*?const \[isLoading, setIsLoading\] = useState\(true\);/, `const [kpi, setKpi] = useState({ dailySales: 0, monthlySales: 0, totalReceivables: 0, lowStockCount: 0 });
  const [dataTrend, setDataTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [branchContribution, setBranchContribution] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [dailyReportData, setDailyReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);`);

// 2. Replace useEffect fetchData
content = content.replace(/\/\/ Sync data dynamically by adding a refresh listener\/interval[\s\S]*?const effectiveChartBranch = undefined; \/\/ We already filtered by branch in the API call/, `// Fetch Main Dashboard Data
  useEffect(() => {
    const fetchMainData = async () => {
      try {
        setIsLoading(true);
        const branchParam = selectedBranch === "all" ? "all" : selectedBranch;
        const [kpiRes, branchesRes, storesRes, contributionRes, recentRes, topProdRes] = await Promise.all([
          api.get<any>(\`/api/dashboard/kpi?branch=\${branchParam}\`),
          api.get<any>('/api/branches'),
          api.get<any[]>(\`/api/stores?branch=\${branchParam}\`),
          api.get<any[]>(\`/api/dashboard/branch-contribution\`),
          api.get<any[]>(\`/api/dashboard/recent-orders?branch=\${branchParam}\`),
          api.get<any[]>(\`/api/dashboard/top-products?branch=\${branchParam}\`)
        ]);

        setKpi(kpiRes || { dailySales: 0, monthlySales: 0, totalReceivables: 0, lowStockCount: 0 });
        if (branchesRes && branchesRes.branches) {
          setBranches(branchesRes.branches.map((b: any) => b.name || b));
        }
        setStores(storesRes || []);
        setBranchContribution(contributionRes || []);
        setRecentOrders(recentRes || []);
        setTopProducts(topProdRes || []);
      } catch (error: any) {
        toast.error("Gagal memuat data dashboard: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMainData();
  }, [refreshKey, selectedBranch]);

  // Fetch Sales Trend independently (reacts to trendPeriod)
  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const branchParam = selectedBranch === "all" ? "all" : selectedBranch;
        let url = \`/api/dashboard/sales-trend?branch=\${branchParam}&type=\${trendPeriod}\`;
        if (trendValue !== undefined) url += \`&value=\${trendValue}\`;
        const res = await api.get<any[]>(url);
        setDataTrend(res || []);
      } catch (error: any) {
        toast.error("Gagal memuat tren penjualan: " + error.message);
      }
    };
    fetchTrend();
  }, [refreshKey, selectedBranch, trendPeriod, trendValue]);

  // Fetch Daily Report Data independently (reacts to report date/store)
  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedReportDate) return;
      try {
        setIsLoadingReport(true);
        const branchParam = selectedBranch === "all" ? "all" : selectedBranch;
        const res = await api.get<any[]>(\`/api/orders/daily-report?date=\${selectedReportDate}&storeId=\${selectedReportStore}&branch=\${branchParam}\`);
        
        const rows: any[] = [];
        res.forEach((order: any) => {
          order.items.forEach((item: any) => {
            rows.push({
              orderId: order.id,
              storeName: order.store?.name || order.storeName || "Unknown",
              branch: order.branch || "General",
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              total: item.quantity * item.price,
            });
          });
        });
        setDailyReportData(rows);
      } catch (error: any) {
        toast.error("Gagal memuat laporan harian");
      } finally {
        setIsLoadingReport(false);
      }
    };
    fetchReport();
  }, [refreshKey, selectedBranch, selectedReportDate, selectedReportStore]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };
`);

// 3. Remove old useMemos (dataTrend, topProducts, orders, products, receivables, stores, dailyReportData)
content = content.replace(/const dataTrend = useMemo\([\s\S]*?\}, \[orders, selectedReportStore, selectedReportDate\]\);/m, `// Old calculations removed in favor of API`);

// 4. Remove manual KPI calculations (dailySales, monthlySales, totalReceivables, lowStockCount, weeklyData, branchSalesData)
content = content.replace(/const today = new Date\(\);[\s\S]*?\}, \[orders, isSuperAdmin\]\);/m, `const { dailySales, monthlySales, totalReceivables, lowStockCount } = kpi;
  const branchSalesData = branchContribution;`);

// 5. Fix orders -> recentOrders
content = content.replace('          {orders.length === 0 ? (', '          {recentOrders.length === 0 ? (');
content = content.replace('              {orders.slice(0, 15).map((order) => (', '              {recentOrders.slice(0, 15).map((order: any) => (');

fs.writeFileSync('src/app-react/pages/admin/AdminDashboard.tsx', content);
console.log('Done script');
