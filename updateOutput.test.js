const fs = require('fs');
const path = require('path');

describe('updateOutput function', () => {
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

        // Initialize elements
        app.setPromptOutput(document.getElementById('prompt-output'));
    });

    afterEach(() => {
        document.documentElement.innerHTML = '';
        jest.resetModules();
    });

    test('should do nothing if currentPrompt is null', () => {
        app.setCurrentPrompt(null);
        app.setPromptOutput(document.createElement('div'));

        // This shouldn't throw an error
        app.updateOutput();
    });

    test('should format text and replace variables when promptOutput is a DIV', () => {
        const promptOutput = document.createElement('div');
        app.setPromptOutput(promptOutput);

        app.setCurrentPrompt({
            id: 'test-1',
            title: 'Test',
            content: 'Hello [NAME], welcome to [PLACE].'
        });

        // Set up variables state as it would be after selectPrompt
        // Simulate parseVariables being called
        app.selectPrompt(app.getCurrentPrompt(), 'Category');

        // Select prompt triggers renderForm which clears the dynamic form and recreates the inputs
        // By default, renderForm uses dynamicForm, so we need to set it up using the real one from the DOM
        const dynamicForm = document.getElementById('dynamic-form');
        app.setDynamicForm(dynamicForm);

        // Setup the DOM form inputs by calling renderForm (called by selectPrompt implicitly if dynamicForm is set)
        app.selectPrompt(app.getCurrentPrompt(), 'Category');

        // Now find the dynamically created inputs and set their values
        const inputName = document.getElementById('input-NAME');
        const inputPlace = document.getElementById('input-PLACE');

        if (inputName) inputName.value = 'Alice';
        if (inputPlace) inputPlace.value = 'Wonderland';

        app.updateOutput();

        expect(promptOutput.innerHTML).toContain('Hello <span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">Alice</span>, welcome to <span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">Wonderland</span>.');
    });

    test('should use placeholder spans for empty inputs when promptOutput is a DIV', () => {
        const promptOutput = document.createElement('div');
        app.setPromptOutput(promptOutput);

        app.setCurrentPrompt({
            id: 'test-2',
            title: 'Test',
            content: 'Hello [NAME].'
        });

        const dynamicForm = document.getElementById('dynamic-form');
        app.setDynamicForm(dynamicForm);

        app.selectPrompt(app.getCurrentPrompt(), 'Category');

        // Find the dynamically created input and set its value
        const inputName = document.getElementById('input-NAME');
        if (inputName) inputName.value = '';

        app.updateOutput();

        expect(promptOutput.innerHTML).toContain('Hello <span class="bg-gray-200 text-gray-600 px-1 rounded">[NAME]</span>.');
    });

    test('should correctly replace variables when promptOutput is a TEXTAREA', () => {
        const promptOutput = document.createElement('textarea');
        app.setPromptOutput(promptOutput);

        app.setCurrentPrompt({
            id: 'test-3',
            title: 'Test',
            content: 'Hello [NAME], welcome to [PLACE].'
        });

        const dynamicForm = document.getElementById('dynamic-form');
        app.setDynamicForm(dynamicForm);

        app.selectPrompt(app.getCurrentPrompt(), 'Category');

        // Find the dynamically created inputs and set their values
        const inputName = document.getElementById('input-NAME');
        const inputPlace = document.getElementById('input-PLACE');

        if (inputName) inputName.value = 'Alice';
        if (inputPlace) inputPlace.value = 'Wonderland';

        app.updateOutput();

        expect(promptOutput.value).toBe('Hello Alice, welcome to Wonderland.');
    });

    test('should be safe from XSS in prompt content', () => {
        const promptOutput = document.createElement('div');
        app.setPromptOutput(promptOutput);

        app.setCurrentPrompt({
            id: 'test-4',
            title: 'Test',
            content: '<script>alert("xss")</script> [VAR]'
        });

        const dynamicForm = document.getElementById('dynamic-form');
        app.setDynamicForm(dynamicForm);

        app.selectPrompt(app.getCurrentPrompt(), 'Category');

        const inputVar = document.getElementById('input-VAR');
        if (inputVar) inputVar.value = 'Safe';

        app.updateOutput();

        // The content should be rendered as text, not HTML
        expect(promptOutput.textContent).toContain('<script>alert("xss")</script>');
        expect(promptOutput.innerHTML).not.toContain('<script>');
    });

    test('should be safe from XSS in input values', () => {
        const promptOutput = document.createElement('div');
        app.setPromptOutput(promptOutput);

        app.setCurrentPrompt({
            id: 'test-5',
            title: 'Test',
            content: 'Content: [VAR]'
        });

        const dynamicForm = document.getElementById('dynamic-form');
        app.setDynamicForm(dynamicForm);

        app.selectPrompt(app.getCurrentPrompt(), 'Category');

        const inputVar = document.getElementById('input-VAR');
        const maliciousString = '<img src="x" onerror="alert(1)">';
        if (inputVar) inputVar.value = maliciousString;

        app.updateOutput();

        // The input value should be rendered as text in the span
        expect(promptOutput.textContent).toContain(maliciousString);
        expect(promptOutput.innerHTML).not.toContain('<img');
    });

    test('should correctly handle overlapping variable names (regex alternation bug)', () => {
        const promptOutput = document.createElement('div');
        app.setPromptOutput(promptOutput);

        app.setCurrentPrompt({
            id: 'test-6',
            title: 'Test Overlapping',
            content: 'Replace [VAR] and [VAR_EXTEND].'
        });

        const dynamicForm = document.getElementById('dynamic-form');
        app.setDynamicForm(dynamicForm);

        app.selectPrompt(app.getCurrentPrompt(), 'Category');

        const inputVar = document.getElementById('input-VAR');
        const inputVarExtend = document.getElementById('input-VAR_EXTEND');

        if (inputVar) inputVar.value = 'Short';
        if (inputVarExtend) inputVarExtend.value = 'Longer';

        app.updateOutput();

        expect(promptOutput.innerHTML).toContain('Replace <span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">Short</span> and <span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">Longer</span>.');
    });

    test('should output plain text when combinedVariableRegex is null (no variables in prompt)', () => {
        const promptOutput = document.createElement('div');
        app.setPromptOutput(promptOutput);

        app.setCurrentPrompt({
            id: 'test-7',
            title: 'Static Prompt',
            content: 'This is a static prompt with no variables.'
        });

        const dynamicForm = document.getElementById('dynamic-form');
        app.setDynamicForm(dynamicForm);

        app.selectPrompt(app.getCurrentPrompt(), 'Category');
        app.updateOutput();

        expect(promptOutput.innerHTML).toBe('This is a static prompt with no variables.');
    });
});
