const { parseVariables } = require('./app.js');

describe('parseVariables function', () => {
    test('should extract a basic variable without hint', () => {
        const result = parseVariables("This is a [TOPIC] prompt.");
        expect(result).toEqual([
            { raw: 'TOPIC', name: 'TOPIC', hint: '', replaceRegex: expect.any(RegExp) }
        ]);
        expect("This is a [TOPIC] prompt.".replace(result[0].replaceRegex, 'fun')).toBe("This is a fun prompt.");
    });

    test('should extract multiple basic variables', () => {
        const result = parseVariables("A [TOPIC] for [AUDIENCE].");
        expect(result).toEqual([
            { raw: 'TOPIC', name: 'TOPIC', hint: '', replaceRegex: expect.any(RegExp) },
            { raw: 'AUDIENCE', name: 'AUDIENCE', hint: '', replaceRegex: expect.any(RegExp) }
        ]);
        expect("A [TOPIC] for [AUDIENCE].".replace(result[0].replaceRegex, 'fun').replace(result[1].replaceRegex, 'devs')).toBe("A fun for devs.");
    });

    test('should deduplicate identical variables', () => {
        const result = parseVariables("A [TOPIC] prompt about the same [TOPIC].");
        expect(result).toEqual([
            { raw: 'TOPIC', name: 'TOPIC', hint: '', replaceRegex: expect.any(RegExp) }
        ]);
        expect("A [TOPIC] prompt about the same [TOPIC].".replace(result[0].replaceRegex, 'JS')).toBe("A JS prompt about the same JS.");
    });

    test('should extract variable name and hint separated by colon', () => {
        const result = parseVariables("Write about [TOPIC: Data Science].");
        expect(result).toEqual([
            { raw: 'TOPIC: Data Science', name: 'TOPIC', hint: 'Data Science', replaceRegex: expect.any(RegExp) }
        ]);
        expect("Write about [TOPIC: Data Science].".replace(result[0].replaceRegex, 'AI')).toBe("Write about AI.");
    });

    test('should extract variable name and hint separated by em-dash', () => {
        const result = parseVariables("Write about [TOPIC — Data Science].");
        expect(result).toEqual([
            { raw: 'TOPIC — Data Science', name: 'TOPIC', hint: 'Data Science', replaceRegex: expect.any(RegExp) }
        ]);
        expect("Write about [TOPIC — Data Science].".replace(result[0].replaceRegex, 'AI')).toBe("Write about AI.");
    });

    test('should handle empty brackets correctly', () => {
        const result = parseVariables("This is an empty [] bracket.");
        expect(result).toEqual([
            { raw: '', name: '', hint: '', replaceRegex: expect.any(RegExp) }
        ]);
        expect("This is an empty [] bracket.".replace(result[0].replaceRegex, 'test')).toBe("This is an empty test bracket.");
    });

    test('should return empty array if no variables present', () => {
        const result = parseVariables("This is a string without any variables.");
        expect(result).toEqual([]);
    });

    test('should handle complex mixed variables', () => {
        const content = "Prompt: [ACTION: Write] a [FORMAT — Blog Post] about [TOPIC] for [AUDIENCE] which will be a [FORMAT — Blog Post].";
        const result = parseVariables(content);
        expect(result).toEqual([
            { raw: 'ACTION: Write', name: 'ACTION', hint: 'Write', replaceRegex: expect.any(RegExp) },
            { raw: 'FORMAT — Blog Post', name: 'FORMAT', hint: 'Blog Post', replaceRegex: expect.any(RegExp) },
            { raw: 'TOPIC', name: 'TOPIC', hint: '', replaceRegex: expect.any(RegExp) },
            { raw: 'AUDIENCE', name: 'AUDIENCE', hint: '', replaceRegex: expect.any(RegExp) }
        ]);
        const replacedContent = content
            .replace(result[0].replaceRegex, 'Draft')
            .replace(result[1].replaceRegex, 'book')
            .replace(result[2].replaceRegex, 'science')
            .replace(result[3].replaceRegex, 'students');
        expect(replacedContent).toBe("Prompt: Draft a book about science for students which will be a book.");
    });

    test('should correctly escape regex special characters in variables', () => {
        const content = "Calculate [A + B (math)?] using [C*D].";
        const result = parseVariables(content);
        expect(result).toEqual([
            { raw: 'A + B (math)?', name: 'A + B (math)?', hint: '', replaceRegex: expect.any(RegExp) },
            { raw: 'C*D', name: 'C*D', hint: '', replaceRegex: expect.any(RegExp) }
        ]);
        expect(content.replace(result[0].replaceRegex, '10').replace(result[1].replaceRegex, '20')).toBe("Calculate 10 using 20.");
    });

    test('should handle variables with leading/trailing spaces', () => {
        const content = "Hello [ NAME ].";
        const result = parseVariables(content);
        expect(result).toEqual([
            { raw: ' NAME ', name: ' NAME ', hint: '', replaceRegex: expect.any(RegExp) }
        ]);
        expect(content.replace(result[0].replaceRegex, 'Alice')).toBe("Hello Alice.");
    });
});
