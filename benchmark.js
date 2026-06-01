const { performance } = require('perf_hooks');

function benchmark(numVariables) {
    // Generate a prompt content with many duplicate and unique variables
    let content = "";
    for (let i = 0; i < numVariables; i++) {
        // Add a mix of unique and duplicate variables
        content += `[VAR_${i}] `;
        for (let j = 0; j < 10; j++) { // 10 duplicates for every unique
            content += `[VAR_${i}] `;
        }
    }

    const regex = /\[(.*?)\]/g;
    let variables = [];
    const seenVariables = new Set();
    let match;

    const start = performance.now();

    while ((match = regex.exec(content)) !== null) {
        const rawVar = match[1];

        // Avoid duplicates
        if (seenVariables.has(rawVar)) {
            continue;
        }
        seenVariables.add(rawVar);

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

    const end = performance.now();
    return end - start;
}

const n = 2000;
console.log(`Benchmarking with ${n} unique variables (and ${n * 10} duplicates)...`);
const time = benchmark(n);
console.log(`Time taken: ${time.toFixed(2)} ms`);
