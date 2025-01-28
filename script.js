const mapCenter = [47.5615, -52.7126];
const map = L.map('map').setView(mapCenter, 13);
let countdownTimer;
let timeRemaining = 300;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const busMarkers = [];
const busNumbersSet = new Set(); // To track unique bus numbers

// Function to fetch bus data from the API
async function getBusData() {
    const url = "https://www.metrobus.co.ca/api/timetrack/json/";
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });
        const busData = await response.json();
        return busData;
    } catch (e) {
        console.error("Error fetching bus data:", e);
        return [];
    }
}

function updateTimer() {
    const timerElement = document.getElementById('timerOverlay');
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerElement.textContent = `Updating in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function resetTimer() {
    clearInterval(countdownTimer);
    timeRemaining = 300;
    updateTimer();
    countdownTimer = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
            updateTimer();
        } else {
            clearInterval(countdownTimer);
        }
    }, 1000);
}

async function updateMap() {
    const buses = await getBusData();
    const rawDataContainer = document.getElementById('rawData');
    const busNumbersContainer = document.getElementById('busNumbers');
    rawDataContainer.innerHTML = ""; // Clear previous data

    busMarkers.forEach(marker => marker.remove());
    busMarkers.length = 0;

    buses.forEach(bus => {
        const route = bus.current_route || "Unknown";
        const lat = parseFloat(bus.bus_lat);
        const lon = parseFloat(bus.bus_lon);
        const currentLocation = bus.current_location || "Unknown";
        const positionTime = bus.position_time || "Unknown";
        const deviation = bus.deviation || "Unknown";

        // Add bus route data to raw data display
        const busDataText = `  
            <div>
                <strong>Route: ${route}</strong><br>
                Latitude: ${lat}<br>
                Longitude: ${lon}<br>
                Last Updated: ${positionTime}<br>
                Location: ${currentLocation}<br>
                Status: ${deviation}<br><br>
            </div>
        `;
        rawDataContainer.innerHTML += busDataText;

        const routeNumber = route.split('-')[0];

        const icon = L.divIcon({
            className: 'leaflet-div-icon',
            html: `<div style="position: relative;">
                    <i class="fa-solid fa-location-pin" style="font-size: 24px; color: blue;"></i>
                    <div class="bus-route" style="position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); color: white; background-color: rgba(0, 0, 0, 0.5); padding: 3px 6px; border-radius: 5px;">
                        ${routeNumber}
                    </div>
                  </div>`
        });

        const marker = L.marker([lat, lon], { icon }).addTo(map)
            .bindPopup(`
                <strong>Route: ${route}</strong><br>
                Location: ${currentLocation}<br>
                Last Updated: ${positionTime}<br>
                Status: ${deviation}
            `);

        busMarkers.push(marker);

        // Check if the bus number is already in the set
        if (!busNumbersSet.has(routeNumber)) {
            busNumbersSet.add(routeNumber);

            // Create bus number button for the floating panel
            const busNumberButton = document.createElement('div');
            busNumberButton.className = 'bus-number';
            busNumberButton.textContent = routeNumber;
            busNumberButton.onclick = function () {
                map.setView([lat, lon], 14);
            };

            busNumbersContainer.appendChild(busNumberButton);
        }
    });

    resetTimer();
}

setInterval(updateMap, 300000); // Refresh the bus data
updateMap();

const accordion = document.querySelector('.accordion');
const panel = document.getElementById('rawData');

accordion.addEventListener('click', function() {
    this.classList.toggle('active');
    if (panel.style.display === "block") {
        panel.style.display = "none";
    } else {
        panel.style.display = "block";
    }
});

function toggleBusNumbers() {
    const busNumbersContainer = document.getElementById('busNumbers');
    const currentDisplay = busNumbersContainer.style.display;
    busNumbersContainer.style.display = currentDisplay === 'flex' ? 'none' : 'flex';
}
