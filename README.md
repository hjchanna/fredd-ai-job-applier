# AI Job Applier Chrome Extension

An intelligent Chrome extension that automates job applications on LinkedIn using AI-powered analysis and personalized cover letter generation.

## Features

- **Automated Job Search**: Scrapes LinkedIn job postings based on your keywords with updated selectors
- **AI-Powered Analysis**: Uses ChatGPT to analyze job compatibility and generate tailored cover letters
- **Smart Review Process**: Presents each application for your review before submission
- **Queue Management**: Efficiently processes multiple job applications in sequence
- **Status Tracking**: Monitors application status (pending, reviewing, applied, skipped)
- **Modern UI**: Clean, tabbed interface with real-time statistics
- **Full Job Details View**: Click any job to view complete details, description, and cover letter
- **Individual Job Processing**: Process specific jobs or run full automation
- **Background Processing**: Continues processing even when popup is closed
- **Comprehensive Logging**: Detailed debugging and troubleshooting logs
- **Enhanced Navigation**: Back button functionality and intuitive job management

## Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download/Clone the Extension**
   ```bash
   git clone <repository-url>
   cd fredd-ai-job-applier
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `fredd-ai-job-applier` folder
   - The extension should now appear in your extensions list

### Method 2: Package and Install

1. **Package the Extension**
   - Go to `chrome://extensions/`
   - Click "Pack extension"
   - Select the extension folder
   - This creates a `.crx` file

2. **Install the Package**
   - Drag the `.crx` file to the extensions page
   - Confirm installation

## Setup and Configuration

### 1. Get Your ChatGPT API Key

1. Visit [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account or log in
3. Generate a new API key
4. Copy the key (starts with `sk-`)

### 2. Configure the Extension

1. **Click the Extension Icon** in your Chrome toolbar
2. **Go to Settings Tab**
3. **Fill in Required Information**:
   - **Job Search Keywords**: e.g., "Software Engineer", "Frontend Developer"
   - **Application Criteria**: Your preferences (remote work, technologies, company size, etc.)
   - **CV Content**: Paste your complete resume/CV text
   - **ChatGPT API Key**: Your OpenAI API key
4. **Click "Save Settings"**

## Usage

### Step-by-Step Workflow

1. **Navigate to LinkedIn**
   - Go to [LinkedIn Jobs](https://www.linkedin.com/jobs/)
   - The extension icon will highlight when you're on LinkedIn

2. **Start the Process**
   - Click the extension icon
   - Go to the "Summary" tab
   - Click "Start Application"

3. **Automatic Job Collection**
   - The extension searches for jobs using your keywords
   - Scrapes job postings and adds them to the queue
   - Each job gets a "pending" status

4. **AI Analysis & Review**
   - For each job, the extension:
     - Scrapes the full job description
     - Sends it to ChatGPT for analysis
     - Generates a match score and cover letter
     - Presents it for your review

5. **Make Decisions**
   - Review the generated cover letter and match score
   - Choose to "Confirm & Apply" or "Decline"
   - The extension automatically submits applications you approve

6. **Track Progress**
   - Monitor statistics in the Summary tab
   - View all jobs in the Postings tab
   - Star important jobs for easy reference

### Interface Overview

#### Summary Tab
- **Statistics**: Count of pending, applied, skipped, and reviewing jobs
- **Start/Pause Controls**: Main action buttons
- **Status Messages**: Real-time feedback on current operations

#### Postings Tab
- **Job List**: All discovered jobs with status indicators
- **Star System**: Mark important jobs
- **Job Details**: Click any job to view full-page details with description and cover letter
- **Individual Actions**: "Process Job" and "View Job Post" buttons for each job
- **Back Navigation**: Return to job list from detail view

#### Settings Tab
- **Configuration Form**: All required settings
- **Data Management**: Save settings and clear data options

## Features in Detail

### AI Integration
- **Match Scoring**: 0-100 compatibility score based on your CV and criteria
- **Personalized Cover Letters**: Tailored to each specific job posting
- **Smart Analysis**: Considers job requirements against your background

### Queue Management
- **Duplicate Prevention**: Uses job IDs to avoid duplicate applications
- **Status Tracking**: Comprehensive status system for each application
- **Error Handling**: Graceful handling of failed applications

### Safety Features
- **Manual Review**: Every application requires your approval
- **Pause Functionality**: Stop the process at any time
- **Error Recovery**: Continues processing even if individual jobs fail
- **CSP Compliance**: Secure code execution without inline JavaScript
- **Background Persistence**: Maintains state across browser sessions

## Troubleshooting

### Common Issues

1. **"Please navigate to LinkedIn" Message**
   - Ensure you're on linkedin.com
   - Refresh the page and try again

2. **No Jobs Found**
   - Check your keywords are relevant
   - Ensure you're on the LinkedIn jobs search page
   - Try broader search terms

3. **API Errors**
   - Verify your ChatGPT API key is correct
   - Check you have sufficient API credits
   - Ensure your API key has the necessary permissions

4. **Application Submission Fails**
   - Some jobs may not support Easy Apply
   - LinkedIn may have changed their interface
   - Try applying manually for failed jobs

5. **Job Description Not Found**
   - Extension uses multiple fallback selectors for LinkedIn's dynamic DOM
   - Check browser console (F12) for detailed selector testing logs
   - LinkedIn frequently updates their class names and structure

### Debug Information

- Check the browser console (F12) for detailed error messages and selector testing
- Extension logs comprehensive debugging information during job scraping
- Background script logs available in Chrome Extensions page service worker
- Status messages in the extension provide real-time feedback
- Full job details view shows errors and processing status for each job

## Limitations

- **LinkedIn Only**: Currently works only with LinkedIn job postings
- **Easy Apply Only**: Can only submit applications through LinkedIn's Easy Apply feature
- **Rate Limits**: Respects LinkedIn's usage patterns to avoid being blocked
- **API Costs**: ChatGPT API usage incurs costs based on OpenAI's pricing

## Privacy and Security

- **Local Storage**: All data is stored locally in your browser
- **API Security**: Your ChatGPT API key is stored securely in Chrome's local storage
- **No Data Collection**: The extension doesn't collect or transmit your personal data
- **Open Source**: All code is transparent and auditable

## Development

### File Structure
```
fredd-ai-job-applier/
├── manifest.json          # Extension configuration
├── popup.html             # Main UI interface
├── popup.js               # Core application logic
├── background.js          # Service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── *-active.png       # Active state icons
└── README.md              # This file
```

### Key Components

- **Manifest V3**: Modern Chrome extension format
- **Content Scripts**: Injected for LinkedIn interaction
- **Storage API**: Persistent data storage
- **Tabs API**: Navigation and URL checking
- **Scripting API**: Dynamic code injection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Please check the license file for details.

## Support

For issues, questions, or feature requests:
1. Check the troubleshooting section
2. Review browser console errors
3. Create an issue in the repository

## Changelog

### Version 1.2
- Enhanced job description scraping with multiple fallback selectors
- Added full-page job details view with back navigation
- Implemented background processing continuation when popup is closed
- Fixed Content Security Policy compliance by removing inline event handlers
- Added comprehensive logging and debugging capabilities
- Improved LinkedIn DOM selector compatibility
- Added individual job processing controls

### Version 1.1
- Updated LinkedIn selectors for current DOM structure
- Fixed pause/start functionality issues
- Enhanced error handling and recovery
- Added "View Job Post" buttons for direct LinkedIn access
- Improved UI responsiveness and user experience

### Version 1.0
- Initial release
- Basic job scraping and application functionality
- AI-powered analysis and cover letter generation
- Modern tabbed interface
- Queue management system

---

**Disclaimer**: This extension is for educational and productivity purposes. Users are responsible for ensuring their usage complies with LinkedIn's terms of service and applicable laws. Always review applications before submission.
