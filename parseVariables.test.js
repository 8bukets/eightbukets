const { parseVariables } = require('./app.js');

describe('parseVariables function', () => {
    test('should extract a basic variable without hint', () => {
        const result = parseVariables("This is a [TOPIC] prompt.");
        expect(result).toEqual([
            { raw: 'TOPIC', name: 'TOPIC', hint: '' }
        ]);
    });

    test('should extract multiple basic variables', () => {
        const result = parseVariables("A [TOPIC] for [AUDIENCE].");
        expect(result).toEqual([
            { raw: 'TOPIC', name: 'TOPIC', hint: '' },
            { raw: 'AUDIENCE', name: 'AUDIENCE', hint: '' }
        ]);
    });

    test('should deduplicate identical variables', () => {
        const result = parseVariables("A [TOPIC] prompt about the same [TOPIC].");
        expect(result).toEqual([
            { raw: 'TOPIC', name: 'TOPIC', hint: '' }
        ]);
    });

    test('should extract variable name and hint separated by colon', () => {
        const result = parseVariables("Write about [TOPIC: Data Science].");
        expect(result).toEqual([
            { raw: 'TOPIC: Data Science', name: 'TOPIC', hint: 'Data Science' }
        ]);
    });

    test('should extract variable name and hint separated by em-dash', () => {
        const result = parseVariables("Write about [TOPIC — Data Science].");
        expect(result).toEqual([
            { raw: 'TOPIC — Data Science', name: 'TOPIC', hint: 'Data Science' }
        ]);
    });

    test('should handle empty brackets correctly', () => {
        const result = parseVariables("This is an empty [] bracket.");
        expect(result).toEqual([
            { raw: '', name: '', hint: '' }
        ]);
    });

    test('should return empty array if no variables present', () => {
        const result = parseVariables("This is a string without any variables.");
        expect(result).toEqual([]);
    });

    test('should handle complex mixed variables', () => {
        const content = "Prompt: [ACTION: Write] a [FORMAT — Blog Post] about [TOPIC] for [AUDIENCE] which will be a [FORMAT — Blog Post].";
        const result = parseVariables(content);
        expect(result).toEqual([
            { raw: 'ACTION: Write', name: 'ACTION', hint: 'Write' },
            { raw: 'FORMAT — Blog Post', name: 'FORMAT', hint: 'Blog Post' },
            { raw: 'TOPIC', name: 'TOPIC', hint: '' },
            { raw: 'AUDIENCE', name: 'AUDIENCE', hint: '' }
        ]);
    });
});
