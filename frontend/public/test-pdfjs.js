// Test PDF.js setup
console.log('PDF.js version:', pdfjsLib.version);
console.log('Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);

// Test if we can create a simple PDF document
const testArrayBuffer = new ArrayBuffer(0);
pdfjsLib.getDocument({ data: testArrayBuffer }).promise
  .then(() => console.log('PDF.js is working correctly'))
  .catch(error => console.error('PDF.js error:', error));
