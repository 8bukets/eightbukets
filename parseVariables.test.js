const { parseVariables } = require('./app.js');

describe('parseVariables function', () => {
    test('should extract a basic variable without hint', () => {
        const result = parseVariables("This is a [TOPIC] prompt.");
        expect(result[0]).toMatchObject(
            { raw: 'TOPIC', name: 'TOPIC', hint: '' }
        );
    });

    test('should extract multiple basic variables', () => {
        const result = parseVariables("A [TOPIC] for [AUDIENCE].");
        expect(result[0]).toMatchObject({ raw: 'TOPIC', name: 'TOPIC', hint: '' });
        expect(result[1]).toMatchObject({ raw: 'AUDIENCE', name: 'AUDIENCE', hint: '' });
    });

    test('should deduplicate identical variables', () => {
        const result = parseVariables("A [TOPIC] prompt about the same [TOPIC].");
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject(
            { raw: 'TOPIC', name: 'TOPIC', hint: '' }
        );
    });

    test('should extract variable name and hint separated by colon', () => {
        const result = parseVariables("Write about [TOPIC: Data Science].");
        expect(result[0]).toMatchObject(
            { raw: 'TOPIC: Data Science', name: 'TOPIC', hint: 'Data Science' }
        );
    });

    test('should extract variable name and hint separated by em-dash', () => {
        const result = parseVariables("Write about [TOPIC — Data Science].");
        expect(result[0]).toMatchObject(
            { raw: 'TOPIC — Data Science', name: 'TOPIC', hint: 'Data Science' }
        );
    });

    test('should handle empty brackets correctly', () => {
        const result = parseVariables("This is an empty [] bracket.");
        expect(result[0]).toMatchObject(
            { raw: '', name: '', hint: '' }
        );
    });

    test('should return empty array if no variables present', () => {
        const result = parseVariables("This is a string without any variables.");
        expect(result).toHaveLength(0);
    });

    test('should handle complex mixed variables', () => {
        const content = "Prompt: [ACTION: Write] a [FORMAT — Blog Post] about [TOPIC] for [AUDIENCE] which will be a [FORMAT — Blog Post].";
        const result = parseVariables(content);
        expect(result).toHaveLength(4);
        expect(result[0]).toMatchObject({ raw: 'ACTION: Write', name: 'ACTION', hint: 'Write' });
        expect(result[1]).toMatchObject({ raw: 'FORMAT — Blog Post', name: 'FORMAT', hint: 'Blog Post' });
        expect(result[2]).toMatchObject({ raw: 'TOPIC', name: 'TOPIC', hint: '' });
        expect(result[3]).toMatchObject({ raw: 'AUDIENCE', name: 'AUDIENCE', hint: '' });
    });

    test('should handle variables with regex special characters', () => {
        const content = "Calculate [A + B (math)?] using [C*D].";
        const result = parseVariables(content);
        expect(result[0]).toMatchObject(
            { raw: 'A + B (math)?', name: 'A + B (math)?', hint: '' }
        );
        expect(result[1]).toMatchObject(
            { raw: 'C*D', name: 'C*D', hint: '' }
        );
    });

    test('should handle variables with leading/trailing spaces', () => {
        const content = "Hello [ NAME ].";
        const result = parseVariables(content);
        expect(result[0]).toMatchObject(
            { raw: ' NAME ', name: ' NAME ', hint: '' }
        );
    });

    test('should handle hints containing separator characters', () => {
        const content = "Visit [URL: http://localhost:3000].";
        const result = parseVariables(content);
        expect(result).toMatchObject([
            { raw: 'URL: http://localhost:3000', name: 'URL', hint: 'http://localhost:3000' }
        ]);
    });
});
