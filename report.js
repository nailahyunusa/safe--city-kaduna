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
    locationInfo.textContent = `✅ Location captured: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
    locationInfo.style.color = 'green';
  }
});

// ============================
// Clear Location
// ============================
clearLocationBtn.addEventListener('click', () => {
  currentLocation = null;
  locationInfo.textContent = 'No location chosen.';
  locationInfo.style.color = '#666';
});

// ============================
// Auto-request location on page load
// ============================
document.addEventListener('DOMContentLoaded', async () => {
  // Try to get location automatically (silently, no prompt if already denied)
  if (navigator.geolocation) {
    locationInfo.textContent = 'Auto-detecting location...';
    const loc = await requestLocationWithPermission();
    if (loc) {
      currentLocation = { ...loc };
      locationInfo.textContent = `✅ Location auto-detected: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
      locationInfo.style.color = 'green';
    }
  }
});

// ============================
// Form Submission
// ============================
reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const description = document.getElementById('description').value.trim();
  const address = document.getElementById('address').value.trim();
  const contact = document.getElementById('contact').value.trim();
  const photoInput = document.getElementById('photo');

  if (!type) {
    alert('Please select an incident type.');
    return;
  }

  // Warn if no location provided
  if (!currentLocation && !address) {
    const confirmSubmit = confirm('⚠️ No location or address provided. Submit anyway?');
    if (!confirmSubmit) {
      return;
    }
  }

  // Get existing reports from localStorage
  const existingReports = JSON.parse(localStorage.getItem('crimeReports')) || [];

  // Read photo as data URL (if provided)
  let photoData = '';
  if (photoInput && photoInput.files && photoInput.files.length) {
    const file = photoInput.files[0];
    try {
      photoData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.warn('Failed to read photo file:', err);
      photoData = '';
    }
  }

  // Create new report with location data
  const newReport = {
    id: existingReports.length ? Math.max(...existingReports.map(r => r.id)) + 1 : 1,
    type,
    description,
    address,
    contact,
    // store data URL (or empty string)
    photo: photoData,
    location: currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null,
    date: new Date().toISOString()
  };

  console.log('Saving report with location:', newReport.location);

  // Save to localStorage
  existingReports.push(newReport);
  localStorage.setItem('crimeReports', JSON.stringify(existingReports));

  // Show status
  statusMsg.textContent = '✅ Report submitted successfully! Thank you for helping keep Kaduna safe.';
  statusMsg.style.color = 'green';

  // Reset form and location
  reportForm.reset();
  currentLocation = null;
  locationInfo.textContent = 'No location chosen.';
  locationInfo.style.color = '#666';

  // Clear status message after 3 seconds
  setTimeout(() => {
    statusMsg.textContent = '';
  }, 3000);
});