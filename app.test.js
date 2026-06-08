const fs = require('fs');
const path = require('path');

describe('Prompts Library Error Handling', () => {
    let originalFetch;

    beforeAll(() => {
        // Save original fetch
        originalFetch = global.fetch;
    });

    afterAll(() => {
        // Restore original fetch
        global.fetch = originalFetch;
    });

    beforeEach(() => {
        // Load the HTML into JSDOM before each test to reset DOM
        const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
        // Setting to body/head is slightly cleaner than documentElement to avoid doctype issues
        // We can just use the DOMParser if we want, or simple document.documentElement.innerHTML
        // A cleaner approach is to recreate the document body and head

        // JSDOM creates an empty document, so we can just set innerHTML on documentElement
        // safely but stripping DOCTYPE if present makes it cleaner
        const cleanHtml = html.replace(/<!DOCTYPE html>/gi, '');
        document.documentElement.innerHTML = cleanHtml;

        // Reset fetch mock before each test
        global.fetch = jest.fn();
    });

    afterEach(() => {
        // Clear modules cache to avoid multiple event listeners being added to document
        // if require('./app.js') is called in multiple tests
        jest.resetModules();

        // Clear document body and head completely to prevent multiple event listeners
        document.documentElement.innerHTML = '';

        // Recreate a clean event target to reset document event listeners
        // Since we can't easily remove event listeners attached by app.js (they are anonymous),
        // and JSDOM's document is preserved between tests by jest-environment-jsdom,
        // we use JSDOM's ability to recreate a fresh DOM environment via configuration
        // But for a single test suite, resetting modules is the most important part
    });

    test('should show error message when fetching prompts.json fails', async () => {
        // Mock fetch to reject with an error
        const mockError = new Error('Network error');
        global.fetch.mockRejectedValueOnce(mockError);

        // Spy on console.error to prevent it from cluttering the test output,
        // and to verify it was called
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Require the app.js script. We use isolateModules to ensure
        // it executes afresh and gets the correct document
        jest.isolateModules(() => {
            require('./app.js');
        });

        // Dispatch DOMContentLoaded event to trigger the initial fetch
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);

        // Wait for promises to resolve
        // The fetch and catch block are asynchronous
        await new Promise(process.nextTick);

        // Verify fetch was called
        expect(global.fetch).toHaveBeenCalledWith('prompts.json');

        // Verify console.error was called
        expect(consoleSpy).toHaveBeenCalledWith('Error loading prompts:', mockError);

        // Verify the error message is inserted into the DOM
        const sidebarContent = document.getElementById('sidebar-content');
        expect(sidebarContent.innerHTML).toContain('Failed to load prompts.');
        expect(sidebarContent.innerHTML).toContain('text-red-500');

        consoleSpy.mockRestore();
    });
});

describe('escapeHTML Function', () => {
    let escapeHTML;

    beforeAll(() => {
        // Require the app module to access the escapeHTML function
        const app = require('./app.js');
        escapeHTML = app.escapeHTML;
    });

    test('should return empty string or original value if falsy', () => {
        expect(escapeHTML('')).toBe('');
        expect(escapeHTML(null)).toBeNull();
        expect(escapeHTML(undefined)).toBeUndefined();
    });

    test('should return original string if no HTML characters are present', () => {
        expect(escapeHTML('hello world')).toBe('hello world');
        expect(escapeHTML('12345')).toBe('12345');
    });

    test('should escape "&" to "&amp;"', () => {
        expect(escapeHTML('AT&T')).toBe('AT&amp;T');
        expect(escapeHTML('& & &')).toBe('&amp; &amp; &amp;');
    });

    test('should escape "<" to "&lt;"', () => {
        expect(escapeHTML('<tag')).toBe('&lt;tag');
    });

    test('should escape ">" to "&gt;"', () => {
        expect(escapeHTML('tag>')).toBe('tag&gt;');
    });

    test('should escape a combination of HTML characters', () => {
        expect(escapeHTML('<script>alert("XSS & SQLi")</script>')).toBe('&lt;script&gt;alert("XSS &amp; SQLi")&lt;/script&gt;');
    });
});
