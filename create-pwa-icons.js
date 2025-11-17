const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to create a simple icon
function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, size, size);

  // White circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI);
  ctx.fill();

  // CRM text
  ctx.fillStyle = '#3b82f6';
  ctx.font = `bold ${size/8}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CRM', size/2, size/2);

  return canvas.toBuffer('image/png');
}

// Create icons
try {
  const icon192 = createIcon(192);
  const icon512 = createIcon(512);

  fs.writeFileSync('./public/pwa-192x192.png', icon192);
  fs.writeFileSync('./public/pwa-512x512.png', icon512);
  fs.writeFileSync('./public/apple-touch-icon.png', icon192);
  fs.writeFileSync('./public/mstile-150x150.png', createIcon(150));

  console.log('PWA icons created successfully!');
} catch (error) {
  console.log('Canvas not available, creating placeholder files...');
  
  // Create placeholder files
  const placeholder = Buffer.from('placeholder');
  fs.writeFileSync('./public/pwa-192x192.png', placeholder);
  fs.writeFileSync('./public/pwa-512x512.png', placeholder);
  fs.writeFileSync('./public/apple-touch-icon.png', placeholder);
  fs.writeFileSync('./public/mstile-150x150.png', placeholder);
  
  console.log('Placeholder icon files created. Please replace with actual icons.');
}
