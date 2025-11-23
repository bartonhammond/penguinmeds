// jest-puppeteer.config.js
module.exports = {
  launch: {
    headless: false, // Run in headless mode (default: true)
    devtools: true, // Open DevTools (useful for debugging, default: false)
    slowMo: 50, // Slows down Puppeteer operations by the specified amount of milliseconds (useful for debugging)
//    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Additional arguments to pass to the browser instance
//    executablePath: '/path/to/chrome', // Specify a custom path to the Chrome/Chromium executable
    timeout: 30000, // Maximum time in milliseconds to wait for the browser to start
   // pipe: false, // Connect to a browser over a pipe instead of a WebSocket (only with Chrome)
  },
  browserContext: 'default', // Or 'incognito' for a new incognito browser context for each test
};
