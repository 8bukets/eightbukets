const { escapeHTML } = require('./app.js');

const iterations = 100000;

// Mock data
const promptContent = "Write a blog post about [TOPIC] for [TARGET AUDIENCE]. Ensure the tone is [TONE].";
const variables = [
  { raw: "TOPIC", name: "TOPIC", hint: "" },
  { raw: "TARGET AUDIENCE", name: "TARGET AUDIENCE", hint: "" },
  { raw: "TONE", name: "TONE", hint: "" }
];

const mockInputs = {
  "TOPIC": "artificial intelligence",
  "TARGET AUDIENCE": "software engineers",
  "TONE": "professional"
};

// Original implementation
function originalUpdateOutput() {
    let finalContent = promptContent;

    finalContent = escapeHTML(finalContent);

    variables.forEach(variable => {
        const escapedVariable = variable.raw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\[${escapedVariable}\\]`, 'g');

        const val = mockInputs[variable.raw];
        if (val) {
            let escapedVal = escapeHTML(val);
            const htmlVal = `<span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">${escapedVal}</span>`;
            finalContent = finalContent.replace(regex, () => htmlVal);
        } else {
            const htmlVal = `<span class="bg-gray-200 text-gray-600 px-1 rounded">[${variable.raw}]</span>`;
            finalContent = finalContent.replace(regex, () => htmlVal);
        }
    });
    return finalContent;
}

// Optimized implementation (to test and verify)
function optimizedUpdateOutput() {
    let finalContent = promptContent;

    finalContent = escapeHTML(finalContent);

    variables.forEach(variable => {
        // Cache the regex on the variable if not present
        if (!variable.regex) {
            const escapedVariable = variable.raw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            variable.regex = new RegExp(`\\[${escapedVariable}\\]`, 'g');
        }

        const val = mockInputs[variable.raw];
        if (val) {
            let escapedVal = escapeHTML(val);
            const htmlVal = `<span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">${escapedVal}</span>`;
            finalContent = finalContent.replace(variable.regex, () => htmlVal);
        } else {
            const htmlVal = `<span class="bg-gray-200 text-gray-600 px-1 rounded">[${variable.raw}]</span>`;
            finalContent = finalContent.replace(variable.regex, () => htmlVal);
        }
    });
    return finalContent;
}

// Ensure both implementations return the same result
if (originalUpdateOutput() !== optimizedUpdateOutput()) {
    console.error("Mismatch in outputs!");
    console.error("Original:", originalUpdateOutput());
    console.error("Optimized:", optimizedUpdateOutput());
    process.exit(1);
}

// Benchmark
console.log(`Running benchmark with ${iterations} iterations...`);

const startOriginal = performance.now();
for (let i = 0; i < iterations; i++) {
    originalUpdateOutput();
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;

// Reset variable cache
variables.forEach(v => delete v.regex);

// Pre-warm the cache for optimized version
optimizedUpdateOutput();

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
    optimizedUpdateOutput();
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Original Time: ${timeOriginal.toFixed(2)} ms`);
console.log(`Optimized Time: ${timeOptimized.toFixed(2)} ms`);
console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}%`);
console.log(`Speedup: ${(timeOriginal / timeOptimized).toFixed(2)}x`);
