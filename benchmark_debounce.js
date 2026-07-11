const { performance } = require('perf_hooks');

// Mock DOM element and data
const searchInput = {
    value: '',
    listeners: {},
    addEventListener(event, callback) {
        this.listeners[event] = callback;
    },
    dispatchEvent(event) {
        if (this.listeners[event.type]) {
            this.listeners[event.type](event);
        }
    }
};

let renderSidebarCalls = 0;
function renderSidebar(data, filterText) {
    // Simulate some work
    let count = 0;
    for(let i = 0; i < 1000; i++) {
        count += data.length;
    }
    renderSidebarCalls++;
}

const promptsData = new Array(100).fill({});

// Un-optimized approach
function setupUnoptimized() {
    searchInput.listeners = {};
    renderSidebarCalls = 0;
    searchInput.addEventListener('input', (e) => {
        renderSidebar(promptsData, e.target.value);
    });
}

// Optimized approach
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupOptimized() {
    searchInput.listeners = {};
    renderSidebarCalls = 0;
    searchInput.addEventListener('input', debounce((e) => {
        renderSidebar(promptsData, e.target.value);
    }, 300));
}

// Simulate rapid typing (e.g. typing "performance")
async function simulateTyping() {
    const word = "performance";
    for(let i = 0; i < word.length; i++) {
        searchInput.value = word.substring(0, i + 1);
        searchInput.dispatchEvent({ type: 'input', target: searchInput });
        // Simulate time between keystrokes
        await new Promise(r => setTimeout(r, 50));
    }
    // Wait for final debounce to fire
    await new Promise(r => setTimeout(r, 350));
}

async function runBenchmark() {
    console.log("Running Debounce Benchmark...\n");

    // Baseline
    setupUnoptimized();
    let start = performance.now();
    await simulateTyping();
    let end = performance.now();
    console.log(`Unoptimized (Baseline):`);
    console.log(`renderSidebar calls: ${renderSidebarCalls}`);

    // Optimized
    setupOptimized();
    start = performance.now();
    await simulateTyping();
    end = performance.now();
    console.log(`\nOptimized (Debounced):`);
    console.log(`renderSidebar calls: ${renderSidebarCalls}`);
}

runBenchmark();
