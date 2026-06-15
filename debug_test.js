const { parseVariables } = require('./app.js');

const content = "This is a [TOPIC] prompt.";
const result = parseVariables(content);

console.log("Result:", JSON.stringify(result, null, 2));
console.log("Result type:", typeof result);
console.log("Result is array:", Array.isArray(result));

const expected = [{ raw: 'TOPIC', name: 'TOPIC', hint: '' }];
console.log("Expected:", JSON.stringify(expected, null, 2));

// Compare using deep equal
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
console.log("Deep equal:", deepEqual(result, expected));

// Check properties of the first element
if (result.length > 0) {
    console.log("Keys of result[0]:", Object.keys(result[0]));
    console.log("Keys of expected[0]:", Object.keys(expected[0]));
}

// Check masterRegex property on the array
console.log("result.masterRegex:", result.masterRegex);
