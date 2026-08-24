const { parseVariables } = require('./app.js');
const { performance } = require('perf_hooks');

const content = "This is a [TEST] prompt with [MULTIPLE] variables. [TEST] appears again, and [MULTIPLE] is used twice. Also [ONE_MORE] to make it more complex. [ANOTHER: Hint] and [DASH - Hint] and [A + B (math)?] and [C*D] and [URL: http://localhost:3000].".repeat(10);

const ITERATIONS = 100000;

function runBenchmark() {
    console.log(`Running benchmark with ${ITERATIONS} iterations...`);

    // Warmup
    for (let i = 0; i < 1000; i++) {
        parseVariables(content);
    }

    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        parseVariables(content);
    }
    const end = performance.now();

    console.log(`Execution Time: ${(end - start).toFixed(2)} ms`);
    return end - start;
}

runBenchmark();
