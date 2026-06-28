let sidebarContent, searchInput, welcomeMessage, promptWorkspace, promptCategory, promptTitle, dynamicForm, promptOutput, copyBtn, copyToast, noVariablesMsg;

let promptsData = [];
let currentPrompt = null;
let variables = [];
let combinedVariableRegex = null;
let variablesMap = new Map();

const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};
const HTML_ESCAPE_CHECK_REGEX = /[&<>'"]/;
const HTML_ESCAPE_REGEX = /[&<>'"]/g;

function escapeHTML(str) {
    if (!str) return str;
    if (!HTML_ESCAPE_CHECK_REGEX.test(str)) return str;
    return str.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char]);
}


// Render Sidebar
function renderSidebar(categories, filterText = '') {
    if (!sidebarContent) return;
    sidebarContent.innerHTML = '';

    const filterTextLower = filterText.toLowerCase();

    categories.forEach(category => {
        const filteredPrompts = category.prompts.filter(prompt => {
            // Strictly use pre-computed lowercase fields to avoid repeated string manipulation
            // and fallback to empty string if missing to avoid throwing and maintain performance
            return (prompt.titleLower || '').includes(filterTextLower) || (prompt.contentLower || '').includes(filterTextLower);
        });

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

// Pre-compile RegExp to avoid recreation inside loops
const ESCAPE_REGEX = /[-\/\\^$*+?.()|[\]{}]/g;
const VARIABLE_REGEX = /\[(.*?)\]/g;
const VAR_SEPARATORS = ['—', ':'];

const HTML_ESCAPE_CHECK_REGEX = /[&<>"']/;
const HTML_ESCAPE_REGEX = /[&<>"']/g;
const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};


function parseVariables(content) {
    if (!content) {
        variables = [];
        combinedVariableRegex = null;
        variablesMap.clear();
        return [];
    }
    variables = [];
    const seenVars = new Set();
    let match;

    VARIABLE_REGEX.lastIndex = 0;
    while ((match = VARIABLE_REGEX.exec(content)) !== null) {
        const rawVar = match[1];

        // Avoid duplicates
        if (seenVars.has(rawVar)) {
            continue;
        }
        seenVars.add(rawVar);

        // Split variable name and hint
        let varName = rawVar;
        let varHint = "";
        let separatorIndex = rawVar.indexOf('—');
        if (separatorIndex === -1) {
            separatorIndex = rawVar.indexOf(':');
        }
        if (separatorIndex !== -1) {
            varName = rawVar.substring(0, separatorIndex).trim();
            varHint = rawVar.substring(separatorIndex + 1).trim();
        }

        const escapedVariable = rawVar.replace(ESCAPE_REGEX, '\\$&');
        const replaceRegexSource = `\\[${escapedVariable}\\]`;

        const variable = {
            raw: rawVar,
            name: varName,
            hint: varHint,
            replaceRegex: new RegExp(`\\[${escapedVariable}\\]`, 'g')
        };
        localVariables.push(variable);
    }

    if (variables.length > 0) {
        variablesMap.clear();
        const patterns = variables.map(v => {
            variablesMap.set(v.raw, v);
            const escaped = v.raw.replace(ESCAPE_REGEX, '\\$&');
            return `\\[${escaped}\\]`;
        });

        // Sort patterns by length descending to match longest variables first (e.g., [VAR_EXT] before [VAR])
        patterns.sort((a, b) => b.length - a.length);
        combinedVariableRegex = new RegExp(`(${patterns.join('|')})`, 'g');
    }
    return variables;
}

// Select a prompt
function selectPrompt(prompt, categoryName) {
    if (!prompt) return;
    currentPrompt = prompt;

    // Re-render sidebar to update highlighting
    if (searchInput) renderSidebar(promptsData, searchInput.value);

    // Update UI
    if (welcomeMessage) welcomeMessage.classList.add('hidden');
    if (promptWorkspace) {
        promptWorkspace.classList.remove('hidden');
        promptWorkspace.classList.add('flex');
    }

    if (promptCategory) promptCategory.textContent = categoryName;
    if (promptTitle) promptTitle.textContent = prompt.title;

    // Parse variables like [TOPIC], [YOUR NICHE]
    variables = parseVariables(prompt.content);

    renderForm();
    updateOutput();
}

// Render Form Inputs
function renderForm() {
    if (!dynamicForm) return;
    dynamicForm.innerHTML = '';

    if (variables.length === 0) {
        if (noVariablesMsg) noVariablesMsg.classList.remove('hidden');
        dynamicForm.classList.add('hidden');
    } else {
        if (noVariablesMsg) noVariablesMsg.classList.add('hidden');
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

            // Cache the input element directly on the variable object to avoid repeated DOM queries in loops
            variable.inputElement = input;

            input.addEventListener('input', updateOutput);

            div.appendChild(label);
            div.appendChild(input);
            dynamicForm.appendChild(div);
        });
    }
}

// Update Textarea Output
function updateOutput() {
    if (!currentPrompt || !promptOutput) return;

    const content = currentPrompt.content;
    const isTextarea = promptOutput.tagName === 'TEXTAREA' || promptOutput.nodeName === 'TEXTAREA';

    const isTextarea = promptOutput && promptOutput.tagName === 'TEXTAREA';
    if (isTextarea) {
        // Optimization: Create a map for quick variable lookup
        const varMap = new Map();
        variables.forEach(v => {
            varMap.set(v.raw, v);
        });

        // Single pass replacement for textarea
        promptOutput.value = content.replace(VARIABLE_REGEX, (match, raw) => {
            const v = varMap.get(raw);
            if (v) {
                return (v.inputElement && v.inputElement.value.trim() !== '') ? v.inputElement.value : `[${v.raw}]`;
            }
            return match;
        });
    } else {
        const matches = [];
        let match;

        if (combinedVariableRegex) {
            combinedVariableRegex.lastIndex = 0;
            while ((match = combinedVariableRegex.exec(finalContent)) !== null) {
                const matchedText = match[0];
                const rawVar = matchedText.slice(1, -1);
                const variable = variablesMap.get(rawVar);
                if (variable) {
                    matches.push({
                        start: match.index,
                        end: match.index + matchedText.length,
                        variable,
                        matchedText
                    });
                }
            }
        }

        matches.sort((a, b) => a.start - b.start);

        let htmlOutput = '';
        let lastIndex = 0;

        for (let i = 0; i < matches.length; i++) {
            const { start, end, variable, matchedText } = matches[i];

            if (start > lastIndex) {
                htmlOutput += escapeHTML(finalContent.substring(lastIndex, start));
            }

            const input = variable.inputElement;
            const isFilled = input && input.value.trim() !== '';

            if (isFilled) {
                htmlOutput += `<span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">${escapeHTML(input.value)}</span>`;
            } else {
                htmlOutput += `<span class="bg-gray-200 text-gray-600 px-1 rounded">${escapeHTML(matchedText)}</span>`;
            }

            lastIndex = end;
        }

        if (lastIndex < finalContent.length) {
            htmlOutput += escapeHTML(finalContent.substring(lastIndex));
        }

        if (promptOutput) {
            promptOutput.innerHTML = htmlOutput;
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

    // Fetch JSON data
    try {
        const response = await fetch('prompts.json');
        const data = await response.json();

        // Pre-compute lowercase strings for faster search filtering
        data.categories.forEach(category => {
            category.prompts.forEach(prompt => {
                if (prompt.title) prompt.titleLower = prompt.title.toLowerCase();
                if (prompt.content) prompt.contentLower = prompt.content.toLowerCase();
            });
        });

        promptsData = data.categories;
        renderSidebar(promptsData);
    } catch (error) {
        console.error('Error loading prompts:', error);
        if (sidebarContent) sidebarContent.innerHTML = '<p class="text-red-500">Failed to load prompts.</p>';
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderSidebar(promptsData, e.target.value);
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
        setPromptsData: (data) => promptsData = data,
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
