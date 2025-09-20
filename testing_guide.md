# Chrome Extension Developer Mode Testing Guide

## Installation Test
1. Go to `chrome://extensions/`
2. Enable "Developer mode" toggle
3. Click "Load unpacked"
4. Select the extension folder
5. Verify no errors appear

## UI Testing
### Test 1: Popup Opens
- Click extension icon in toolbar
- Popup should open with tabbed interface
- Check all three tabs: Summary, Postings, Settings

### Test 2: Tab Navigation
- Click each tab (Summary, Postings, Settings)
- Content should change appropriately
- Active tab should be highlighted

### Test 3: Settings Form
- Go to Settings tab
- Fill in test data:
  - Keywords: "Software Engineer"
  - Criteria: "Remote work preferred"
  - CV: "Test CV content"
  - API Key: "test-key-123"
- Click "Save Settings"
- Should see success message

## Icon State Testing
### Test 4: Icon Changes
- Navigate to any non-LinkedIn site
- Icon should be gray
- Navigate to linkedin.com
- Icon should turn blue
- Hover over icon to see tooltip change

## Developer Tools Testing
### Test 5: Console Debugging
1. Right-click extension icon → "Inspect popup"
2. Opens DevTools for popup
3. Check Console tab for errors
4. Test functionality while watching console

### Test 6: Background Script Debugging
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "service worker" link
4. Opens DevTools for background script
5. Check for errors in console

### Test 7: Storage Testing
1. Open popup DevTools (right-click icon → Inspect popup)
2. Go to Application tab → Storage → Local Storage
3. Enter test settings and save
4. Verify data appears in storage
5. Refresh popup and check if settings persist

## LinkedIn Integration Testing
### Test 8: LinkedIn Detection
1. Go to linkedin.com
2. Extension icon should turn blue
3. Open popup
4. Should show "Ready to use" status

### Test 9: Error Handling
1. Click "Start Application" without API key
2. Should show error message
3. Try with invalid API key
4. Should handle gracefully

## Common Issues & Solutions

### Issue: Extension won't load
- Check manifest.json syntax
- Verify all icon files exist
- Look for JavaScript errors in console

### Issue: Popup doesn't open
- Check popup.html and popup.js for errors
- Inspect popup in DevTools

### Issue: Settings don't save
- Check chrome.storage permissions in manifest
- Verify storage code in popup.js

### Issue: LinkedIn detection fails
- Check background.js tab listener
- Verify host permissions in manifest

## Debugging Commands
```javascript
// In popup DevTools console:
chrome.storage.local.get(null, console.log); // View all stored data
chrome.storage.local.clear(); // Clear all data

// Check if on LinkedIn:
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  console.log('Current URL:', tabs[0].url);
  console.log('Is LinkedIn:', tabs[0].url.includes('linkedin.com'));
});
```
