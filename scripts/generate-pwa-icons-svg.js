const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for main icon
function generateIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad${size})"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="white"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size * 0.25}" font-weight="bold" fill="#1e40af" text-anchor="middle" dominant-baseline="middle">AR</text>
  ${size >= 192 ? `<text x="${size/2}" y="${size * 0.75}" font-family="Arial, sans-serif" font-size="${size * 0.06}" fill="#1e40af" text-anchor="middle">RENTAL</text>` : ''}
</svg>`;
}

// SVG template for badge icon
function generateBadgeSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1e40af"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">A</text>
</svg>`;
}

// SVG template for shortcut icons
function generateShortcutSVG(name) {
  return `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#f3f4f6"/>
  <circle cx="96" cy="96" r="70" fill="#1e40af"/>
  <text x="96" y="96" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${name[0].toUpperCase()}</text>
</svg>`;
}

// Generate all icon sizes
console.log('Generating PWA icons as SVG placeholders...');
console.log('Note: For production, convert these to PNG using an image editor or online converter.');
console.log('');

iconSizes.forEach(size => {
  const svg = generateIconSVG(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✓ Generated ${filename}`);
});

// Generate badge icon
const badgeSvg = generateBadgeSVG(72);
const badgeFilename = path.join(iconsDir, 'badge-72x72.svg');
fs.writeFileSync(badgeFilename, badgeSvg);
console.log(`✓ Generated ${badgeFilename}`);

// Generate shortcut icons
const shortcuts = ['agreement', 'payment', 'vehicle', 'legal'];
shortcuts.forEach(name => {
  const svg = generateShortcutSVG(name);
  const filename = path.join(iconsDir, `${name}-192.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✓ Generated ${filename}`);
});

// Also create a single 512x512 PNG placeholder using base64
const placeholderPNG = `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;

// Write at least one PNG for basic functionality
iconSizes.forEach(size => {
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filename, Buffer.from(placeholderPNG, 'base64'));
});

console.log('\n✓ All PWA icon placeholders generated successfully!');
console.log('\nIMPORTANT: These are placeholder files. For production:');
console.log('1. Convert the SVG files to PNG format');
console.log('2. Replace with professionally designed icons');
console.log('3. Ensure all icons have transparent backgrounds where appropriate');