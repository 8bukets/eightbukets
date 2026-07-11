const { updateOutput, setPromptOutput, setCurrentPrompt, parseVariables } = require('./app.js');
const { performance } = require('perf_hooks');

const content = "This is a [TEST] prompt with [MULTIPLE] variables. [TEST] appears again, and [MULTIPLE] is used twice. Also [ONE_MORE] to make it more complex.";

// Mock DOM element
const promptOutput = {
    tagName: 'TEXTAREA',
    nodeName: 'TEXTAREA',
    value: ''
};

setPromptOutput(promptOutput);

const prompt = {
    id: '1',
    content: content,
    title: 'Test Prompt'
};
setCurrentPrompt(prompt);
const variables = parseVariables(content);

// Mock input elements
variables.forEach(v => {
    v.inputElement = { value: 'MockValue' };
});

const ITERATIONS = 100000;

function runBenchmark() {
    console.log(`Running baseline benchmark with ${ITERATIONS} iterations...`);

    // Warmup
    for (let i = 0; i < 1000; i++) {
        updateOutput();
    }

    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        updateOutput();
    }
    const end = performance.now();

    console.log(`Baseline Execution Time: ${(end - start).toFixed(2)} ms`);
    return end - start;
}

if (require.main === module) {
    runBenchmark();
}

module.exports = { runBenchmark, ITERATIONS };
