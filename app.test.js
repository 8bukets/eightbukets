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

    test('should render error message as text even if error object contains malicious content', async () => {
        // Mock fetch to reject with an error containing a malicious string
        const maliciousString = '<img src=x onerror=alert(1)>';
        const mockError = new Error(maliciousString);
        global.fetch.mockRejectedValueOnce(mockError);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        jest.isolateModules(() => {
            require('./app.js');
        });

        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);

        await new Promise(process.nextTick);

        const sidebarContent = document.getElementById('sidebar-content');
        const errorP = sidebarContent.querySelector('p');

        // The hardcoded message should be there
        expect(errorP.textContent).toBe('Failed to load prompts.');
        // The malicious string should NOT be in the innerHTML as an element
        expect(sidebarContent.innerHTML).not.toContain(maliciousString);

        consoleSpy.mockRestore();
    });
});


describe('renderSidebar', () => {
    let app;
    let sidebarContent;

    const mockCategories = [
        {
            name: 'Category 1',
            prompts: [
                { id: '1', title: 'Prompt 1', content: 'Content 1 [VAR]', titleLower: 'prompt 1', contentLower: 'content 1 [var]' },
                { id: '2', title: 'Prompt 2', content: 'Content 2', titleLower: 'prompt 2', contentLower: 'content 2' }
            ]
        },
        {
            name: 'Category 2',
            prompts: [
                { id: '3', title: 'Another Prompt', content: 'Something else', titleLower: 'another prompt', contentLower: 'something else' }
            ]
        }
    ];

    beforeEach(() => {
        // Load the HTML into JSDOM before each test to reset DOM
        const html = fs.readFileSync(require('path').resolve(__dirname, './index.html'), 'utf8');
        const cleanHtml = html.replace(/<!DOCTYPE html>/gi, '');
        document.documentElement.innerHTML = cleanHtml;

        sidebarContent = document.getElementById('sidebar-content');

        jest.isolateModules(() => {
            app = require('./app.js');
        });

        app.setSidebarContent(sidebarContent);
    });

    afterEach(() => {
        jest.resetModules();
        document.documentElement.innerHTML = '';
    });

    test('renders all categories and prompts when no filter is provided', () => {
        app.renderSidebar(mockCategories);

        // Should render 2 categories
        const categoryHeaders = sidebarContent.querySelectorAll('h3');
        expect(categoryHeaders.length).toBe(2);
        expect(categoryHeaders[0].textContent).toBe('Category 1');
        expect(categoryHeaders[1].textContent).toBe('Category 2');

        // Should render 3 prompts total
        const promptButtons = sidebarContent.querySelectorAll('.prompt-btn');
        expect(promptButtons.length).toBe(3);
        expect(promptButtons[0].textContent).toBe('Prompt 1');
        expect(promptButtons[1].textContent).toBe('Prompt 2');
        expect(promptButtons[2].textContent).toBe('Another Prompt');
    });

    test('filters prompts based on text in title or content', () => {
        app.renderSidebar(mockCategories, 'something');

        // Only Category 2 has 'something' in content
        const categoryHeaders = sidebarContent.querySelectorAll('h3');
        expect(categoryHeaders.length).toBe(1);
        expect(categoryHeaders[0].textContent).toBe('Category 2');

        const promptButtons = sidebarContent.querySelectorAll('.prompt-btn');
        expect(promptButtons.length).toBe(1);
        expect(promptButtons[0].textContent).toBe('Another Prompt');

        // Test filtering by title
        app.renderSidebar(mockCategories, 'prompt 1');
        const promptButtons2 = sidebarContent.querySelectorAll('.prompt-btn');
        expect(promptButtons2.length).toBe(1);
        expect(promptButtons2[0].textContent).toBe('Prompt 1');
    });

    test('does not throw when sidebarContent is null', () => {
        app.setSidebarContent(null);
        expect(() => {
            app.renderSidebar(mockCategories);
        }).not.toThrow();
    });

    test('renders nothing when categories array is empty', () => {
        app.renderSidebar([]);
        expect(sidebarContent.innerHTML).toBe('');
    });

    test('highlights the currently selected prompt', () => {
        app.setCurrentPrompt({ id: '2', title: 'Prompt 2', content: 'Content 2' });
        app.renderSidebar(mockCategories);

        const promptButtons = sidebarContent.querySelectorAll('.prompt-btn');

        // Prompt 1
        expect(promptButtons[0].classList.contains('bg-indigo-100')).toBe(false);

        // Prompt 2 (Selected)
        expect(promptButtons[1].classList.contains('bg-indigo-100')).toBe(true);
        expect(promptButtons[1].classList.contains('text-indigo-800')).toBe(true);
        expect(promptButtons[1].classList.contains('font-semibold')).toBe(true);

        // Prompt 3
        expect(promptButtons[2].classList.contains('bg-indigo-100')).toBe(false);
    });
});
