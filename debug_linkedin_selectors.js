// Debug script to find current LinkedIn job selectors
// Run this in LinkedIn jobs page console to find current selectors

console.log('🔍 Debugging LinkedIn Job Selectors...');

// Test various job card selectors
const possibleSelectors = [
    '.job-search-card',
    '.jobs-search-results__list-item',
    '.job-card-container',
    '.jobs-search-results-list__item',
    '.job-card-list__item',
    '.scaffold-layout__list-item',
    '[data-job-id]',
    '.job-card',
    '.jobs-search__results-list li',
    '.jobs-search-results-list li'
];

console.log('Testing job card selectors:');
possibleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
    if (elements.length > 0) {
        console.log('  Sample element:', elements[0]);
    }
});

// Test title selectors
const titleSelectors = [
    '.job-search-card__title a',
    '.job-search-results-list__item-title a',
    '.job-card-container__link',
    '.job-card-list__title a',
    '[data-control-name="job_search_job_title"]',
    '.job-card__title a',
    '.jobs-search-results-list__item-title'
];

console.log('\nTesting title selectors:');
titleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
});

// Test company selectors
const companySelectors = [
    '.job-search-card__subtitle-link',
    '.job-search-results-list__item-company',
    '.job-card-container__company-name',
    '.job-card-list__company-name',
    '[data-control-name="job_search_company_name"]',
    '.job-card__company-name'
];

console.log('\nTesting company selectors:');
companySelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
});

// Find job links
const linkSelectors = [
    'a[href*="/jobs/view/"]',
    'a[data-job-id]',
    '.job-card-container__link',
    '.job-card-list__title a'
];

console.log('\nTesting link selectors:');
linkSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
});

// Try to extract a sample job
console.log('\n🎯 Attempting to extract sample job data:');
const firstJobCard = document.querySelector('.jobs-search-results-list li, .scaffold-layout__list-item, [data-job-id]');
if (firstJobCard) {
    console.log('Found job card:', firstJobCard);
    
    // Try to find title
    const titleElement = firstJobCard.querySelector('a[data-control-name*="job"], .job-card-list__title a, h3 a');
    console.log('Title element:', titleElement);
    console.log('Title text:', titleElement?.textContent?.trim());
    
    // Try to find company
    const companyElement = firstJobCard.querySelector('[data-control-name*="company"], .job-card-container__primary-description');
    console.log('Company element:', companyElement);
    console.log('Company text:', companyElement?.textContent?.trim());
    
    // Try to find link
    const linkElement = firstJobCard.querySelector('a[href*="/jobs/view/"]');
    console.log('Link element:', linkElement);
    console.log('Link href:', linkElement?.href);
} else {
    console.log('❌ No job cards found with any selector');
}

console.log('\n📋 Current page URL:', window.location.href);
console.log('📋 Page title:', document.title);
