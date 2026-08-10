const fs = require('fs');
const path = require('path');

describe('renderForm function', () => {
    let app;
    let dynamicForm;
    let noVariablesMsg;

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
        dynamicForm = document.getElementById('dynamic-form');
        noVariablesMsg = document.getElementById('no-variables-msg');

        app.setDynamicForm(dynamicForm);
        app.setNoVariablesMsg(noVariablesMsg);
    });

    afterEach(() => {
        document.documentElement.innerHTML = '';
        jest.resetModules();
    });

    test('should do nothing if dynamicForm is null', () => {
        app.setDynamicForm(null);
        // This should not throw
        app.renderForm();
    });

    test('should show noVariablesMsg and hide dynamicForm when variables are empty', () => {
        // Clear variables by parsing content with no variables
        app.setVariables(app.parseVariables('No variables here'));

        app.renderForm();

        expect(noVariablesMsg.classList.contains('hidden')).toBe(false);
        expect(dynamicForm.classList.contains('hidden')).toBe(true);
        expect(dynamicForm.innerHTML).toBe('');
    });

    test('should hide noVariablesMsg and show dynamicForm when variables exist', () => {
        app.setVariables(app.parseVariables('Hello [NAME]'));

        app.renderForm();

        expect(noVariablesMsg.classList.contains('hidden')).toBe(true);
        expect(dynamicForm.classList.contains('hidden')).toBe(false);
    });

    test('should generate correct DOM fields for variables', () => {
        app.setVariables(app.parseVariables('Hello [NAME:Enter name] and [LOCATION]'));

        app.renderForm();

        const childNodes = dynamicForm.children;
        // Two variables should create two div containers
        expect(childNodes.length).toBe(2);

        // Check first variable (NAME)
        const nameDiv = childNodes[0];
        expect(nameDiv.className).toContain('flex flex-col gap-1');

        const nameLabel = nameDiv.querySelector('label');
        expect(nameLabel.textContent).toBe('NAME');
        expect(nameLabel.getAttribute('for')).toBe('input-NAME:Enter name');

        const nameInput = nameDiv.querySelector('textarea');
        expect(nameInput.id).toBe('input-NAME:Enter name');
        expect(nameInput.placeholder).toBe('e.g. Enter name');
        expect(nameInput.rows).toBe(2);

        // Check second variable (LOCATION)
        const locDiv = childNodes[1];
        const locLabel = locDiv.querySelector('label');
        expect(locLabel.textContent).toBe('LOCATION');

        const locInput = locDiv.querySelector('textarea');
        expect(locInput.placeholder).toBe('Enter LOCATION...');
    });

    test('should cache inputElement on the variable object', () => {
        const vars = app.setVariables(app.parseVariables('[TEST_VAR]'));

        app.renderForm();

        // The variables array is internal to app.js, but parseVariables returns it.
        // However, renderForm might be using the internal one.
        // In app.js: variables = parseVariables(prompt.content);
        // Wait, parseVariables returns the variables array AND sets the global 'variables' in app.js.

        expect(vars[0].inputElement).toBeDefined();
        expect(vars[0].inputElement.id).toBe('input-TEST_VAR');
    });

    test('should attach input event listener that calls updateOutput', () => {
        // Spy on updateOutput if possible, or verify its effect
        // Since updateOutput is exported, we can try to mock it if we require it differently,
        // but it's easier to just check if it's called by its effect.

        app.setCurrentPrompt({
            id: 'test',
            title: 'Test',
            content: 'Value: [VAL]'
        });
        app.setPromptOutput(document.createElement('div'));
        const vars = app.parseVariables('Value: [VAL]');
        app.updateGlobalVariableStates(vars);
        app.setVariables(vars);

        app.renderForm();

        const input = document.getElementById('input-VAL');
        input.value = 'New value';

        // Trigger input event
        input.dispatchEvent(new Event('input'));

        // updateOutput should have been called, updating promptOutput
        // (Note: updateOutput is called by the event listener)
        // We need to make sure promptOutput was set in the app state
        const output = document.createElement('div');
        app.setPromptOutput(output);

        input.dispatchEvent(new Event('input'));

        expect(output.innerHTML).toContain('New value');
    });

    test('should handle variables with special characters in raw string for ID and for attributes', () => {
        const vars = app.parseVariables('Hello [NAME: <script>alert(1)</script>]');
        app.updateGlobalVariableStates(vars);
        app.setVariables(vars);

        app.renderForm();

        const label = dynamicForm.querySelector('label');
        const input = dynamicForm.querySelector('textarea');

        // The ID should be correctly set even with special characters
        expect(input.id).toBe('input-NAME: <script>alert(1)</script>');
        expect(label.getAttribute('for')).toBe('input-NAME: <script>alert(1)</script>');
    });

    test('should function correctly when noVariablesMsg is null', () => {
        app.setNoVariablesMsg(null);
        app.setVariables(app.parseVariables('No variables'));

        // Should not throw
        app.renderForm();

        expect(dynamicForm.classList.contains('hidden')).toBe(true);
    });

    test('should correctly set placeholder when hint is present or absent', () => {
        app.setVariables(app.parseVariables('[VAR_WITH_HINT: My hint] and [VAR_NO_HINT]'));

        app.renderForm();

        const inputs = dynamicForm.querySelectorAll('textarea');

        expect(inputs[0].placeholder).toBe('e.g. My hint');
        expect(inputs[1].placeholder).toBe('Enter VAR_NO_HINT...');
    });
});
