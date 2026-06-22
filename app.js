let sidebarContent, searchInput, welcomeMessage, promptWorkspace, promptCategory, promptTitle, dynamicForm, promptOutput, copyBtn, copyToast, noVariablesMsg;

let promptsData = [];
let promptsMap = new Map();
let currentPrompt = null;
let variables = [];

// Pre-compute maps and regexes for performance
const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
};
const HTML_ESCAPE_CHECK_REGEX = /[&<>'"]/;
const HTML_ESCAPE_REGEX = /[&<>'"]/g;


// Helper to escape HTML and prevent XSS
function escapeHTML(str) {
    if (!str) return str;
    if (!HTML_ESCAPE_CHECK_REGEX.test(str)) return str;
    return str.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char]);
}

// Render Sidebar
function renderSidebar(categories, filterText = '') {
    if (!sidebarContent) return;
    sidebarContent.textContent = '';

    // Clear efficiently
    sidebarContent.textContent = '';

    const fragment = document.createDocumentFragment();
    const filterTextLower = filterText.toLowerCase();

    const categoriesLength = categories.length;
    for (let i = 0; i < categoriesLength; i++) {
        const category = categories[i];
        const prompts = category.prompts;
        const promptsLength = prompts.length;
        const filteredPrompts = [];

        for (let j = 0; j < promptsLength; j++) {
            const prompt = prompts[j];
            if ((prompt.titleLower || '').includes(filterTextLower) || (prompt.contentLower || '').includes(filterTextLower)) {
                filteredPrompts.push(prompt);
            }
        }

        if (filteredPrompts.length === 0) continue;

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'mb-6';

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'text-xs font-bold text-gray-400 uppercase tracking-wider mb-2';
        categoryHeader.textContent = category.name;
        categoryDiv.appendChild(categoryHeader);

        const promptList = document.createElement('ul');
        promptList.className = 'space-y-1';

        const filteredLength = filteredPrompts.length;
        for (let j = 0; j < filteredLength; j++) {
            const prompt = filteredPrompts[j];
            const li = document.createElement('li');
            const btn = document.createElement('button');

            const isSelected = currentPrompt && currentPrompt.id === prompt.id;
            btn.className = 'prompt-btn w-full text-left px-3 py-2 rounded text-sm transition-colors truncate' +
                (isSelected ? ' bg-indigo-100 text-indigo-800 font-semibold' : ' text-gray-700 hover:bg-indigo-50 hover:text-indigo-700');

            btn.textContent = prompt.title;

            // Store data for event delegation
            btn.dataset.promptId = prompt.id;
            btn.dataset.categoryName = category.name;

            li.appendChild(btn);
            promptList.appendChild(li);
        }

        categoryDiv.appendChild(promptList);
        fragment.appendChild(categoryDiv);
    }

    sidebarContent.appendChild(fragment);
}

// Pre-compile RegExp to avoid recreation inside loops
const ESCAPE_REGEX = /[-\/\\^$*+?.()|[\]{}]/g;

function parseVariables(content) {
    if (!content) {
        variables = [];
        return [];
    }
    const regex = /\[(.*?)\]/g;
    const localVariables = [];
    const seenVars = new Set();
    let match;

    while ((match = regex.exec(content)) !== null) {
        const rawVar = match[1];

        if (seenVars.has(rawVar)) {
            continue;
        }
        seenVars.add(rawVar);

        let varName = rawVar;
        let varHint = "";
        const separator = ['—', ':'].find(s => rawVar.includes(s));
        if (separator) {
            const parts = rawVar.split(separator);
            varName = parts[0].trim();
            varHint = parts[1].trim();
        }

        const escapedVariable = rawVar.replace(ESCAPE_REGEX, '\\$&');
        localVariables.push({
            raw: rawVar,
            name: varName,
            hint: varHint,
            replaceRegex: new RegExp(`\\[${escapedVariable}\\]`, 'g')
        });
    }
    variables = localVariables;
    return localVariables;
}

function rebuildPromptsMap() {
    promptsMap.clear();
    if (!promptsData) return;
    for (let i = 0; i < promptsData.length; i++) {
        const category = promptsData[i];
        if (!category || !category.prompts) continue;
        const prompts = category.prompts;
        for (let j = 0; j < prompts.length; j++) {
            const prompt = prompts[j];
            if (prompt) {
                promptsMap.set(`${category.name}|${prompt.id}`, prompt);
            }
        }
    }
}

// Select a prompt
function selectPrompt(prompt, categoryName) {
    if (!prompt) return;
    currentPrompt = prompt;

    if (searchInput) renderSidebar(promptsData, searchInput.value);

    if (welcomeMessage) welcomeMessage.classList.add('hidden');
    if (promptWorkspace) {
        promptWorkspace.classList.remove('hidden');
        promptWorkspace.classList.add('flex');
    }

    if (promptCategory) promptCategory.textContent = categoryName || '';
    if (promptTitle) promptTitle.textContent = prompt.title || '';

    parseVariables(prompt.content || '');

    renderForm();
    updateOutput();
}

// Render Form Inputs
function renderForm() {
    if (!dynamicForm) return;

    // Clear efficiently
    dynamicForm.textContent = '';

    if (variables.length === 0) {
        if (noVariablesMsg) noVariablesMsg.classList.remove('hidden');
        dynamicForm.classList.add('hidden');
    } else {
        if (noVariablesMsg) noVariablesMsg.classList.add('hidden');
        dynamicForm.classList.remove('hidden');

        const fragment = document.createDocumentFragment();

        variables.forEach(variable => {
            const div = document.createElement('div');
            div.className = 'flex flex-col gap-1';

            const label = document.createElement('label');
            label.className = 'text-xs font-semibold text-gray-600 uppercase';
            label.textContent = variable.name;

            const safeId = `input-${variable.raw}`;
            label.setAttribute('for', safeId);

            const input = document.createElement('textarea');
            input.id = safeId;
            input.className = 'w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-y';
            input.rows = 2;
            input.placeholder = variable.hint ? `e.g. ${variable.hint}` : `Enter ${variable.name}...`;

            variable.inputElement = input;

            input.addEventListener('input', updateOutput);

            div.appendChild(label);
            div.appendChild(input);
            fragment.appendChild(div);
        });

        dynamicForm.appendChild(fragment);
    }
}

// Update Output
function updateOutput() {
    if (!currentPrompt || !promptOutput) return;

    const content = currentPrompt.content || '';
    const isTextarea = promptOutput.tagName.toLowerCase() === 'textarea';

    if (isTextarea) {
        let result = content;
        variables.forEach(v => {
            const val = (v.inputElement && v.inputElement.value.trim() !== '') ? v.inputElement.value : `[${v.raw}]`;
            result = result.replace(v.replaceRegex, () => val);
        });
        promptOutput.value = result;
    } else {
        promptOutput.textContent = '';

        let matches = [];
        variables.forEach(variable => {
            let match;
            const regex = new RegExp(variable.replaceRegex.source, 'g');
            while ((match = regex.exec(content)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    variable: variable
                });
            }
        });

        matches.sort((a, b) => a.start - b.start);

        let lastIndex = 0;
        matches.forEach(match => {
            if (match.start < lastIndex) return;

            if (match.start > lastIndex) {
                promptOutput.appendChild(document.createTextNode(content.substring(lastIndex, match.start)));
            }

            const span = document.createElement('span');
            const variable = match.variable;
            const input = variable.inputElement;
            const isFilled = input && input.value.trim() !== '';

            if (isFilled) {
                span.className = 'bg-indigo-100 text-indigo-800 font-medium px-1 rounded';
                span.textContent = input.value;
            } else {
                span.className = 'bg-gray-200 text-gray-600 px-1 rounded';
                span.textContent = `[${variable.raw}]`;
            }

            promptOutput.appendChild(span);
            lastIndex = match.end;
        });

        // Add remaining text
        if (lastIndex < content.length) {
            promptOutput.appendChild(document.createTextNode(content.substring(lastIndex)));
        }
    }
}

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', async () => {
    sidebarContent = document.getElementById('sidebar-content');
    searchInput = document.getElementById('search-input');
    welcomeMessage = document.getElementById('welcome-message');
    promptWorkspace = document.getElementById('prompt-workspace');
    promptCategory = document.getElementById('prompt-category');
    promptTitle = document.getElementById('prompt-title');
    dynamicForm = document.getElementById('dynamic-form');
    promptOutput = document.getElementById('prompt-output');
    copyBtn = document.getElementById('copy-btn');
    copyToast = document.getElementById('copy-toast');
    noVariablesMsg = document.getElementById('no-variables-msg');

    try {
        const response = await fetch('prompts.json');
        const data = await response.json();

        data.categories.forEach(category => {
            category.prompts.forEach(prompt => {
                if (prompt.title) prompt.titleLower = prompt.title.toLowerCase();
                if (prompt.content) prompt.contentLower = prompt.content.toLowerCase();
            });
        });

        promptsData = data.categories;
        rebuildPromptsMap();
        renderSidebar(promptsData);
    } catch (error) {
        console.error('Error loading prompts:', error);
        if (sidebarContent) {
            sidebarContent.innerHTML = '';
            const errorMsg = document.createElement('p');
            errorMsg.className = 'text-red-500';
            errorMsg.textContent = 'Failed to load prompts.';
            sidebarContent.appendChild(errorMsg);
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderSidebar(promptsData, e.target.value);
        });
    }

    // Event delegation for prompt selection
    if (sidebarContent) {
        sidebarContent.addEventListener('click', (e) => {
            const btn = e.target.closest('.prompt-btn');
            if (!btn) return;

            const promptId = btn.dataset.promptId;
            const categoryName = btn.dataset.categoryName;

            // Find prompt in promptsMap
            const prompt = promptsMap.get(`${categoryName}|${promptId}`);
            if (prompt) {
                selectPrompt(prompt, categoryName);
            }
        });
    }

    // Copy to Clipboard
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textToCopy = promptOutput.textContent || promptOutput.value;

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
    }
});
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHTML,
        renderSidebar,
        parseVariables,
        selectPrompt,
        renderForm,
        updateOutput,
        setPromptsData: (data) => {
            promptsData = data;
            rebuildPromptsMap();
        },
        setCurrentPrompt: (prompt) => currentPrompt = prompt,
        getCurrentPrompt: () => currentPrompt,
        setSearchInput: (el) => searchInput = el,
        setSidebarContent: (el) => sidebarContent = el,
        setPromptOutput: (el) => promptOutput = el,
        setDynamicForm: (el) => dynamicForm = el,
        setNoVariablesMsg: (el) => noVariablesMsg = el,
        setPromptTitle: (el) => promptTitle = el,
        setPromptCategory: (el) => promptCategory = el,
        setPromptWorkspace: (el) => promptWorkspace = el,
        setWelcomeMessage: (el) => welcomeMessage = el
    };
}
