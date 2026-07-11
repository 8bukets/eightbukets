const fs = require('fs');
const path = require('path');

describe('selectPrompt function', () => {
    let app;

    beforeEach(() => {
        // Load the HTML to set up the DOM environment
        const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
        const cleanHtml = html.replace(/<!DOCTYPE html>/gi, '');
        document.documentElement.innerHTML = cleanHtml;

        // Require app.js in a clean environment
        jest.isolateModules(() => {
            app = require('./app.js');
        });

        // Initialize elements using the setters provided in app.js
        app.setSidebarContent(document.getElementById('sidebar-content'));
        app.setSearchInput(document.getElementById('search-input'));
        app.setWelcomeMessage(document.getElementById('welcome-message'));
        app.setPromptWorkspace(document.getElementById('prompt-workspace'));
        app.setPromptCategory(document.getElementById('prompt-category'));
        app.setPromptTitle(document.getElementById('prompt-title'));
        app.setDynamicForm(document.getElementById('dynamic-form'));
        app.setPromptOutput(document.getElementById('prompt-output'));
        app.setNoVariablesMsg(document.getElementById('no-variables-msg'));
    });

    afterEach(() => {
        document.documentElement.innerHTML = '';
        jest.resetModules();
    });

    test('should update currentPrompt and UI when a prompt is selected', () => {
        const mockPrompt = {
            id: '1',
            title: 'Test Prompt',
            content: 'Hello [NAME]!'
        };
        const categoryName = 'Test Category';

        app.selectPrompt(mockPrompt, categoryName);

        // Verify internal state
        expect(app.getCurrentPrompt()).toBe(mockPrompt);

        // Verify UI updates
        expect(document.getElementById('welcome-message').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('prompt-workspace').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('prompt-workspace').classList.contains('flex')).toBe(true);
        expect(document.getElementById('prompt-category').textContent).toBe(categoryName);
        expect(document.getElementById('prompt-title').textContent).toBe(mockPrompt.title);

        // Verify form rendering (integration with renderForm)
        const dynamicForm = document.getElementById('dynamic-form');
        expect(dynamicForm.innerHTML).toContain('input-NAME');

        // Verify output update (integration with updateOutput)
        const promptOutput = document.getElementById('prompt-output');
        expect(promptOutput.innerHTML).toContain('[NAME]');
    });

    test('should re-render sidebar to update highlighting', () => {
        const mockPrompt = { id: '1', title: 'Test Prompt', content: 'Test' };
        const promptsData = [
            {
                name: 'Category',
                prompts: [mockPrompt]
            }
        ];
        app.setPromptsData(promptsData);

        // Mock search input value
        const searchInput = document.getElementById('search-input');
        searchInput.value = '';

        app.selectPrompt(mockPrompt, 'Category');

        const sidebarContent = document.getElementById('sidebar-content');
        const selectedBtn = sidebarContent.querySelector('.bg-indigo-100');
        expect(selectedBtn).toBeTruthy();
        expect(selectedBtn.textContent).toBe('Test Prompt');
    });

    test('should handle missing searchInput gracefully', () => {
        app.setSearchInput(null);
        const mockPrompt = { id: '1', title: 'Test Prompt', content: 'Test' };

        expect(() => {
            app.selectPrompt(mockPrompt, 'Category');
        }).not.toThrow();
    });

    test('should handle missing welcomeMessage gracefully', () => {
        app.setWelcomeMessage(null);
        const mockPrompt = { id: '1', title: 'Test Prompt', content: 'Test' };

        expect(() => {
            app.selectPrompt(mockPrompt, 'Category');
        }).not.toThrow();
    });

    test('should handle missing promptWorkspace gracefully', () => {
        app.setPromptWorkspace(null);
        const mockPrompt = { id: '1', title: 'Test Prompt', content: 'Test' };

        expect(() => {
            app.selectPrompt(mockPrompt, 'Category');
        }).not.toThrow();
    });

    test('should handle missing promptCategory or promptTitle gracefully', () => {
        app.setPromptCategory(null);
        app.setPromptTitle(null);
        const mockPrompt = { id: '1', title: 'Test Prompt', content: 'Test' };

        expect(() => {
            app.selectPrompt(mockPrompt, 'Category');
        }).not.toThrow();
    });

    test('should parse variables and render form with multiple variables', () => {
        const mockPrompt = {
            id: '2',
            title: 'Multi-var Prompt',
            content: 'Hi [NAME], you are in [PLACE].'
        };

        app.selectPrompt(mockPrompt, 'Multi');

        const dynamicForm = document.getElementById('dynamic-form');
        expect(dynamicForm.querySelectorAll('textarea').length).toBe(2);
        expect(document.getElementById('input-NAME')).toBeTruthy();
        expect(document.getElementById('input-PLACE')).toBeTruthy();
    });

    test('should show noVariablesMsg when prompt has no variables', () => {
        const mockPrompt = {
            id: '3',
            title: 'No-var Prompt',
            content: 'Just some plain text.'
        };

        app.selectPrompt(mockPrompt, 'Plain');

        const noVariablesMsg = document.getElementById('no-variables-msg');
        expect(noVariablesMsg.classList.contains('hidden')).toBe(false);
        const dynamicForm = document.getElementById('dynamic-form');
        expect(dynamicForm.classList.contains('hidden')).toBe(true);
    });

    test('should handle null prompt gracefully (defensive check)', () => {
        // If we pass null, we want to make sure it doesn't crash the app
        // Although the UI usually ensures a prompt is passed
        expect(() => {
            app.selectPrompt(null, 'Category');
        }).not.toThrow();
    });

    test('should throw TypeError when given a malformed prompt object', () => {
        // Missing content
        const missingContentPrompt = { id: '1', title: 'Test' };
        expect(() => {
            app.selectPrompt(missingContentPrompt, 'Category');
        }).toThrow(TypeError);
        expect(() => {
            app.selectPrompt(missingContentPrompt, 'Category');
        }).toThrow('Invalid prompt object: missing or invalid required properties (id, title, content)');

        // Missing id
        const missingIdPrompt = { title: 'Test', content: 'Test content' };
        expect(() => {
            app.selectPrompt(missingIdPrompt, 'Category');
        }).toThrow(TypeError);

        // Missing title
        const missingTitlePrompt = { id: '1', content: 'Test content' };
        expect(() => {
            app.selectPrompt(missingTitlePrompt, 'Category');
        }).toThrow(TypeError);

        // Invalid type for content
        const invalidContentTypePrompt = { id: '1', title: 'Test', content: null };
        expect(() => {
            app.selectPrompt(invalidContentTypePrompt, 'Category');
        }).toThrow(TypeError);

        // Completely invalid object
        const completelyInvalidPrompt = { somethingElse: true };
        expect(() => {
            app.selectPrompt(completelyInvalidPrompt, 'Category');
        }).toThrow(TypeError);
    });
});
