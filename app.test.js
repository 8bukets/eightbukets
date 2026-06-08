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

describe('Security Features', () => {
    test('escapeHTML should properly escape all dangerous characters', () => {
        let app;
        jest.isolateModules(() => {
            app = require('./app.js');
        });

        // Test escaping specific characters
        expect(app.escapeHTML('<script>')).toBe('&lt;script&gt;');
        expect(app.escapeHTML('AT&T')).toBe('AT&amp;T');
        expect(app.escapeHTML('She said "Hello"')).toBe('She said &quot;Hello&quot;');
        expect(app.escapeHTML("It's alive")).toBe('It&#39;s alive');

        // Test combining multiple characters
        expect(app.escapeHTML('<div class="test" onclick=\'alert(1)\'>&</div>'))
            .toBe('&lt;div class=&quot;test&quot; onclick=&#39;alert(1)&#39;&gt;&amp;&lt;/div&gt;');

        // Test edge cases
        expect(app.escapeHTML('')).toBe('');
        expect(app.escapeHTML(null)).toBe(null);
        expect(app.escapeHTML(undefined)).toBe(undefined);
    });
});
