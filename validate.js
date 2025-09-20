// Simple validation script for the Chrome extension
console.log('🔍 Validating Chrome Extension...');

// Check if all required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'background.js',
    'icons/icon16.png',
    'icons/icon32.png',
    'icons/icon48.png',
    'icons/icon128.png',
    'icons/icon16-active.png',
    'icons/icon32-active.png',
    'icons/icon48-active.png',
    'icons/icon128-active.png'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ Missing: ${file}`);
        allFilesExist = false;
    }
});

// Validate manifest.json
try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    console.log(`✅ manifest.json is valid JSON`);
    console.log(`📋 Extension: ${manifest.name} v${manifest.version}`);
} catch (error) {
    console.log(`❌ manifest.json error: ${error.message}`);
    allFilesExist = false;
}

if (allFilesExist) {
    console.log('\n🎉 Extension validation passed! Ready to install in Chrome.');
    console.log('\n📝 Next steps:');
    console.log('1. Open chrome://extensions/');
    console.log('2. Enable Developer mode');
    console.log('3. Click "Load unpacked"');
    console.log('4. Select this folder');
} else {
    console.log('\n❌ Extension validation failed. Fix missing files first.');
}
