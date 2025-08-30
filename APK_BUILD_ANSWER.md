# 📋 Quick Answer: Build Output Location

## ❓ **Question: "Where is the APK will go after built?"**

## ✅ **Answer: This project does NOT generate APK files**

### 🔍 What this project actually builds:

**This is a Progressive Web App (PWA), not a native Android app.**

### 📂 Build output location:
```bash
# After running: npm run build
# Files are generated in:
./dist/
```

### 📁 What's inside dist/ folder:

| Directory/File | Purpose |
|---------------|---------|
| `assets/` | All bundled JavaScript and CSS files |
| `icons/` | PWA app icons for all device sizes |
| `index.html` | Main entry point of the web app |
| `manifest.json` | PWA configuration file |
| `offline.html` | Page shown when offline |
| `*.ttf` files | Arabic fonts for PDF generation |

### 📱 How users "install" the app:

Instead of downloading an APK:
1. **Visit the website** in any mobile browser
2. **Tap "Add to Home Screen"** when prompted
3. **App installs** like a native app
4. **Works offline** and receives notifications

### 🚀 How to deploy:

1. **Build the app**: `npm run build`
2. **Upload dist/ folder** to any web hosting service:
   - Vercel
   - Netlify  
   - GitHub Pages
   - AWS S3
   - Any web server

### 📖 For detailed information:
- **[BUILD_OUTPUT_GUIDE.md](./BUILD_OUTPUT_GUIDE.md)** - Complete build guide
- **[PWA_INSTALLATION_GUIDE.md](./PWA_INSTALLATION_GUIDE.md)** - User installation guide

---

**Summary**: No APK is generated. The `dist/` folder contains web files that users access through browsers and can install as a PWA.