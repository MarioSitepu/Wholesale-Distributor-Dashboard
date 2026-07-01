const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJicmFuY2giOiJQdXNhdCIsInJvbGUiOiJTVVBFUkFETUlOIiwiaWF0IjoxNzgyODcwOTk3fQ.SC6HJVW5HeJKO0p1UYtafS30WmBz2V8SICbhrbKbQ08";
fetch('http://localhost:3000/api/stock?branch=all', { headers: { 'Authorization': 'Bearer ' + token } })
  .then(r => r.json())
  .then(data => console.log('Type of response:', Array.isArray(data) ? 'Array' : typeof data, 'Length:', data.length, 'Data:', data.slice(0,1)))
  .catch(console.error);
