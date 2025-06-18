const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icon function
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1e40af');
  gradient.addColorStop(1, '#3b82f6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // White circle background for logo
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Text logo
  ctx.fillStyle = '#1e40af';
  ctx.font = `bold ${size * 0.25}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AR', size / 2, size / 2);

  // Subtitle for larger icons
  if (size >= 192) {
    ctx.font = `${size * 0.06}px Arial`;
    ctx.fillText('RENTAL', size / 2, size * 0.75);
  }

  return canvas;
}

// Generate badge icon (smaller, simpler)
function generateBadgeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(0, 0, size, size);

  // White text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', size / 2, size / 2);

  return canvas;
}

// Generate all icon sizes
console.log('Generating PWA icons...');
iconSizes.forEach(size => {
  const canvas = generateIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filename, buffer);
  console.log(`✓ Generated ${filename}`);
});

// Generate badge icon
const badgeCanvas = generateBadgeIcon(72);
const badgeBuffer = badgeCanvas.toBuffer('image/png');
const badgeFilename = path.join(iconsDir, 'badge-72x72.png');
fs.writeFileSync(badgeFilename, badgeBuffer);
console.log(`✓ Generated ${badgeFilename}`);

// Generate shortcut icons
const shortcuts = ['agreement', 'payment', 'vehicle', 'legal'];
shortcuts.forEach(name => {
  const canvas = createCanvas(192, 192);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, 192, 192);

  // Icon background
  ctx.beginPath();
  ctx.arc(96, 96, 70, 0, Math.PI * 2);
  ctx.fillStyle = '#1e40af';
  ctx.fill();

  // Icon text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name[0].toUpperCase(), 96, 96);

  const buffer = canvas.toBuffer('image/png');
  const filename = path.join(iconsDir, `${name}-192.png`);
  fs.writeFileSync(filename, buffer);
  console.log(`✓ Generated ${filename}`);
});

console.log('\nAll PWA icons generated successfully!');
console.log('\nNote: These are placeholder icons. For production, replace with professionally designed icons.');

// Create a sample manifest for icon testing
const manifestIcons = iconSizes.map(size => ({
  src: `/icons/icon-${size}x${size}.png`,
  sizes: `${size}x${size}`,
  type: 'image/png'
}));

console.log('\nManifest icons configuration:');
console.log(JSON.stringify(manifestIcons, null, 2));