# Chrome Extension Testing Checklist

## Installation Test
- [ ] Extension loads without errors in chrome://extensions/
- [ ] Extension icon appears in Chrome toolbar
- [ ] No error messages in the extension details

## UI Test
- [ ] Click extension icon opens popup
- [ ] All three tabs (Summary, Postings, Settings) are visible
- [ ] Tab switching works properly
- [ ] Form fields are present in Settings tab

## Icon Test
- [ ] Extension icon is gray when not on LinkedIn
- [ ] Extension icon turns blue when on LinkedIn
- [ ] Icon tooltip changes based on current site

## Settings Test
- [ ] Can enter text in all form fields
- [ ] "Save Settings" button works
- [ ] Settings persist after closing/reopening popup

## LinkedIn Integration Test
1. Navigate to linkedin.com
2. Check if icon changes to blue
3. Try clicking "Start Application" (should show error without API key)

## Console Check
- [ ] No JavaScript errors in browser console
- [ ] No errors in extension service worker console

## Expected Behavior
- Extension should load successfully
- UI should be responsive and modern
- Settings should save/load properly
- Should detect LinkedIn pages correctly
