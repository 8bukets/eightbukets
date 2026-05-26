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

        categories.forEach(category => {
            const filteredPrompts = category.prompts.filter(prompt =>
                prompt.title.toLowerCase().includes(filterText.toLowerCase()) ||
                prompt.content.toLowerCase().includes(filterText.toLowerCase())
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
                btn.className = 'w-full text-left px-3 py-2 rounded text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors truncate';
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

    // Select a prompt
    function selectPrompt(prompt, categoryName) {
        currentPrompt = prompt;

        // Update UI
        welcomeMessage.classList.add('hidden');
        promptWorkspace.classList.remove('hidden');
        promptWorkspace.classList.add('flex');

        promptCategory.textContent = categoryName;
        promptTitle.textContent = prompt.title;

        // Parse variables like [TOPIC], [YOUR NICHE]
        const regex = /\[(.*?)\]/g;
        variables = [];
        let match;

        while ((match = regex.exec(prompt.content)) !== null) {
            // Avoid duplicates
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }

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
                label.textContent = variable;
                label.setAttribute('for', `input-${variable}`);

                const input = document.createElement('textarea');
                input.id = `input-${variable}`;
                input.className = 'w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-y';
                input.rows = 2;
                input.placeholder = `Enter ${variable}...`;

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

        variables.forEach(variable => {
            const input = document.getElementById(`input-${variable}`);
            const val = input && input.value.trim() !== '' ? input.value : `[${variable}]`;

            // Replace all occurrences of [VARIABLE]
            // We need to escape special characters in the variable name for the regex
            const escapedVariable = variable.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\[${escapedVariable}\\]`, 'g');
            finalContent = finalContent.replace(regex, val);
        });

        promptOutput.value = finalContent;
    }

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        if (promptOutput.value) {
            navigator.clipboard.writeText(promptOutput.value).then(() => {
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
