require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'https://gender-healthcare-service-management.onrender.com/api/doctors';
const PING_INTERVAL = parseInt(process.env.PING_INTERVAL) || 60000; // 1 minute in milliseconds

async function pingBackend() {
    try {
        const response = await axios.get(BACKEND_URL);
        console.log(`[${new Date().toISOString()}] Ping successful - Status: ${response.status}`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Ping failed:`, error.message);
    }
}

// Ping immediately on startup
pingBackend();

// Then ping every minute
setInterval(pingBackend, PING_INTERVAL);

console.log(`Ping service started. Pinging ${BACKEND_URL} every ${PING_INTERVAL/1000} seconds`); 