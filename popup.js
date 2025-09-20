/**
 * AI Job Applier - Main JavaScript Logic
 * Handles all UI interactions, data persistence, and orchestrates the job application workflow
 */

/**
 * Logger class for comprehensive debugging
 */
class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        
        console.log(`[${level.toUpperCase()}] ${timestamp}: ${message}`, data || '');
        
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Store logs in chrome storage for persistence
        chrome.storage.local.set({ 'debug_logs': this.logs.slice(-100) });
    }

    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    debug(message, data) { this.log('debug', message, data); }

    getLogs() { return this.logs; }
    clearLogs() { 
        this.logs = [];
        chrome.storage.local.remove('debug_logs');
    }
}

class JobApplier {
    constructor() {
        this.currentJob = null;
        this.isProcessing = false;
        this.isPaused = false;
        this.logger = new Logger();
        this.init();
    }

    /**
     * Initialize the extension
     */
    async init() {
        this.logger.info('Initializing JobApplier extension');
        try {
            this.setupEventListeners();
            await this.loadUserData();
            await this.loadJobQueue();
            
            // Restore application state from background
            await this.restoreApplicationState();
            
            // Listen for background messages
            this.setupBackgroundMessageListener();
            
            this.updateUI();
            this.checkCurrentTab();
            this.logger.info('JobApplier initialization completed successfully');
        } catch (error) {
            this.logger.error('Failed to initialize JobApplier', error);
        }
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Settings form
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Main action buttons
        document.getElementById('start-application').addEventListener('click', () => this.startApplication());
        document.getElementById('pause-application').addEventListener('click', () => this.pauseApplication());
        document.getElementById('clear-data').addEventListener('click', () => this.clearAllData());

        // Review section buttons
        document.getElementById('confirm-apply').addEventListener('click', () => this.confirmApplication());
        document.getElementById('decline-apply').addEventListener('click', () => this.declineApplication());
        document.getElementById('navigate-to-job').addEventListener('click', () => this.navigateToJob());
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        // Update UI when switching to postings tab
        if (tabName === 'postings') {
            this.renderJobList();
        }
    }

    /**
     * Load user settings from storage
     */
    async loadUserData() {
        this.logger.info('Loading user data from storage');
        try {
            const result = await chrome.storage.local.get(['keywords', 'criteria', 'cv', 'llmToken']);
            
            if (result.keywords) document.getElementById('keywords').value = result.keywords;
            if (result.criteria) document.getElementById('criteria').value = result.criteria;
            if (result.cv) document.getElementById('cv').value = result.cv;
            if (result.llmToken) document.getElementById('llmToken').value = result.llmToken;
            
            this.logger.info('User data loaded successfully', {
                hasKeywords: !!result.keywords,
                hasCriteria: !!result.criteria,
                hasCV: !!result.cv,
                hasToken: !!result.llmToken
            });
        } catch (error) {
            this.logger.error('Failed to load user data', error);
        }
    }

    /**
     * Load job queue from storage
     */
    async loadJobQueue() {
        this.logger.info('Loading job queue from storage');
        try {
            const result = await chrome.storage.local.get(['jobQueue']);
            this.jobQueue = result.jobQueue || [];
            this.logger.info(`Job queue loaded: ${this.jobQueue.length} jobs`, {
                pending: this.jobQueue.filter(j => j.status === 'pending').length,
                reviewing: this.jobQueue.filter(j => j.status === 'reviewing').length,
                applied: this.jobQueue.filter(j => j.status === 'applied').length
            });
        } catch (error) {
            this.logger.error('Failed to load job queue', error);
            this.jobQueue = [];
        }
    }

    /**
     * Save user settings
     */
    async saveSettings() {
        this.logger.info('Saving user settings');
        try {
            const settings = {
                keywords: document.getElementById('keywords').value,
                criteria: document.getElementById('criteria').value,
                cv: document.getElementById('cv').value,
                llmToken: document.getElementById('llmToken').value
            };

            await chrome.storage.local.set(settings);
            this.logger.info('Settings saved successfully', settings);
            this.showStatus('Settings saved successfully!', 'success');
            
            // Auto-switch to summary tab after successful save
            setTimeout(() => {
                this.switchTab('summary');
                this.logger.info('Auto-switched to summary tab after settings save');
            }, 1000);
        } catch (error) {
            this.logger.error('Failed to save settings', error);
            this.showStatus('Failed to save settings', 'error');
        }
    }

    /**
     * Clear all data
     */
    async clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            await chrome.storage.local.clear();
            this.jobQueue = [];
            this.updateUI();
            this.showStatus('All data cleared successfully!', 'success');
            
            // Clear form fields
            document.getElementById('settings-form').reset();
        }
    }

    /**
     * Update the UI with current data
     */
    updateUI() {
        try {
            this.updateStats();
            this.renderJobList();
            this.updateButtons();
        } catch (error) {
            this.logger.error('Error updating UI', error);
        }
    }

    /**
     * Update statistics in summary tab
     */
    updateStats() {
        const stats = this.jobQueue.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
        }, {});

        document.getElementById('pending-count').textContent = stats.pending || 0;
        document.getElementById('applied-count').textContent = stats.applied || 0;
        document.getElementById('skipped-count').textContent = stats.skipped || 0;
        document.getElementById('reviewing-count').textContent = stats.reviewing || 0;
    }

    /**
     * Render job list in postings tab
     */
    renderJobList() {
        const jobListContainer = document.getElementById('job-list');
        let noJobsMessage = document.getElementById('no-jobs');

        // Check if elements exist before manipulating them
        if (!jobListContainer) {
            this.logger.error('job-list container not found in DOM');
            return;
        }

        // Create no-jobs message if it doesn't exist
        if (!noJobsMessage) {
            this.logger.warn('no-jobs message element not found, creating it');
            noJobsMessage = document.createElement('div');
            noJobsMessage.id = 'no-jobs';
            noJobsMessage.className = 'text-center';
            noJobsMessage.style.cssText = 'padding: 40px; color: #64748b;';
            noJobsMessage.textContent = 'No jobs found. Start the application process to begin collecting job postings.';
        }

        if (this.jobQueue.length === 0) {
            noJobsMessage.style.display = 'block';
            jobListContainer.innerHTML = '';
            jobListContainer.appendChild(noJobsMessage);
            return;
        }

        noJobsMessage.style.display = 'none';
        jobListContainer.innerHTML = '';

        this.jobQueue.forEach((job, index) => {
            try {
                const jobItem = this.createJobItem(job, index);
                if (jobItem) {
                    jobListContainer.appendChild(jobItem);
                }
            } catch (error) {
                this.logger.error(`Error creating job item at index ${index}`, error);
            }
        });
    }

    /**
     * Create a job item element
     */
    createJobItem(job, index) {
        const jobItem = document.createElement('div');
        jobItem.className = 'job-item';
        jobItem.dataset.index = index;

        jobItem.innerHTML = `
            <div class="job-header">
                <div class="job-title">${job.jobTitle}</div>
                <div class="job-star ${job.starred ? 'starred' : ''}" data-index="${index}">★</div>
            </div>
            <div class="job-company">${job.company}</div>
            <div class="job-status status-${job.status}">${job.status}</div>
            ${job.matchScore ? `<div class="job-details">Match Score: ${job.matchScore}%</div>` : ''}
            <div class="job-actions">
                <button class="btn btn-secondary btn-small view-job-btn" data-index="${index}">View Job Post</button>
                ${job.status === 'pending' ? `<button class="btn btn-primary btn-small process-job-btn" data-index="${index}">Process Job</button>` : ''}
            </div>
        `;

        // Add click listeners
        jobItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('job-star') && !e.target.classList.contains('btn')) {
                this.selectJob(index);
            }
        });

        jobItem.querySelector('.job-star').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleJobStar(index);
        });

        // View job post button
        const viewJobBtn = jobItem.querySelector('.view-job-btn');
        if (viewJobBtn) {
            viewJobBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.viewJobPost(index);
            });
        }

        // Process job button
        const processJobBtn = jobItem.querySelector('.process-job-btn');
        if (processJobBtn) {
            processJobBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.processSpecificJob(index);
            });
        }

        return jobItem;
    }

    /**
     * Show full job details view
     */
    showJobDetails(job, index) {
        this.logger.info('Showing job details', { job: job.jobTitle, index });
        
        // Hide job list and show job details
        const jobListContainer = document.getElementById('job-list');
        const jobDetailsContainer = document.getElementById('job-details');
        const jobDetailsContent = document.getElementById('job-details-content');
        
        if (!jobDetailsContainer || !jobDetailsContent) {
            this.logger.error('Job details elements not found');
            return;
        }
        
        // Create detailed job view
        jobDetailsContent.innerHTML = `
            <div class="job-detail-header">
                <button id="back-to-list" class="btn btn-secondary btn-small">← Back to List</button>
                <div class="job-actions" style="margin-top: 12px;">
                    <button id="view-job-post-${index}" class="btn btn-secondary btn-small">View Job Post</button>
                    ${job.status === 'pending' ? `<button id="process-job-${index}" class="btn btn-primary btn-small">Process Job</button>` : ''}
                    <button id="toggle-star-${index}" class="btn btn-secondary btn-small job-star ${job.starred ? 'starred' : ''}">★</button>
                </div>
            </div>
            
            <div class="job-detail-content">
                <h2 class="job-title">${job.jobTitle}</h2>
                <h3 class="job-company">${job.company}</h3>
                <div class="job-status status-${job.status}">${job.status}</div>
                
                <div class="job-info-section">
                    <h4>Job Information</h4>
                    <p><strong>Date Found:</strong> ${new Date(job.dateFound).toLocaleDateString()}</p>
                    <p><strong>Job URL:</strong> <a href="${job.url}" target="_blank">${job.url}</a></p>
                    ${job.matchScore ? `<p><strong>Match Score:</strong> <span class="match-score score-${job.matchScore >= 70 ? 'high' : job.matchScore >= 50 ? 'medium' : 'low'}">${job.matchScore}%</span></p>` : ''}
                </div>
                
                ${job.description ? `
                <div class="job-info-section">
                    <h4>Job Description</h4>
                    <div class="job-description">${job.description}</div>
                </div>
                ` : ''}
                
                ${job.coverLetter ? `
                <div class="job-info-section">
                    <h4>Generated Cover Letter</h4>
                    <div class="cover-letter-content">${job.coverLetter}</div>
                </div>
                ` : ''}
                
                ${job.error ? `
                <div class="job-info-section error">
                    <h4>Error</h4>
                    <p class="error-message">${job.error}</p>
                </div>
                ` : ''}
            </div>
        `;
        
        // Show details view and hide list
        jobListContainer.style.display = 'none';
        jobDetailsContainer.classList.remove('hidden');
        
        // Add event listeners for job detail buttons
        document.getElementById('back-to-list').addEventListener('click', () => {
            this.hideJobDetails();
        });
        
        // View job post button
        const viewJobPostBtn = document.getElementById(`view-job-post-${index}`);
        if (viewJobPostBtn) {
            viewJobPostBtn.addEventListener('click', () => {
                this.viewJobPost(index);
            });
        }
        
        // Process job button
        const processJobBtn = document.getElementById(`process-job-${index}`);
        if (processJobBtn) {
            processJobBtn.addEventListener('click', () => {
                this.processSpecificJob(index);
            });
        }
        
        // Toggle star button
        const toggleStarBtn = document.getElementById(`toggle-star-${index}`);
        if (toggleStarBtn) {
            toggleStarBtn.addEventListener('click', () => {
                this.toggleJobStar(index);
                // Update the star display
                toggleStarBtn.classList.toggle('starred');
            });
        }
    }
    
    /**
     * Hide job details and return to list
     */
    hideJobDetails() {
        this.logger.info('Hiding job details, returning to list');
        
        const jobListContainer = document.getElementById('job-list');
        const jobDetailsContainer = document.getElementById('job-details');
        
        if (jobListContainer && jobDetailsContainer) {
            jobListContainer.style.display = 'block';
            jobDetailsContainer.classList.add('hidden');
        }
        
        // Clear selection
        document.querySelectorAll('.job-item').forEach(item => {
            item.classList.remove('selected');
        });
    }

    /**
     * Update background service with current application state
     */
    async updateBackgroundState() {
        const state = {
            isProcessing: this.isProcessing,
            currentJob: this.currentJob,
            jobQueue: this.jobQueue
        };
        
        try {
            await chrome.runtime.sendMessage({
                type: 'UPDATE_APPLICATION_STATE',
                state: state
            });
            this.logger.debug('Background state updated', state);
        } catch (error) {
            this.logger.error('Failed to update background state', error);
        }
    }

    /**
     * Restore application state from background service
     */
    async restoreApplicationState() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_APPLICATION_STATE'
            });
            
            if (response && response.state) {
                const state = response.state;
                this.isProcessing = state.isProcessing || false;
                this.currentJob = state.currentJob || null;
                
                if (this.isProcessing && this.currentJob) {
                    this.logger.info('Restored processing state', {
                        job: this.currentJob.jobTitle,
                        isProcessing: this.isProcessing
                    });
                    
                    // Continue processing if needed
                    setTimeout(() => {
                        this.continueProcessing();
                    }, 1000);
                }
            }
        } catch (error) {
            this.logger.error('Failed to restore application state', error);
        }
    }

    /**
     * Setup listener for background messages
     */
    setupBackgroundMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.logger.debug('Received background message', message);
            
            if (message.type === 'CONTINUE_PROCESSING' && message.job) {
                this.logger.info('Background requested to continue processing', message.job);
                this.currentJob = message.job;
                this.isProcessing = true;
                this.continueProcessing();
            }
            
            return true;
        });
    }

    /**
     * Continue processing after popup was closed/reopened
     */
    async continueProcessing() {
        if (!this.isProcessing || !this.currentJob) {
            return;
        }
        
        this.logger.info('Continuing job processing', this.currentJob);
        this.updateButtons();
        this.showStatus(`Continuing processing: ${this.currentJob.jobTitle}`, 'info');
        
        // Continue with the job queue processing
        await this.processJobQueue();
    }

    /**
     * Select a job to view details
     */
    selectJob(index) {
        this.logger.info(`Selecting job at index ${index}`);
        
        // Remove previous selection
        document.querySelectorAll('.job-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to clicked item
        document.querySelector(`[data-index="${index}"]`).classList.add('selected');

        // Show job details
        const job = this.jobQueue[index];
        this.logger.info('Selected job details', job);
        
        // Show job details in full page view
        this.showJobDetails(job, index);
    }

    /**
     * View job post in new tab
     */
    async viewJobPost(index) {
        const job = this.jobQueue[index];
        this.logger.info(`Opening job post for: ${job.jobTitle}`, { url: job.url });
        
        try {
            await chrome.tabs.create({ url: job.url });
            this.logger.info('Job post opened successfully');
        } catch (error) {
            this.logger.error('Failed to open job post', error);
            this.showStatus('Failed to open job post', 'error');
        }
    }

    /**
     * Process a specific job
     */
    async processSpecificJob(index) {
        const job = this.jobQueue[index];
        this.logger.info(`Processing specific job: ${job.jobTitle}`);
        
        if (job.status !== 'pending') {
            this.logger.warn('Job is not in pending status', { status: job.status });
            return;
        }
        
        this.currentJob = job;
        this.isProcessing = true;
        
        // Update background state
        await this.updateBackgroundState();
        
        // Update UI to show processing
        this.updateButtons();
        this.showStatus(`Processing job: ${job.jobTitle}`, 'info');
        
        // Start the job processing workflow
        await this.processJobQueue();
    }

    /**
     * Toggle star status for a job
     */
    async toggleJobStar(index) {
        this.jobQueue[index].starred = !this.jobQueue[index].starred;
        await this.saveJobQueue();
        this.renderJobList();
    }

    /**
     * Update button states
     */
    updateButtons() {
        const startBtn = document.getElementById('start-application');
        const pauseBtn = document.getElementById('pause-application');
        const startText = document.getElementById('start-btn-text');
        const startLoading = document.getElementById('start-btn-loading');

        if (this.isProcessing) {
            startBtn.disabled = true;
            startText.textContent = 'Processing...';
            startLoading.classList.remove('hidden');
            pauseBtn.classList.remove('hidden');
        } else {
            startBtn.disabled = false;
            startText.textContent = 'Start Application';
            startLoading.classList.add('hidden');
            pauseBtn.classList.add('hidden');
        }
    }

    /**
     * Check if current tab is LinkedIn
     */
    async checkCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const isLinkedIn = tab.url && tab.url.includes('linkedin.com');
            
            if (!isLinkedIn) {
                this.showStatus('Please navigate to LinkedIn to use this extension.', 'info');
            }
        } catch (error) {
            console.error('Error checking current tab:', error);
        }
    }

    /**
     * Start the job application process
     */
    async startApplication() {
        this.logger.info('Starting job application process');
        
        // Validate settings
        const settings = await chrome.storage.local.get(['keywords', 'criteria', 'cv', 'llmToken']);
        
        if (!settings.keywords || !settings.criteria || !settings.cv || !settings.llmToken) {
            this.logger.warn('Missing required settings');
            this.showStatus('Please fill in all settings before starting.', 'error');
            this.switchTab('settings');
            return;
        }

        // Check if we're on LinkedIn
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.url || !tab.url.includes('linkedin.com')) {
            this.logger.warn('Not on LinkedIn', { url: tab.url });
            this.showStatus('Please navigate to LinkedIn first.', 'error');
            return;
        }

        this.isProcessing = true;
        this.isPaused = false;
        
        // Update background service with application state
        await this.updateBackgroundState();
        
        this.updateButtons();
        this.showStatus('Starting job application process...', 'info');

        try {
            // Inject the job scraping script
            await this.injectJobScrapingScript(settings.keywords);
            this.logger.info('Job scraping script injected successfully');
        } catch (error) {
            this.logger.error('Error starting application', error);
            this.showStatus('Error starting application process.', 'error');
            this.isProcessing = false;
            this.updateButtons();
            await this.updateBackgroundState();
        }
    }

    /**
     * Pause the application process
     */
    async pauseApplication() {
        this.isPaused = true;
        this.isProcessing = false;
        
        // Update background state
        await this.updateBackgroundState();
        
        this.updateButtons();
        this.showStatus('Application process paused.', 'info');
        this.logger.info('Application process paused');
    }

    /**
     * Inject script to scrape jobs from LinkedIn
     */
    async injectJobScrapingScript(keywords) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: function(keywords) {
                // Navigate to jobs search if not already there
                if (!window.location.href.includes('/jobs/search')) {
                    window.location.href = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}`;
                    return;
                }

                // Wait for page to load and then scrape jobs
                setTimeout(() => {
                    const jobs = [];
                    // Updated selectors for current LinkedIn structure
                    const jobCards = document.querySelectorAll('.jobs-search-results-list li, .scaffold-layout__list-item, [data-job-id], .job-card-container, .jobs-search__results-list li');

                    console.log(`Found ${jobCards.length} job cards`);

                    jobCards.forEach((card, index) => {
                        try {
                            // Updated selectors for title
                            const titleElement = card.querySelector('a[data-control-name*="job"], .job-card-list__title a, h3 a, .job-card-container__link, [data-control-name="job_search_job_title"]');
                            
                            // Updated selectors for company
                            const companyElement = card.querySelector('[data-control-name*="company"], .job-card-container__primary-description, .job-card-container__company-name, .artdeco-entity-lockup__subtitle');
                            
                            // Updated selectors for job link
                            const linkElement = card.querySelector('a[href*="/jobs/view/"], a[data-job-id]');

                            console.log(`Card ${index}:`, {
                                title: titleElement?.textContent?.trim(),
                                company: companyElement?.textContent?.trim(),
                                link: linkElement?.href
                            });

                            if (titleElement && linkElement) {
                                const jobUrl = linkElement.href;
                                let jobId = jobUrl.match(/\/jobs\/view\/(\d+)/)?.[1];
                                
                                // Try alternative job ID extraction
                                if (!jobId) {
                                    jobId = linkElement.getAttribute('data-job-id') || 
                                           card.getAttribute('data-job-id') ||
                                           jobUrl.match(/jobId=(\d+)/)?.[1];
                                }

                                if (jobId) {
                                    const companyText = companyElement?.textContent?.trim() || 'Unknown Company';
                                    
                                    jobs.push({
                                        jobTitle: titleElement.textContent.trim(),
                                        company: companyText,
                                        url: jobUrl,
                                        post_id: jobId,
                                        status: 'pending',
                                        starred: false,
                                        dateFound: new Date().toISOString()
                                    });
                                    
                                    console.log(`✅ Added job: ${titleElement.textContent.trim()} at ${companyText}`);
                                } else {
                                    console.log(`❌ No job ID found for: ${titleElement.textContent.trim()}`);
                                }
                            } else {
                                console.log(`❌ Missing elements - Title: ${!!titleElement}, Link: ${!!linkElement}`);
                            }
                        } catch (error) {
                            console.error('Error scraping job card:', error);
                        }
                    });

                    // Send results back to extension
                    chrome.runtime.sendMessage({
                        type: 'JOBS_SCRAPED',
                        jobs: jobs
                    });
                }, 2000);
            },
            args: [keywords]
        });

        // Listen for results from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'JOBS_SCRAPED') {
                this.handleScrapedJobs(message.jobs);
            } else if (message.type === 'JOB_DESCRIPTION_SCRAPED') {
                this.handleJobDescription(message.jobId, message.description);
            } else if (message.type === 'APPLICATION_SUBMITTED') {
                this.handleApplicationSubmitted(message.jobId, message.success);
            }
        });
    }

    /**
     * Content script function to scrape LinkedIn jobs
     * This function runs in the context of the LinkedIn page
     */
    static scrapeLinkedInJobs(keywords) {
        // Navigate to jobs search if not already there
        if (!window.location.href.includes('/jobs/search')) {
            window.location.href = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}`;
            return;
        }

        // Wait for page to load and then scrape jobs
        setTimeout(() => {
            const jobs = [];
            const jobCards = document.querySelectorAll('.job-search-card, .jobs-search-results-list__item');

            jobCards.forEach((card, index) => {
                try {
                    const titleElement = card.querySelector('.job-search-card__title a, .job-search-results-list__item-title a');
                    const companyElement = card.querySelector('.job-search-card__subtitle-link, .job-search-results-list__item-company');
                    const linkElement = card.querySelector('a[href*="/jobs/view/"]');

                    if (titleElement && companyElement && linkElement) {
                        const jobUrl = linkElement.href;
                        const jobId = jobUrl.match(/\/jobs\/view\/(\d+)/)?.[1];

                        if (jobId) {
                            jobs.push({
                                jobTitle: titleElement.textContent.trim(),
                                company: companyElement.textContent.trim(),
                                url: jobUrl,
                                post_id: jobId,
                                status: 'pending',
                                starred: false,
                                dateFound: new Date().toISOString()
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error scraping job card:', error);
                }
            });

            // Send results back to extension
            chrome.runtime.sendMessage({
                type: 'JOBS_SCRAPED',
                jobs: jobs
            });
        }, 2000);
    }

    /**
     * Handle scraped jobs from content script
     */
    async handleScrapedJobs(newJobs) {
        if (!newJobs || newJobs.length === 0) {
            this.showStatus('No jobs found. Try different keywords or check if you\'re on the jobs page.', 'error');
            this.isProcessing = false;
            this.updateButtons();
            return;
        }

        // Filter out duplicates based on post_id
        const existingIds = new Set(this.jobQueue.map(job => job.post_id));
        const uniqueJobs = newJobs.filter(job => !existingIds.has(job.post_id));

        if (uniqueJobs.length === 0) {
            this.showStatus('No new jobs found. All jobs are already in the queue.', 'info');
            this.isProcessing = false;
            this.updateButtons();
            return;
        }

        // Add new jobs to queue
        this.jobQueue.push(...uniqueJobs);
        await this.saveJobQueue();
        
        this.showStatus(`Found ${uniqueJobs.length} new jobs. Starting to process...`, 'success');
        this.updateUI();

        // Start processing the queue
        this.processJobQueue();
    }

    /**
     * Process the job queue
     */
    async processJobQueue() {
        if (this.isPaused) return;

        // Find next pending job
        const nextJob = this.jobQueue.find(job => job.status === 'pending');
        
        if (!nextJob) {
            this.showStatus('All jobs have been processed!', 'success');
            this.isProcessing = false;
            this.updateButtons();
            return;
        }

        this.currentJob = nextJob;
        this.showStatus(`Processing: ${nextJob.jobTitle} at ${nextJob.company}`, 'info');

        try {
            // Scrape full job description
            await this.scrapeJobDescription(nextJob);
        } catch (error) {
            console.error('Error processing job:', error);
            nextJob.status = 'skipped';
            nextJob.error = error.message;
            await this.saveJobQueue();
            this.updateUI();
            
            // Continue with next job
            setTimeout(() => this.processJobQueue(), 1000);
        }
    }

    /**
     * Scrape job description for a specific job
     */
    async scrapeJobDescription(job) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Navigate to job posting
        await chrome.tabs.update(tab.id, { url: job.url });

        // Wait for navigation and inject scraping script
        setTimeout(async () => {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: function(jobId) {
                    setTimeout(() => {
                        try {
                            // Updated selectors based on actual LinkedIn DOM structure
                            const descriptionSelectors = [
                                // New LinkedIn structure with dynamic class names
                                'div[class*="e47ea9c0"] p[class*="f964d113"]',
                                'span[data-testid="expandable-text-box"]',
                                'div[class*="_2313fa67"] span[class*="_03951757"]',
                                // Fallback to more generic selectors
                                '[data-testid="expandable-text-box"]',
                                'div[class*="job"] span[tabindex="-1"]',
                                // Original selectors as fallback
                                '.jobs-search__job-details--container .jobs-description-content__text',
                                '.jobs-description-content__text',
                                '.jobs-box__html-content',
                                '.jobs-description',
                                '.job-details-jobs-unified-top-card__job-description',
                                '.jobs-unified-top-card__job-description',
                                '[data-job-details="jobDescription"]',
                                '.job-view-layout .jobs-description',
                                '.jobs-search__job-details .jobs-description-content__text'
                            ];

                            let description = '';
                            console.log('Searching for job description with selectors:', descriptionSelectors);
                            
                            for (const selector of descriptionSelectors) {
                                const element = document.querySelector(selector);
                                console.log(`Selector "${selector}":`, element ? 'Found' : 'Not found');
                                if (element) {
                                    description = element.textContent.trim();
                                    console.log('Description found with selector:', selector);
                                    console.log('Description length:', description.length);
                                    break;
                                }
                            }
                            
                            // If still no description, use "About the job" heading approach
                            if (!description) {
                                console.log('No description found with specific selectors, trying "About the job" approach...');
                                
                                // Find "About the job" heading
                                const aboutJobElement = Array.from(document.querySelectorAll('h2, h3, div')).find(el => 
                                    el.textContent && el.textContent.toLowerCase().includes('about the job')
                                );
                                
                                if (aboutJobElement) {
                                    console.log('Found "About the job" element:', aboutJobElement);
                                    
                                    // Get the parent container of the heading
                                    let container = aboutJobElement.parentElement;
                                    while (container && !container.querySelector('span[tabindex="-1"], span[data-testid="expandable-text-box"]')) {
                                        container = container.parentElement;
                                        if (container === document.body) break; // Prevent infinite loop
                                    }
                                    
                                    if (container) {
                                        // Look for the expandable content span
                                        const expandableSpan = container.querySelector('span[tabindex="-1"], span[data-testid="expandable-text-box"]');
                                        if (expandableSpan) {
                                            description = expandableSpan.textContent.trim();
                                            console.log('Found full description via "About the job" container search');
                                            console.log('Description preview:', description.substring(0, 200) + '...');
                                        }
                                    }
                                }
                                
                                // Alternative approach: look for the specific structure from your DOM
                                if (!description) {
                                    console.log('Trying alternative structure search...');
                                    
                                    // Look for the specific pattern: div with multiple classes containing p with expandable span
                                    const containers = document.querySelectorAll('div[class*="e47ea9c0"], div[class*="_2313fa67"]');
                                    for (const container of containers) {
                                        const expandableSpan = container.querySelector('span[tabindex="-1"][data-testid="expandable-text-box"]');
                                        if (expandableSpan && expandableSpan.textContent.length > 100) { // Ensure it's substantial content
                                            description = expandableSpan.textContent.trim();
                                            console.log('Found description via container class search');
                                            break;
                                        }
                                    }
                                }
                                
                                // Last resort: any substantial expandable text
                                if (!description) {
                                    const expandableElements = document.querySelectorAll('span[tabindex="-1"]');
                                    for (const element of expandableElements) {
                                        const text = element.textContent.trim();
                                        if (text.length > 200) { // Only consider substantial content
                                            description = text;
                                            console.log('Found description via substantial content search');
                                            break;
                                        }
                                    }
                                }
                            }

                            if (!description) {
                                throw new Error('Could not find job description');
                            }

                            chrome.runtime.sendMessage({
                                type: 'JOB_DESCRIPTION_SCRAPED',
                                jobId: jobId,
                                description: description
                            });
                        } catch (error) {
                            chrome.runtime.sendMessage({
                                type: 'JOB_DESCRIPTION_SCRAPED',
                                jobId: jobId,
                                error: error.message
                            });
                        }
                    }, 2000);
                },
                args: [job.post_id]
            });
        }, 3000);
    }

    /**
     * Content script to scrape job description (legacy - not used)
     */
    static scrapeJobDescriptionContent(jobId) {
        setTimeout(() => {
            try {
                // Try multiple selectors for job description
                const descriptionSelectors = [
                    '.job-search-description-module__container',
                    '.jobs-description-content__text',
                    '.jobs-box__html-content',
                    '.job-view-layout .jobs-description'
                ];

                let description = '';
                for (const selector of descriptionSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        description = element.textContent.trim();
                        break;
                    }
                }

                if (!description) {
                    throw new Error('Could not find job description');
                }

                chrome.runtime.sendMessage({
                    type: 'JOB_DESCRIPTION_SCRAPED',
                    jobId: jobId,
                    description: description
                });
            } catch (error) {
                chrome.runtime.sendMessage({
                    type: 'JOB_DESCRIPTION_SCRAPED',
                    jobId: jobId,
                    error: error.message
                });
            }
        }, 2000);
    }

    /**
     * Handle scraped job description
     */
    async handleJobDescription(jobId, description, error) {
        if (error) {
            console.error('Error scraping job description:', error);
            const job = this.jobQueue.find(j => j.post_id === jobId);
            if (job) {
                job.status = 'skipped';
                job.error = error;
                await this.saveJobQueue();
                this.updateUI();
                
                // Continue with next job
                setTimeout(() => this.processJobQueue(), 1000);
            }
            return;
        }

        // Update job with description
        const job = this.jobQueue.find(j => j.post_id === jobId);
        if (job) {
            job.description = description;
            await this.saveJobQueue();
            
            // Analyze with AI
            await this.analyzeJobWithAI(job);
        }
    }

    /**
     * Analyze job with ChatGPT API
     */
    async analyzeJobWithAI(job) {
        try {
            const settings = await chrome.storage.local.get(['cv', 'criteria', 'llmToken']);
            
            const prompt = `
You are an AI assistant helping with job applications. Please analyze this job posting and provide a response in JSON format.

Job Title: ${job.jobTitle}
Company: ${job.company}
Job Description: ${job.description}

User's CV: ${settings.cv}
User's Criteria: ${settings.criteria}

Please provide a JSON response with:
1. matchScore: A number from 0-100 indicating how well this job matches the user's profile and criteria
2. coverLetter: A personalized cover letter for this specific job (keep it concise, 2-3 paragraphs)

Format your response as valid JSON only:
{
  "matchScore": number,
  "coverLetter": "string"
}
`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.llmToken}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = JSON.parse(data.choices[0].message.content);

            // Update job with AI analysis
            job.matchScore = aiResponse.matchScore;
            job.coverLetter = aiResponse.coverLetter;
            job.status = 'reviewing';
            
            await this.saveJobQueue();
            this.updateUI();

            // Show review section
            this.showReviewSection(job);

        } catch (error) {
            this.logger.error('Error analyzing job with AI', error);
            job.status = 'skipped';
            job.error = `AI analysis failed: ${error.message}`;
            await this.saveJobQueue();
            
            // Only update UI if DOM elements are available
            try {
                this.updateUI();
            } catch (uiError) {
                this.logger.error('Error updating UI after AI analysis failure', uiError);
            }
            
            // Continue with next job
            setTimeout(() => this.processJobQueue(), 1000);
        }
    }

    /**
     * Show the review section with job analysis
     */
    showReviewSection(job) {
        const reviewSection = document.getElementById('review-section');
        const reviewJobTitle = document.getElementById('review-job-title');
        const reviewJobCompany = document.getElementById('review-job-company');
        const reviewMatchScore = document.getElementById('review-match-score');
        const reviewCoverLetter = document.getElementById('review-cover-letter');

        reviewJobTitle.textContent = job.jobTitle;
        reviewJobCompany.textContent = job.company;
        reviewCoverLetter.value = job.coverLetter;

        // Set match score with appropriate styling
        const scoreClass = job.matchScore >= 70 ? 'score-high' : 
                          job.matchScore >= 50 ? 'score-medium' : 'score-low';
        reviewMatchScore.innerHTML = `<span class="match-score ${scoreClass}">Match Score: ${job.matchScore}%</span>`;

        reviewSection.classList.add('active');
        
        // Switch to summary tab to show review
        this.switchTab('summary');
        
        // Pause processing
        this.isProcessing = false;
        this.updateButtons();
        
        this.showStatus('Please review the generated application and decide whether to proceed.', 'info');
    }

    /**
     * Confirm and apply to the job
     */
    async confirmApplication() {
        if (!this.currentJob) return;

        this.hideReviewSection();
        this.currentJob.status = 'applying';
        await this.saveJobQueue();
        this.updateUI();

        this.showStatus(`Applying to ${this.currentJob.jobTitle}...`, 'info');

        try {
            await this.submitApplication(this.currentJob);
        } catch (error) {
            console.error('Error submitting application:', error);
            this.currentJob.status = 'skipped';
            this.currentJob.error = error.message;
            await this.saveJobQueue();
            this.updateUI();
        }

        // Continue processing queue
        this.isProcessing = true;
        this.updateButtons();
        setTimeout(() => this.processJobQueue(), 2000);
    }

    /**
     * Decline the job application
     */
    async declineApplication() {
        if (!this.currentJob) return;

        this.hideReviewSection();
        this.currentJob.status = 'skipped';
        await this.saveJobQueue();
        this.updateUI();

        this.showStatus(`Skipped ${this.currentJob.jobTitle}`, 'info');

        // Continue processing queue
        this.isProcessing = true;
        this.updateButtons();
        setTimeout(() => this.processJobQueue(), 1000);
    }

    /**
     * Navigate to the job posting
     */
    navigateToJob() {
        if (this.currentJob) {
            chrome.tabs.create({ url: this.currentJob.url });
        }
    }

    /**
     * Hide the review section
     */
    hideReviewSection() {
        document.getElementById('review-section').classList.remove('active');
    }

    /**
     * Submit application to LinkedIn
     */
    async submitApplication(job) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Navigate to job posting if not already there
        if (!tab.url.includes(job.post_id)) {
            await chrome.tabs.update(tab.id, { url: job.url });
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Inject application submission script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: function(jobId, coverLetterText) {
                setTimeout(() => {
                    try {
                        // Updated selectors for Easy Apply button
                        const easyApplyButton = document.querySelector(
                            '.jobs-apply-button--top-card, ' +
                            '.jobs-apply-button, ' +
                            '.jobs-s-apply button, ' +
                            '[data-control-name="jobdetails_topcard_inapply"], ' +
                            '.jobs-unified-top-card__primary-description-action button, ' +
                            'button[aria-label*="Easy Apply"], ' +
                            'button[data-control-name*="apply"], ' +
                            '.artdeco-button--primary[aria-label*="Apply"]'
                        );
                        
                        if (!easyApplyButton) {
                            throw new Error('Easy Apply button not found');
                        }

                        // Click Easy Apply
                        easyApplyButton.click();

                        // Wait for modal to open and fill form
                        setTimeout(() => {
                            try {
                                // Updated selectors for cover letter field
                                const coverLetterField = document.querySelector(
                                    'textarea[name*="coverLetter"], ' +
                                    'textarea[id*="coverLetter"], ' +
                                    '.jobs-easy-apply-form-section__grouping textarea, ' +
                                    'textarea[placeholder*="cover letter"], ' +
                                    'textarea[aria-label*="cover letter"], ' +
                                    '.artdeco-text-input--input[data-test-text-entity-list-form-component]'
                                );
                                
                                if (coverLetterField) {
                                    coverLetterField.value = coverLetterText;
                                    coverLetterField.dispatchEvent(new Event('input', { bubbles: true }));
                                    coverLetterField.dispatchEvent(new Event('change', { bubbles: true }));
                                }

                                // Updated selectors for submit button
                                const submitButton = document.querySelector(
                                    '.jobs-easy-apply-modal button[type="submit"], ' +
                                    '.jobs-easy-apply-modal .artdeco-button--primary, ' +
                                    'button[aria-label="Submit application"], ' +
                                    'button[data-control-name="continue_unify"], ' +
                                    '.artdeco-button--primary[aria-label*="Submit"], ' +
                                    '.jobs-easy-apply-content button[type="submit"]'
                                );
                                
                                if (submitButton && !submitButton.disabled) {
                                    submitButton.click();
                                    
                                    chrome.runtime.sendMessage({
                                        type: 'APPLICATION_SUBMITTED',
                                        jobId: jobId,
                                        success: true
                                    });
                                } else {
                                    throw new Error('Submit button not found or disabled');
                                }
                            } catch (error) {
                                chrome.runtime.sendMessage({
                                    type: 'APPLICATION_SUBMITTED',
                                    jobId: jobId,
                                    success: false,
                                    error: error.message
                                });
                            }
                        }, 2000);

                    } catch (error) {
                        chrome.runtime.sendMessage({
                            type: 'APPLICATION_SUBMITTED',
                            jobId: jobId,
                            success: false,
                            error: error.message
                        });
                    }
                }, 1000);
            },
            args: [job.post_id, job.coverLetter || '']
        });
    }

    /**
     * Content script to submit LinkedIn application
     */
    static submitLinkedInApplication(jobId, coverLetter) {
        setTimeout(() => {
            try {
                // Look for Easy Apply button
                const easyApplyButton = document.querySelector('.jobs-apply-button, .jobs-s-apply button, [data-control-name="jobdetails_topcard_inapply"]');
                
                if (!easyApplyButton) {
                    throw new Error('Easy Apply button not found');
                }

                // Click Easy Apply
                easyApplyButton.click();

                // Wait for modal to open and fill form
                setTimeout(() => {
                    try {
                        // Look for cover letter textarea
                        const coverLetterField = document.querySelector('textarea[name*="coverLetter"], textarea[id*="coverLetter"], .jobs-easy-apply-form-section__grouping textarea');
                        
                        if (coverLetterField) {
                            coverLetterField.value = coverLetter;
                            coverLetterField.dispatchEvent(new Event('input', { bubbles: true }));
                        }

                        // Look for submit button
                        const submitButton = document.querySelector('.jobs-easy-apply-modal button[type="submit"], .jobs-easy-apply-modal .artdeco-button--primary');
                        
                        if (submitButton && !submitButton.disabled) {
                            submitButton.click();
                            
                            chrome.runtime.sendMessage({
                                type: 'APPLICATION_SUBMITTED',
                                jobId: jobId,
                                success: true
                            });
                        } else {
                            throw new Error('Submit button not found or disabled');
                        }
                    } catch (error) {
                        chrome.runtime.sendMessage({
                            type: 'APPLICATION_SUBMITTED',
                            jobId: jobId,
                            success: false,
                            error: error.message
                        });
                    }
                }, 2000);

            } catch (error) {
                chrome.runtime.sendMessage({
                    type: 'APPLICATION_SUBMITTED',
                    jobId: jobId,
                    success: false,
                    error: error.message
                });
            }
        }, 1000);
    }

    /**
     * Handle application submission result
     */
    async handleApplicationSubmitted(jobId, success, error) {
        const job = this.jobQueue.find(j => j.post_id === jobId);
        if (!job) return;

        if (success) {
            job.status = 'applied';
            job.appliedDate = new Date().toISOString();
            this.showStatus(`Successfully applied to ${job.jobTitle}!`, 'success');
        } else {
            job.status = 'skipped';
            job.error = error || 'Application submission failed';
            this.showStatus(`Failed to apply to ${job.jobTitle}: ${error}`, 'error');
        }

        await this.saveJobQueue();
        this.updateUI();
    }

    /**
     * Save job queue to storage
     */
    async saveJobQueue() {
        await chrome.storage.local.set({ jobQueue: this.jobQueue });
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = type;
        
        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusElement.className = '';
                statusElement.textContent = '';
            }, 5000);
        }
    }
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.jobApplier = new JobApplier();
});
