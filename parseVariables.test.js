const { parseVariables } = require('./app.js');

const ESCAPE_REGEX = /[-\/\\^$*+?.()|[\]{}]/g;
function getReplaceRegex(rawVar) {
    const escapedVariable = rawVar.replace(ESCAPE_REGEX, '\\$&');
    return new RegExp(`\\[${escapedVariable}\\]`, 'g');
}

describe('parseVariables function', () => {
    test('should extract a basic variable without hint', () => {
        const result = parseVariables("This is a [TOPIC] prompt.");
        expect(result[0]).toMatchObject(
            { raw: 'TOPIC', name: 'TOPIC', hint: '' }
        );
        expect("This is a [TOPIC] prompt.".replace(getReplaceRegex(result[0].raw), 'fun')).toBe("This is a fun prompt.");
    });

    test('should extract multiple basic variables', () => {
        const result = parseVariables("A [TOPIC] for [AUDIENCE].");
        expect(result[0]).toMatchObject({ raw: 'TOPIC', name: 'TOPIC', hint: '' });
        expect(result[1]).toMatchObject({ raw: 'AUDIENCE', name: 'AUDIENCE', hint: '' });
        expect("A [TOPIC] for [AUDIENCE].".replace(getReplaceRegex(result[0].raw), 'fun').replace(getReplaceRegex(result[1].raw), 'devs')).toBe("A fun for devs.");
    });

    test('should deduplicate identical variables', () => {
        const result = parseVariables("A [TOPIC] prompt about the same [TOPIC].");
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject(
            { raw: 'TOPIC', name: 'TOPIC', hint: '' }
        );
        expect("A [TOPIC] prompt about the same [TOPIC].".replace(getReplaceRegex(result[0].raw), 'JS')).toBe("A JS prompt about the same JS.");
    });

    test('should extract variable name and hint separated by colon', () => {
        const result = parseVariables("Write about [TOPIC: Data Science].");
        expect(result[0]).toMatchObject(
            { raw: 'TOPIC: Data Science', name: 'TOPIC', hint: 'Data Science' }
        );
        expect("Write about [TOPIC: Data Science].".replace(getReplaceRegex(result[0].raw), 'AI')).toBe("Write about AI.");
    });

    test('should extract variable name and hint separated by em-dash', () => {
        const result = parseVariables("Write about [TOPIC — Data Science].");
        expect(result[0]).toMatchObject(
            { raw: 'TOPIC — Data Science', name: 'TOPIC', hint: 'Data Science' }
        );
        expect("Write about [TOPIC — Data Science].".replace(getReplaceRegex(result[0].raw), 'AI')).toBe("Write about AI.");
    });

    test('should handle empty brackets correctly', () => {
        const result = parseVariables("This is an empty [] bracket.");
        expect(result[0]).toMatchObject(
            { raw: '', name: '', hint: '' }
        );
        expect("This is an empty [] bracket.".replace(getReplaceRegex(result[0].raw), 'test')).toBe("This is an empty test bracket.");
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
        const replacedContent = content
            .replace(getReplaceRegex(result[0].raw), 'Draft')
            .replace(getReplaceRegex(result[1].raw), 'book')
            .replace(getReplaceRegex(result[2].raw), 'science')
            .replace(getReplaceRegex(result[3].raw), 'students');
        expect(replacedContent).toBe("Prompt: Draft a book about science for students which will be a book.");
    });

    test('should correctly escape regex special characters in variables', () => {
        const content = "Calculate [A + B (math)?] using [C*D].";
        const result = parseVariables(content);
        expect(result[0]).toMatchObject(
            { raw: 'A + B (math)?', name: 'A + B (math)?', hint: '' }
        );
        expect(result[1]).toMatchObject(
            { raw: 'C*D', name: 'C*D', hint: '' }
        );
        expect(content.replace(getReplaceRegex(result[0].raw), '10').replace(getReplaceRegex(result[1].raw), '20')).toBe("Calculate 10 using 20.");
    });

    test('should handle variables with leading/trailing spaces', () => {
        const content = "Hello [ NAME ].";
        const result = parseVariables(content);
        expect(result[0]).toMatchObject(
            { raw: ' NAME ', name: ' NAME ', hint: '' }
        );
        expect(content.replace(getReplaceRegex(result[0].raw), 'Alice')).toBe("Hello Alice.");
    });

    test('should handle hints containing separator characters', () => {
        const content = "Visit [URL: http://localhost:3000].";
        const result = parseVariables(content);
        expect(result).toMatchObject([
            { raw: 'URL: http://localhost:3000', name: 'URL', hint: 'http://localhost:3000' }
        ]);
        expect(content.replace(getReplaceRegex(result[0].raw), 'example.com')).toBe("Visit example.com.");
    });
});
