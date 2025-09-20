/**
 * Background Script for AI Job Applier
 * Handles extension lifecycle and message passing
 */

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('AI Job Applier extension installed/updated');
    
    // Set default icon
    chrome.action.setIcon({
        path: {
            "16": "icons/icon16.png",
            "32": "icons/icon32.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
        }
    });
});

// Tab update listener to change icon based on current site
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const isLinkedIn = tab.url.includes('linkedin.com');
        
        // Update icon based on whether we're on LinkedIn
        chrome.action.setIcon({
            path: {
                "16": isLinkedIn ? "icons/icon16-active.png" : "icons/icon16.png",
                "32": isLinkedIn ? "icons/icon32-active.png" : "icons/icon32.png",
                "48": isLinkedIn ? "icons/icon48-active.png" : "icons/icon48.png",
                "128": isLinkedIn ? "icons/icon128-active.png" : "icons/icon128.png"
            },
            tabId: tabId
        });
        
        // Update tooltip
        chrome.action.setTitle({
            title: isLinkedIn ? 'AI Job Applier - Ready to use' : 'AI Job Applier - Navigate to LinkedIn',
            tabId: tabId
        });
    }
});

// Keep application running even when popup is closed
let applicationState = {
    isProcessing: false,
    currentJob: null,
    jobQueue: [],
    processTimeout: null
};

// Persist application state
chrome.storage.local.get(['applicationState']).then(result => {
    if (result.applicationState) {
        applicationState = { ...applicationState, ...result.applicationState };
        console.log('Restored application state:', applicationState);
    }
});

function saveApplicationState() {
    chrome.storage.local.set({ applicationState });
}

// Continue processing jobs even when popup is closed
function continueProcessing() {
    if (!applicationState.isProcessing || !applicationState.currentJob) {
        return;
    }
    
    console.log('Continuing job processing in background for:', applicationState.currentJob.jobTitle);
    
    // Set timeout to continue processing
    applicationState.processTimeout = setTimeout(() => {
        // Notify popup to continue if it's open
        chrome.runtime.sendMessage({
            type: 'CONTINUE_PROCESSING',
            job: applicationState.currentJob
        }).catch(() => {
            // Popup not open, continue in background
            console.log('Popup closed, continuing processing in background');
        });
    }, 5000);
}

// Message handling for communication between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    // Handle application state updates
    if (message.type === 'UPDATE_APPLICATION_STATE') {
        applicationState = { ...applicationState, ...message.state };
        saveApplicationState();
        
        if (applicationState.isProcessing) {
            continueProcessing();
        }
        
        sendResponse({ success: true });
        return true;
    }
    
    // Handle processing continuation
    if (message.type === 'GET_APPLICATION_STATE') {
        sendResponse({ state: applicationState });
        return true;
    }
    
    // Forward messages to popup if needed
    if (message.type === 'JOBS_SCRAPED' || 
        message.type === 'JOB_DESCRIPTION_SCRAPED' || 
        message.type === 'APPLICATION_SUBMITTED') {
        
        // Store message temporarily for popup to retrieve
        chrome.storage.local.set({
            [`temp_message_${Date.now()}`]: message
        });
    }
    
    return true; // Keep message channel open for async responses
});

// Alarm handler for scheduled tasks (if needed in future)
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm triggered:', alarm.name);
    
    switch (alarm.name) {
        case 'checkJobStatus':
            // Could be used for periodic status checks
            break;
        default:
            break;
    }
});

// Context menu setup (optional enhancement)
chrome.runtime.onInstalled.addListener(() => {
    try {
        chrome.contextMenus.create({
            id: 'openJobApplier',
            title: 'Open AI Job Applier',
            contexts: ['page'],
            documentUrlPatterns: ['*://www.linkedin.com/*']
        });
    } catch (error) {
        console.log('Context menu creation failed:', error);
    }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openJobApplier') {
        // Note: chrome.action.openPopup() only works in user gesture context
        // For context menu, we'll focus the extension instead
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                func: () => {
                    // This will trigger the user to click the extension icon
                    console.log('Please click the AI Job Applier extension icon');
                }
            });
        });
    }
});
