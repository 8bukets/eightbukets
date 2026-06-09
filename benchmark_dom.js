const { JSDOM } = require("jsdom");

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <div id="input-TOPIC"></div>
  <div id="input-TARGET AUDIENCE"></div>
  <div id="input-TONE"></div>
</body>
</html>
`);
const document = dom.window.document;

const iterations = 100000;

// Mock data
const promptContent = "Write a blog post about [TOPIC] for [TARGET AUDIENCE]. Ensure the tone is [TONE].";
const variables = [
  { raw: "TOPIC", name: "TOPIC", hint: "", replaceRegex: new RegExp(`\\[TOPIC\\]`, 'g'), inputElement: document.getElementById('input-TOPIC') },
  { raw: "TARGET AUDIENCE", name: "TARGET AUDIENCE", hint: "", replaceRegex: new RegExp(`\\[TARGET AUDIENCE\\]`, 'g'), inputElement: document.getElementById('input-TARGET AUDIENCE') },
  { raw: "TONE", name: "TONE", hint: "", replaceRegex: new RegExp(`\\[TONE\\]`, 'g'), inputElement: document.getElementById('input-TONE') }
];

const mockInputs = {
  "TOPIC": "artificial intelligence",
  "TARGET AUDIENCE": "software engineers",
  "TONE": "professional"
};

// Original implementation
function originalUpdateOutput() {
    let finalContent = promptContent;

    finalContent = finalContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    variables.forEach(variable => {
        const input = document.getElementById(`input-${variable.raw}`);
        const escapedVariable = variable.raw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const replaceRegex = new RegExp(`\\[${escapedVariable}\\]`, 'g');

        const val = mockInputs[variable.raw];
        if (input && val) {
            let escapedVal = val
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            const htmlVal = `<span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">${escapedVal}</span>`;
            finalContent = finalContent.replace(replaceRegex, () => htmlVal);
        } else {
            const htmlVal = `<span class="bg-gray-200 text-gray-600 px-1 rounded">[${variable.raw}]</span>`;
            finalContent = finalContent.replace(replaceRegex, () => htmlVal);
        }
    });
    return finalContent;
}

// Optimized implementation (to test and verify)
function optimizedUpdateOutput() {
    let finalContent = promptContent;

    finalContent = finalContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    variables.forEach(variable => {
        // Cache the regex on the variable if not present
        if (!variable.replaceRegex) {
            const escapedVariable = variable.raw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            variable.replaceRegex = new RegExp(`\\[${escapedVariable}\\]`, 'g');
        }

        // Cache input element
        if (!variable.inputElement) {
           variable.inputElement = document.getElementById(`input-${variable.raw}`);
        }

        const input = variable.inputElement;

        const val = mockInputs[variable.raw];
        if (input && val) {
            let escapedVal = val
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            const htmlVal = `<span class="bg-indigo-100 text-indigo-800 font-medium px-1 rounded">${escapedVal}</span>`;
            finalContent = finalContent.replace(variable.replaceRegex, () => htmlVal);
        } else {
            const htmlVal = `<span class="bg-gray-200 text-gray-600 px-1 rounded">[${variable.raw}]</span>`;
            finalContent = finalContent.replace(variable.replaceRegex, () => htmlVal);
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
