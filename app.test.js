const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

describe('XSS Prevention in app.js', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();

        // Mock fetch
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    categories: [
                        {
                            name: "Test Category",
                            prompts: [
                                {
                                    id: "test-1",
                                    title: "Test Prompt",
                                    content: "Hello [NAME: your name]! [TOPIC]"
                                }
                            ]
                        }
                    ]
                })
            })
        );

        // Clear modules to re-evaluate app.js if needed
        jest.resetModules();
    });

    it('escapes HTML entities in user input to prevent XSS', async () => {
        // Load app.js
        require('./app.js');

        // Trigger DOMContentLoaded
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Wait for async fetch and DOM updates
        await new Promise(resolve => setTimeout(resolve, 50));

        // Find the prompt button and click it to select the prompt
        const buttons = document.querySelectorAll('.prompt-btn');
        expect(buttons.length).toBeGreaterThan(0);
        buttons[0].click();

        // Get the input for the NAME variable
        const nameInput = document.getElementById('input-NAME: your name');
        expect(nameInput).not.toBeNull();

        // Enter a payload with special characters
        nameInput.value = '<script>alert("xss")</script> & <b>bold</b>';
        nameInput.dispatchEvent(new Event('input'));

        const promptOutput = document.getElementById('prompt-output');

        // The innerHTML should not contain unescaped tags for the input
        expect(promptOutput.innerHTML).not.toContain('<script>');
        expect(promptOutput.innerHTML).toContain('&lt;script&gt;alert("xss")&lt;/script&gt; &amp; &lt;b&gt;bold&lt;/b&gt;');
    });

    it('escapes HTML entities in the base prompt content as well', async () => {
        // Update mock to return a prompt with XSS in content
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    categories: [
                        {
                            name: "Test Category",
                            prompts: [
                                {
                                    id: "test-2",
                                    title: "Malicious Prompt",
                                    content: "Base content <img src=x onerror=alert(1)> [VAR]"
                                }
                            ]
                        }
                    ]
                })
            })
        );

        require('./app.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await new Promise(resolve => setTimeout(resolve, 50));

        const buttons = document.querySelectorAll('.prompt-btn');
        buttons[0].click();

        const promptOutput = document.getElementById('prompt-output');
        expect(promptOutput.innerHTML).not.toContain('<img src=x onerror=alert(1)>');
        expect(promptOutput.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });
});
