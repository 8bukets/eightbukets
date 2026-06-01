document.addEventListener('DOMContentLoaded', async () => {
    const sidebarContent = document.getElementById('sidebar-content');
    const searchInput = document.getElementById('search-input');
    const welcomeMessage = document.getElementById('welcome-message');
    const promptWorkspace = document.getElementById('prompt-workspace');

    const promptCategory = document.getElementById('prompt-category');
    const promptTitle = document.getElementById('prompt-title');
    const dynamicForm = document.getElementById('dynamic-form');
    const promptOutput = document.getElementById('prompt-output');
    const copyBtn = document.getElementById('copy-btn');
    const copyToast = document.getElementById('copy-toast');
    const noVariablesMsg = document.getElementById('no-variables-msg');

    let promptsData = [];
    let currentPrompt = null;
    let variables = [];

    // Helper to escape HTML and prevent XSS
    function escapeHTML(str) {
        if (!str) return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Fetch JSON data
    try {
        const response = await fetch('prompts.json');
        const data = await response.json();
        promptsData = data.categories;
        renderSidebar(promptsData);
    } catch (error) {
        console.error('Error loading prompts:', error);
        sidebarContent.innerHTML = '<p class="text-red-500">Failed to load prompts.</p>';
    }

    // Render Sidebar
    function renderSidebar(categories, filterText = '') {
        sidebarContent.innerHTML = '';

        const filterTextLower = filterText.toLowerCase();

        categories.forEach(category => {
            const filteredPrompts = category.prompts.filter(prompt =>
                prompt.title.toLowerCase().includes(filterTextLower) ||
                prompt.content.toLowerCase().includes(filterTextLower)
            );

            if (filteredPrompts.length === 0) return;

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'mb-6';

            const categoryHeader = document.createElement('h3');
            categoryHeader.className = 'text-xs font-bold text-gray-400 uppercase tracking-wider mb-2';
            categoryHeader.textContent = category.name;
            categoryDiv.appendChild(categoryHeader);

            const promptList = document.createElement('ul');
            promptList.className = 'space-y-1';

            filteredPrompts.forEach(prompt => {
                const li = document.createElement('li');
                const btn = document.createElement('button');
                btn.className = 'prompt-btn w-full text-left px-3 py-2 rounded text-sm transition-colors truncate';

                // Add highlighting if this is the currently selected prompt
                if (currentPrompt && currentPrompt.id === prompt.id) {
                    btn.classList.add('bg-indigo-100', 'text-indigo-800', 'font-semibold');
                } else {
                    btn.classList.add('text-gray-700', 'hover:bg-indigo-50', 'hover:text-indigo-700');
                }

                btn.textContent = prompt.title;
                btn.onclick = () => selectPrompt(prompt, category.name);

                li.appendChild(btn);
                promptList.appendChild(li);
            });

            categoryDiv.appendChild(promptList);
            sidebarContent.appendChild(categoryDiv);
        });
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        renderSidebar(promptsData, e.target.value);
    });

    function parseVariables(content) {
        const regex = /\[(.*?)\]/g;
        variables = [];
        const seenVars = new Set();
        let match;

        while ((match = regex.exec(content)) !== null) {
            const rawVar = match[1];

            // Avoid duplicates
            if (seenVars.has(rawVar)) {
                continue;
            }
            seenVars.add(rawVar);

            // Split variable name and hint
            let varName = rawVar;
            let varHint = "";

            if (rawVar.includes("—")) {
                const parts = rawVar.split("—");
                varName = parts[0].trim();
                varHint = parts[1].trim();
            } else if (rawVar.includes(":")) {
                const parts = rawVar.split(":");
                varName = parts[0].trim();
                varHint = parts[1].trim();
            }

            variables.push({
                raw: rawVar,
                name: varName,
                hint: varHint
            });
        }
        return parsedVariables;
    }

    // Select a prompt
    function selectPrompt(prompt, categoryName) {
        currentPrompt = prompt;

        // Re-render sidebar to update highlighting
        renderSidebar(promptsData, searchInput.value);

        // Update UI
        welcomeMessage.classList.add('hidden');
        promptWorkspace.classList.remove('hidden');
        promptWorkspace.classList.add('flex');

        promptCategory.textContent = categoryName;
        promptTitle.textContent = prompt.title;

        // Parse variables like [TOPIC], [YOUR NICHE]
        variables = parseVariables(prompt.content);

        renderForm();
        updateOutput();
    }

    // Render Form Inputs
    function renderForm() {
        dynamicForm.innerHTML = '';

        if (variables.length === 0) {
            noVariablesMsg.classList.remove('hidden');
            dynamicForm.classList.add('hidden');
        } else {
            noVariablesMsg.classList.add('hidden');
            dynamicForm.classList.remove('hidden');

            variables.forEach(variable => {
                const div = document.createElement('div');
                div.className = 'flex flex-col gap-1';

                const label = document.createElement('label');
                label.className = 'text-xs font-semibold text-gray-600 uppercase';
                label.textContent = variable.name;
                label.setAttribute('for', `input-${variable.raw}`);

                const input = document.createElement('textarea');
                input.id = `input-${variable.raw}`;
                input.className = 'w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-y';
                input.rows = 2;
                input.placeholder = variable.hint ? `e.g. ${variable.hint}` : `Enter ${variable.name}...`;

                input.addEventListener('input', updateOutput);

                div.appendChild(label);
                div.appendChild(input);
                dynamicForm.appendChild(div);
            });
        }
    }

    // Update Textarea Output
    function updateOutput() {
        if (!currentPrompt) return;

        let finalContent = currentPrompt.content;

        // Escape HTML to prevent XSS before doing custom highlighting
        finalContent = escapeHTML(finalContent);

        variables.forEach(variable => {
            const input = document.getElementById(`input-${variable.raw}`);

            if (input && input.value.trim() !== '') {
                // Escape input to prevent XSS
                let escapedVal = escapeHTML(input.value);
                const htmlVal = `<span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">${escapedVal}</span>`;
                finalContent = finalContent.replace(variable.regex, () => htmlVal);
            } else {
                const htmlVal = `<span class="bg-gray-200 text-gray-600 px-1 rounded">[${variable.raw}]</span>`;
                finalContent = finalContent.replace(variable.regex, () => htmlVal);
            }

            // Add any remaining text
            const textAfter = finalContent.substring(lastIndex);
            if (textAfter) {
                promptOutput.appendChild(document.createTextNode(textAfter));
            }
        } else {
            // Fallback if still a textarea somehow
            let plainTextContent = finalContent;
            variables.forEach(variable => {
                const input = document.getElementById(`input-${variable.raw}`);
                const escapedVariable = variable.raw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const replaceRegex = new RegExp(`\\[${escapedVariable}\\]`, 'g');

                if (input && input.value.trim() !== '') {
                    plainTextContent = plainTextContent.replace(replaceRegex, () => input.value);
                }
            });
            promptOutput.value = plainTextContent;
        }
    }

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        // Handle both div (textContent) and textarea (value)
        const textToCopy = promptOutput.tagName === 'DIV' ? promptOutput.textContent : promptOutput.value;

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyToast.style.opacity = '1';
                setTimeout(() => {
                    copyToast.style.opacity = '0';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }
    });
});
