
// Polyfills for browser environment
if (typeof window !== 'undefined') {
  // Add global object for compatibility with Node.js modules
  window.global = window;
  
  // Ensure process.env is available (needed by some Node.js modules)
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  
  // Ensure Buffer is available
  window.Buffer = window.Buffer || undefined;
}
