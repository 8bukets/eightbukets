const { escapeHTML } = require('./app.js');

describe('escapeHTML function', () => {
    test('returns original string when there are no special characters', () => {
        expect(escapeHTML('Hello World')).toBe('Hello World');
    });

    test('escapes ampersand (&)', () => {
        expect(escapeHTML('Peanut Butter & Jelly')).toBe('Peanut Butter &amp; Jelly');
    });

    test('escapes less than (<)', () => {
        expect(escapeHTML('1 < 2')).toBe('1 &lt; 2');
    });

    test('escapes greater than (>)', () => {
        expect(escapeHTML('2 > 1')).toBe('2 &gt; 1');
    });

    test('escapes single quote (\')', () => {
        expect(escapeHTML("It's a beautiful day")).toBe('It&#39;s a beautiful day');
    });

    test('escapes double quote (")', () => {
        expect(escapeHTML('He said "Hello"')).toBe('He said &quot;Hello&quot;');
    });

    test('escapes multiple occurrences of the same character', () => {
        expect(escapeHTML('&&&&')).toBe('&amp;&amp;&amp;&amp;');
    });

    test('escapes multiple different characters in a complex string', () => {
        expect(escapeHTML('<script>alert("XSS & \'attack\'")</script>'))
            .toBe('&lt;script&gt;alert(&quot;XSS &amp; &#39;attack&#39;&quot;)&lt;/script&gt;');
    });

    test('returns falsy inputs as is', () => {
        expect(escapeHTML(null)).toBeNull();
        expect(escapeHTML(undefined)).toBeUndefined();
        expect(escapeHTML('')).toBe('');
    });
});
