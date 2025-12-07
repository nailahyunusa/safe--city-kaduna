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
useLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  locationInfo.textContent = 'Locating...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      currentLocation = { lat: latitude, lng: longitude };
      locationInfo.textContent = `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`;
    },
    (error) => {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          locationInfo.textContent = 'Permission denied.';
          break;
        case error.POSITION_UNAVAILABLE:
          locationInfo.textContent = 'Position unavailable.';
          break;
        case error.TIMEOUT:
          locationInfo.textContent = 'Location request timed out.';
          break;
        default:
          locationInfo.textContent = 'An unknown error occurred.';
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
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