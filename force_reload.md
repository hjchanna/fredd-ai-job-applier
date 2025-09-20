# Force Chrome Extension Reload

## Complete Extension Reload Steps:

1. **Remove Extension Completely**
   - Go to `chrome://extensions/`
   - Click "Remove" on the AI Job Applier extension
   - Confirm removal

2. **Clear Chrome Cache (Optional but Recommended)**
   - Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
   - Select "Cached images and files"
   - Click "Clear data"

3. **Restart Chrome**
   - Close all Chrome windows
   - Reopen Chrome

4. **Reinstall Extension**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the folder: `/Users/hjchanna/git/hjchanna/fredd-ai-job-applier`

5. **Verify Installation**
   - Check for any error messages
   - Click extension icon to test popup
   - Check browser console for errors

## Alternative: Hard Refresh Method

If you want to keep the extension installed:

1. Go to `chrome://extensions/`
2. Click the reload button (🔄) on your extension
3. Open a new tab and go to any website
4. Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows) for hard refresh
5. Test the extension again

## Debug Console Check

After reinstalling:
1. Right-click extension icon → "Inspect popup"
2. Check Console tab for any JavaScript errors
3. Look for the specific error message you mentioned
