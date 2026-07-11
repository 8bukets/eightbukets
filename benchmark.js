const { performance } = require('perf_hooks');
const { parseVariables } = require('./app.js');

const complexPrompt = "Prompt: [ACTION: Write] a [FORMAT — Blog Post] about [TOPIC] for [AUDIENCE] which will be a [FORMAT — Blog Post]. Here are some more variables: [VAR1], [VAR2: hint], [VAR3 — hint], [VAR4], [VAR5], [VAR6].";
const iterations = 500000;

// Warmup
for (let i = 0; i < 10000; i++) {
    parseVariables(complexPrompt);
}

const runs = 5;
let totalTime = 0;

for (let r = 0; r < runs; r++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        parseVariables(complexPrompt);
    }
    const end = performance.now();
    const runTime = end - start;
    console.log(`Run ${r + 1}: ${runTime.toFixed(2)} ms`);
    totalTime += runTime;
}

console.log(`\nAverage time over ${runs} runs: ${(totalTime / runs).toFixed(2)} ms`);
