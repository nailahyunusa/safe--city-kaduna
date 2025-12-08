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
  if (["Armed Robbery", "Kidnapping"].includes(type)) return "high";
  if (["Assault", "Theft"].includes(type)) return "medium";
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

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${report.type}</td>
      <td>${severity.toUpperCase()}</td>
      <td>${report.address || "Not provided"}</td>
      <td>${report.contact || "N/A"}</td>
      <td>${new Date(report.date).toLocaleString()}</td>
      <td><span class="status new">NEW</span></td>
    `;

    tbody.appendChild(row);
  });
}

// ============================
// MAP SECTION
// ============================

let adminMap = null;
let markerLayer = null;

function loadMap(reports) {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Initialize map once
  if (!adminMap) {
    adminMap = L.map('map', { zoomControl: true }).setView([9.05785, 7.49508], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(adminMap);
    markerLayer = L.layerGroup().addTo(adminMap);
    
    // Ensure map resizes after initialization
    setTimeout(() => {
      adminMap.invalidateSize();
    }, 100);
  } else {
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
      console.log(`Report ${r.id}: Using real location: [${lat}, ${lng}]`);
    } else {
      // Fallback: Use default Kaduna location with slight offset for visualization
      const defaultLat = 9.05785;
      const defaultLng = 7.49508;
      lat = defaultLat + (index * 0.015); // Offset each marker slightly
      lng = defaultLng + (index * 0.015);
      console.log(`Report ${r.id}: NO LOCATION DATA - using fallback offset: [${lat}, ${lng}]`);
    }
    }

    // Create custom color based on severity
    const severity = getSeverity(r.type);
    let markerColor = '#4CAF50'; // green for low
    if (severity === 'medium') markerColor = '#FF9800'; // orange
    if (severity === 'high') markerColor = '#F44336'; // red

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

    marker.bindPopup(`
      <div style="font-size: 13px; width: 220px;">
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
    } catch (e) {
      console.log("Map bounds error:", e);
      adminMap.setView([9.05785, 7.49508], 12);
    }
  } else if (bounds.length === 1) {
    adminMap.setView(bounds[0], 13);
  } else {
    // No markers, show Kaduna city center
    adminMap.setView([9.05785, 7.49508], 12);
  }

  console.log(`Map loaded with ${markerCount} markers`);
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
    
    if (mapEl || tableEl) {
      loadTable(reports);
      loadMap(reports);
    }
  }

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
