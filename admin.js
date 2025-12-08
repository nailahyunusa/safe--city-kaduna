// ============================
// Admin Authentication
// ============================

// Login
function adminLogin() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;

  if (user === "admin" && pass === "1234") {
    localStorage.setItem("adminAuth", "true");
    window.location.href = "admin-panel.html";
  } else {
    document.getElementById("error").innerText = "Invalid login details";
  }
}

// Redirect if trying to access admin-panel.html without auth
if (window.location.pathname.includes("admin-panel.html")) {
  if (localStorage.getItem("adminAuth") !== "true") {
    window.location.href = "admin-login.html";
  }
}

// Logout
function logout() {
  localStorage.removeItem("adminAuth");
  window.location.href = "admin-login.html";
}

// ============================
// Helper Functions
// ============================

function getSeverity(type) {
  const lowerType = type.toLowerCase();
  if (["armed robbery", "kidnapping"].includes(lowerType)) return "high";
  if (["assault", "theft"].includes(lowerType)) return "medium";
  return "low";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "show success";

  const notifySound = document.getElementById("notifySound");
  if (notifySound) {
    notifySound.play().catch(e => console.log("Audio play prevented:", e));
  }

  setTimeout(() => {
    toast.className = "";
  }, 4000);
}

// ============================
// TABLE SECTION
// ============================

function loadTable(reports) {
  const tbody = document.querySelector("#reportsTable tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  reports.forEach((report, index) => {
    const severity = getSeverity(report.type);

    const row = document.createElement("tr");
    row.className = severity;

    // Photo thumbnail (if present)
    const photoCell = report.photo ? `<td><img src="${report.photo}" alt="photo" style="width:72px;height:56px;object-fit:cover;border-radius:4px;border:1px solid #ddd;"></td>` : `<td>—</td>`;

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${report.type}</td>
      ${photoCell}
      <td>${severity.toUpperCase()}</td>
      <td>${report.address || "Not provided"}</td>
      <td>${report.contact || "N/A"}</td>
      <td>${new Date(report.date).toLocaleString()}</td>
      <td><span class="status new">NEW</span></td>
    `;
    tbody.appendChild(row);
  });

  // Update report count display
  const reportCountEl = document.getElementById('reportCount');
  if (reportCountEl) reportCountEl.textContent = `Reports: ${reports.length}`;
}

// ============================
// MAP SECTION
// ============================

let adminMap = null;
let markerLayer = null;

function loadMap(reports) {
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    console.warn("Map element not found!");
    return;
  }

  console.log(`[MAP] Loading map with ${reports.length} reports`);

  // Initialize map once
  if (!adminMap) {
    console.log("[MAP] Initializing new map instance");
    adminMap = L.map('map', { zoomControl: true }).setView([9.05785, 7.49508], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(adminMap);
    markerLayer = L.layerGroup().addTo(adminMap);
    
    // Ensure map resizes after initialization
    setTimeout(() => {
      adminMap.invalidateSize();
      console.log("[MAP] invalidateSize() called");
    }, 100);
  } else {
    console.log("[MAP] Clearing existing markers");
    markerLayer.clearLayers();
  }

  // Add markers and collect bounds
  const bounds = [];
  let markerCount = 0;

  reports.forEach((r, index) => {
    let lat, lng;
    
    // Try to get location from report
    if (r.location && r.location.lat && r.location.lng) {
      lat = r.location.lat;
      lng = r.location.lng;
      console.log(`[MARKER ${r.id}] Using real location: [${lat}, ${lng}]`);
    } else {
      // Fallback: Use default Kaduna location with slight offset for visualization
      const defaultLat = 9.05785;
      const defaultLng = 7.49508;
      lat = defaultLat + (index * 0.015); // Offset each marker slightly
      lng = defaultLng + (index * 0.015);
      console.log(`[MARKER ${r.id}] NO LOCATION DATA - using fallback offset: [${lat}, ${lng}]`);
    }

    // Create custom color based on severity
    const severity = getSeverity(r.type);
    let markerColor = '#4CAF50'; // green for low
    if (severity === 'medium') markerColor = '#FF9800'; // orange
    if (severity === 'high') markerColor = '#F44336'; // red

    console.log(`[MARKER ${r.id}] Creating ${severity} marker (${markerColor})`);

    const marker = L.circleMarker([lat, lng], {
      radius: 10,
      fillColor: markerColor,
      color: '#fff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.85
    }).addTo(markerLayer);

    marker.on('click', function() {
      this.openPopup();
    });

    const photoHtml = r.photo ? `<div style="margin:6px 0;"><img src="${r.photo}" alt="report photo" style="max-width:200px;display:block;border-radius:6px;border:1px solid #ccc;"/></div>` : '';

    marker.bindPopup(`
      <div style="font-size: 13px; width: 220px;">
        ${photoHtml}
        <b>${r.type}</b><br>
        Severity: <strong>${severity.toUpperCase()}</strong><br>
        ${r.address ? 'Address: ' + r.address : 'No address provided'}<br>
        <i>${new Date(r.date).toLocaleString()}</i>
      </div>
    `, { maxWidth: 250 });

    bounds.push([lat, lng]);
    markerCount++;
  });

  // Fit map to show all markers or default to Kaduna
  if (bounds.length > 1) {
    try {
      adminMap.fitBounds(bounds, { maxZoom: 13, padding: [80, 80] });
      console.log(`[MAP] Fitted bounds for ${bounds.length} markers`);
    } catch (e) {
      console.log("[MAP] Bounds fit error:", e);
      adminMap.setView([9.05785, 7.49508], 12);
    }
  } else if (bounds.length === 1) {
    adminMap.setView(bounds[0], 13);
    console.log(`[MAP] Single marker - set view to [${bounds[0][0]}, ${bounds[0][1]}]`);
  } else {
    // No markers, show Kaduna city center
    adminMap.setView([9.05785, 7.49508], 12);
    console.log("[MAP] No markers - showing Kaduna city center");
  }

  console.log(`[MAP] ✅ Completed. Total markers added: ${markerCount}`);
}

// ============================
// Emergency Notifications
// ============================

function sendAlert(alertType, report) {
  const alertLog = document.getElementById("alertLog");
  if (!alertLog) return;

  if (alertType === "whatsapp") {
    alertLog.innerHTML = `
      ✅ WhatsApp Alert Sent<br>
      Incident: <b>${report.type}</b><br>
      Location: ${report.address || "Unknown"}
    `;
  } else if (alertType === "sms") {
    alertLog.innerHTML = `
      ✅ SMS Alert Sent<br>
      Incident: <b>${report.type}</b><br>
      Time: ${new Date(report.date).toLocaleString()}
    `;
  }

  showToast(`📲 ${alertType.toUpperCase()} alert sent for ${report.type}`);
}

// ============================
// Debug: clear stored reports
// ============================
window.clearAllData = function() {
  localStorage.removeItem('crimeReports');
  if (markerLayer && typeof markerLayer.clearLayers === 'function') {
    markerLayer.clearLayers();
  }
  const tbody = document.querySelector('#reportsTable tbody');
  if (tbody) tbody.innerHTML = '';
  const reportCountEl = document.getElementById('reportCount');
  if (reportCountEl) reportCountEl.textContent = 'Reports: 0';
  showToast('🗑️ All reports cleared!');
  console.log('All reports cleared via clearAllData()');
};

// ============================
// Real-time Updates & Initialization
// ============================

document.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('map');
  const tableEl = document.getElementById('reportsTable');
  const alertLog = document.getElementById("alertLog");
  const whatsappBtn = document.getElementById("whatsappBtn");
  const smsBtn = document.getElementById("smsBtn");

  // Function to refresh reports
  function refreshReports() {
    const reports = JSON.parse(localStorage.getItem('crimeReports')) || [];
    console.log(`Refreshing reports: ${reports.length} reports found`);
    if (reports.length > 0) {
      console.log('First report:', reports[0]);
    }
    
    if (mapEl || tableEl) {
      loadTable(reports);
      loadMap(reports);
    }
  }

  // Debug function: Add test data to localStorage
  window.addTestData = function() {
    const testReports = [
      {
        id: 1,
        type: "theft",
        description: "Bag stolen from market",
        address: "Ahmadu Bello Way, Kaduna",
        contact: "08012345678",
        photo: "",
        location: { lat: 9.06, lng: 7.50 },
        date: new Date().toISOString()
      },
      {
        id: 2,
        type: "assault",
        description: "Street fight reported",
        address: "Kawo Junction, Kaduna",
        contact: "08087654321",
        photo: "",
        location: { lat: 9.08, lng: 7.52 },
        date: new Date().toISOString()
      },
      {
        id: 3,
        type: "kidnapping",
        description: "Missing person alert",
        address: "Unguwa Oya, Kaduna",
        contact: "08056789012",
        photo: "",
        location: { lat: 9.04, lng: 7.48 },
        date: new Date().toISOString()
      }
    ];
    localStorage.setItem('crimeReports', JSON.stringify(testReports));
    console.log("✅ Test data added! Refreshing...");
    refreshReports();
  };

  // If this page includes admin report table or map, load reports
  if (mapEl || tableEl) {
    refreshReports();
  }

  // Setup Emergency Button Listeners
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", () => {
      const reports = JSON.parse(localStorage.getItem("crimeReports")) || [];

      if (!reports.length) {
        if (alertLog) alertLog.textContent = "No reports to send.";
        return;
      }

      const latest = reports[reports.length - 1];
      sendAlert("whatsapp", latest);
    });
  }

  if (smsBtn) {
    smsBtn.addEventListener("click", () => {
      const reports = JSON.parse(localStorage.getItem("crimeReports")) || [];

      if (!reports.length) {
        if (alertLog) alertLog.textContent = "No reports to send.";
        return;
      }

      const latest = reports[reports.length - 1];
      sendAlert("sms", latest);
    });
  }

  // Check for new reports every 2 seconds (more responsive)
  let lastReportCount = (JSON.parse(localStorage.getItem("crimeReports")) || []).length;

  setInterval(() => {
    let currentReports = JSON.parse(localStorage.getItem("crimeReports")) || [];

    if (currentReports.length !== lastReportCount) {
      const newCount = currentReports.length - lastReportCount;
      
      if (newCount > 0) {
        showToast(`🚨 ${newCount} new crime report${newCount > 1 ? 's' : ''} received`);
      } else if (newCount < 0) {
        console.log("Reports were cleared");
      }
      
      refreshReports();
      lastReportCount = currentReports.length;
    }
  }, 2000);

  // Listen for storage changes (supports real-time updates from other tabs)
  window.addEventListener('storage', (e) => {
    if (e.key === 'crimeReports') {
      const reports = JSON.parse(e.newValue) || [];
      console.log(`Storage event: reports updated from another tab (${reports.length} reports)`);
      refreshReports();
    }
  });
});
