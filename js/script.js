// Initialize the map centered on Albania
const map = L.map('map', {
    center: [41.1533, 20.1683], // Center of Albania
    zoom: 7,
    zoomControl: true,
    maxBounds: [[39.5, 19.0], [42.7, 21.2]], // Restrict view to Albania
    maxZoom: 10,
    minZoom: 6,
    attributionControl: true
});

// Create a less detailed base map layer using Stadia Maps Alidade Smooth
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    maxZoom: 10,
    opacity: 0.6 // Reduced opacity for vintage effect
}).addTo(map);

// Add a sepia filter overlay
L.tileLayer('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMTAvMTUvMjB/4fz7AAAAC0lEQVQImWP4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC', {
    maxZoom: 10,
    opacity: 0.2
}).addTo(map);

// Create a mask layer for areas outside Albania
const maskLayer = L.rectangle([[-90, -180], [90, 180]], {
    color: '#f4e4bc',
    fillColor: '#f4e4bc',
    fillOpacity: 0.7,
    weight: 0
}).addTo(map);

// Load and style the GeoJSON with vintage styling
fetch('/albanian-writers-map/data/geoBoundaries-ALB-ADM1_simplified.geojson')
    .then(response => response.json())
    .then(data => {
        // Add a layer for the Albania geojson with vintage styling
        const albaniaLayer = L.geoJSON(data, {
            style: {
                color: '#8b4513', // Vintage brown color
                weight: 2,
                fillColor: '#f4e4bc', // Vintage paper color
                fillOpacity: 0.1,
                dashArray: '5, 5', // Create a dashed line for vintage effect
                opacity: 0.8
            }
        }).addTo(map);

        // Create an inverted mask using Albania's shape
        maskLayer.setLatLngs([
            [[-90, -180], [90, 180]], // World bounds
            albaniaLayer.getBounds().pad(0.1).toBBoxString().split(',').map(Number).concat() // Albania bounds
        ]);

        // Set the map's bounds to focus on Albania
        map.fitBounds(albaniaLayer.getBounds());
        
        // Set the max bounds with some padding
        map.setMaxBounds(albaniaLayer.getBounds().pad(0.1));
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Determine the current language from the HTML file name
const isEnglish = window.location.pathname.includes('-en');
const currentLang = isEnglish ? 'en' : 'sq';

// Reference points calibrated for the SVG map
const referencePoints = {
    gjirokaster: {
        lat: 40.0758,
        lng: 20.1393,
        x: 150,  // Adjusted based on the screenshot
        y: 350   // Adjusted based on the screenshot
    },
    korce: {
        lat: 40.6186,
        lng: 20.7808,
        x: 200,  // Adjusted based on the screenshot
        y: 200   // Adjusted based on the screenshot
    }
};

// Function to convert geographic coordinates to map coordinates
function geoToMapCoords(lat, lng) {
    // With GeoJSON, we can use the coordinates directly
    return [lat, lng];
}

// Function to create modal content
function createModalContent(writer) {
    return `
        <div class="writer-info">
            <img src="${writer.photo}" alt="${writer.name}">
            <h3>${writer.name}</h3>
            <p>${writer.bio[currentLang]}</p>
        </div>
    `;
}

// Function to show modal
function showModal(content) {
    const modal = document.querySelector('.modal');
    const modalContent = modal.querySelector('.modal-content');
    const overlay = document.querySelector('.modal-overlay');
    
    modalContent.innerHTML = content;
    modal.style.display = 'block';
    overlay.style.display = 'block';
}

// Function to hide modal
function hideModal() {
    const modal = document.querySelector('.modal');
    const overlay = document.querySelector('.modal-overlay');
    
    modal.style.display = 'none';
    overlay.style.display = 'none';
}

// Event listeners for modal
document.querySelector('.close-modal').addEventListener('click', hideModal);
document.querySelector('.modal-overlay').addEventListener('click', hideModal);

// Create custom icon with vintage styling
const writerIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div class="marker-dot"></div>',
    iconSize: [24, 24] // Slightly larger for better visibility
});

// Fetch writers data
fetch('/albanian-writers-map/data/writers.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Add markers for each writer
        data.writers.forEach(writer => {
            const [lat, lng] = geoToMapCoords(writer.location.lat, writer.location.lng);
            
            L.marker([lat, lng], {
                icon: writerIcon
            })
            .addTo(map)
            .on('click', () => showModal(createModalContent(writer)));
        });
    })
    .catch(error => {
        console.error('Error loading writers data:', error);
        // Add visible error message on the map
        const errorDiv = document.createElement('div');
        errorDiv.className = 'map-error';
        errorDiv.innerHTML = 'Error loading writer data. Please try refreshing the page.';
        document.getElementById('map').appendChild(errorDiv);
    }); 