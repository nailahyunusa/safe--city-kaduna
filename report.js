// ============================
// report.js - SafeCity Kaduna
// ============================

// Elements
const reportForm = document.getElementById('reportForm');
const useLocationBtn = document.getElementById('useLocation');
const clearLocationBtn = document.getElementById('clearLocation');
const locationInfo = document.getElementById('locationInfo');
const statusMsg = document.getElementById('status');

let currentLocation = null; // Store selected location

// ============================
// Use My Location
// ============================
async function requestLocationWithPermission() {
  if (!navigator.geolocation) {
    locationInfo.textContent = 'Geolocation is not supported by your browser.';
    return null;
  }

  // Helpful message while we check/ask
  locationInfo.textContent = 'Locating...';

  // Check Permissions API when available
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const perm = await navigator.permissions.query({ name: 'geolocation' });
      if (perm.state === 'denied') {
        locationInfo.innerHTML = `Location access is blocked. Please enable location for this site in your browser settings or use the manual address field.`;
        return null;
      }
      // if prompt or granted, proceed to getCurrentPosition
    }
  } catch (e) {
    // Permissions API not supported — continue to request location
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => {
        if (error && error.code === error.PERMISSION_DENIED) {
          locationInfo.innerHTML = `Permission denied. To enable: open your browser/site settings and allow Location access, or enter an address manually.`;
        } else if (error && error.code === error.POSITION_UNAVAILABLE) {
          locationInfo.textContent = 'Position unavailable.';
        } else if (error && error.code === error.TIMEOUT) {
          locationInfo.textContent = 'Location request timed out.';
        } else {
          locationInfo.textContent = 'An unknown error occurred.';
        }
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

useLocationBtn.addEventListener('click', async () => {
  const loc = await requestLocationWithPermission();
  if (loc) {
    currentLocation = { ...loc };
    locationInfo.textContent = `Latitude: ${loc.lat.toFixed(6)}, Longitude: ${loc.lng.toFixed(6)}`;
  }
});

// ============================
// Clear Location
// ============================
clearLocationBtn.addEventListener('click', () => {
  currentLocation = null;
  locationInfo.textContent = 'No location chosen.';
});

// ============================
// Form Submission
// ============================
reportForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const description = document.getElementById('description').value.trim();
  const address = document.getElementById('address').value.trim();
  const contact = document.getElementById('contact').value.trim();
  const photoInput = document.getElementById('photo');
  const photo = photoInput.files.length ? photoInput.files[0].name : '';

  if (!type) {
    alert('Please select an incident type.');
    return;
  }

  // Get existing reports from localStorage
  const existingReports = JSON.parse(localStorage.getItem('crimeReports')) || [];

  // Create new report
  const newReport = {
    id: existingReports.length ? Math.max(...existingReports.map(r => r.id)) + 1 : 1,
    type,
    description,
    address,
    contact,
    photo,
    location: currentLocation ? { ...currentLocation } : null,
    date: new Date().toISOString()
  };

  // Save to localStorage
  existingReports.push(newReport);
  localStorage.setItem('crimeReports', JSON.stringify(existingReports));

  // Show status
  statusMsg.textContent = 'Report submitted successfully!';
  statusMsg.style.color = 'green';

  // Reset form and location
  reportForm.reset();
  currentLocation = null;
  locationInfo.textContent = 'No location chosen.';
});