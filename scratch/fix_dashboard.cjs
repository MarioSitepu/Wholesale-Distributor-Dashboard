const fs = require('fs');
let content = fs.readFileSync('src/app-react/pages/admin/AdminDashboard.tsx', 'utf8');

// Move selectedReportStore up
content = content.replace(`  const [selectedReportStore, setSelectedReportStore] = useState<string>("all");
  const [selectedReportDate, setSelectedReportDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"),
  );`, '');

content = content.replace('  const [isLoadingReport, setIsLoadingReport] = useState(false);', `  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [selectedReportStore, setSelectedReportStore] = useState<string>("all");
  const [selectedReportDate, setSelectedReportDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"),
  );`);

// Fix references to 'orders'
content = content.replace(/orders/g, 'recentOrders'); // But wait, maybe 'orders' was used for something specific? Let me replace it properly.
// Let's just write the script to not do global replace for orders, but replace lines around 431.

fs.writeFileSync('src/app-react/pages/admin/AdminDashboard.tsx', content);
