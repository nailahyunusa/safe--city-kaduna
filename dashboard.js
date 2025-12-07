// ============================
// dashboard.js - SafeCity Kaduna
// ============================

// Reference to table body
const reportTableBody = document.querySelector('#reportTable tbody');

// Initialize Leaflet map
const map = L.map('map').setView([10.5105, 7.4165], 12); // Kaduna center

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19
}).addTo(map);

// Layer group for markers
const markerGroup = L.layerGroup().addTo(map);

// Load reports from localStorage and render table + markers
function loadReports() {
  const reports = JSON.parse(localStorage.getItem('crimeReports')) || [];

  // Clear table and markers
  reportTableBody.innerHTML = '';
  markerGroup.clearLayers();

  reports.forEach(report => {
    // --- Add table row ---
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${report.id}</td>
      <td>${report.type}</td>
      <td>${report.description}</td>
      <td>${report.location ? `(${report.location.lat.toFixed(6)}, ${report.location.lng.toFixed(6)})` : 'N/A'}</td>
      <td>
        <button class="delete-btn" data-id="${report.id}">Delete</button>
      </td>
    `;
    reportTableBody.appendChild(tr);

    // Delete functionality
    tr.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this report?')) {
        const updatedReports = reports.filter(r => r.id !== report.id);
        localStorage.setItem('crimeReports', JSON.stringify(updatedReports));
        loadReports(); // refresh table and markers
      }
    });

    // --- Add marker if location exists ---
    if (report.location) {
      L.marker([report.location.lat, report.location.lng])
        .addTo(markerGroup)
        .bindPopup(`<b>${report.type}</b><br>${report.description}`);
    }
  });
}

// Initial load
loadReports();