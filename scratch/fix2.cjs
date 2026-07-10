const fs = require('fs');
let content = fs.readFileSync('src/app-react/pages/admin/AdminDashboard.tsx', 'utf8');

content = content.replace('          {orders.length === 0 ? (', '          {recentOrders.length === 0 ? (');
content = content.replace('              {orders.slice(0, 15).map((order) => (', '              {recentOrders.slice(0, 15).map((order: any) => (');

fs.writeFileSync('src/app-react/pages/admin/AdminDashboard.tsx', content);
