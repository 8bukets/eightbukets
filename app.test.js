const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

describe('updateOutput', () => {
  let mockPromptData;

  beforeEach(() => {
    // Reset the document content and remove previous event listeners
    document.documentElement.innerHTML = html.toString();

    // We need to re-create the document to clear listeners globally attached by app.js
    // but JSDOM document recreation is tricky from inside Jest without setupFiles
    // Instead we can clear the body and isolate modules

    mockPromptData = {
      categories: [
        {
          name: "Test Category",
          prompts: [
            {
              id: "test-prompt-1",
              title: "Test Prompt",
              content: "Hello [NAME — User name]. Have a great day!"
            }
          ]
        }
      ]
    };

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockPromptData)
      })
    );

    // Isolate app.js execution since it attaches to DOMContentLoaded
    jest.isolateModules(() => {
      require('./app.js');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('XSS Prevention', () => {
    it('escapes HTML tags and ampersands in user input to prevent XSS', async () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      const promptBtns = document.querySelectorAll('.prompt-btn');
      expect(promptBtns.length).toBeGreaterThan(0);
      promptBtns[0].click();

      const input = document.getElementById('input-NAME — User name');
      expect(input).not.toBeNull();

      // Simulate user input containing XSS payload
      input.value = '<script>alert("xss")</script> & <b>bold</b>';
      input.dispatchEvent(new Event('input'));

      const promptOutput = document.getElementById('prompt-output');

      // The innerHTML of the element should contain escaped output
      expect(promptOutput.innerHTML).toContain('&lt;script&gt;alert("xss")&lt;/script&gt; &amp; &lt;b&gt;bold&lt;/b&gt;');
    });

    it('escapes initial prompt content to prevent XSS from prompt data itself', async () => {
      mockPromptData.categories[0].prompts[0].content = "Malicious <script>alert(1)</script> [NAME — User name]";

      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      const promptBtns = document.querySelectorAll('.prompt-btn');
      promptBtns[0].click();

      const promptOutput = document.getElementById('prompt-output');

      expect(promptOutput.innerHTML).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });

  describe('Edge Cases', () => {
    it('does not replace the variable if input is empty or whitespace', async () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      const promptBtns = document.querySelectorAll('.prompt-btn');
      promptBtns[0].click();

      const input = document.getElementById('input-NAME — User name');
      input.value = '   ';
      input.dispatchEvent(new Event('input'));

      const promptOutput = document.getElementById('prompt-output');

      // Should render the fallback gray variable badge instead of replacing it
      expect(promptOutput.innerHTML).toContain('<span class="bg-gray-200 text-gray-600 px-1 rounded">[NAME — User name]</span>');
    });
  });
});
