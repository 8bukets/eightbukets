const { escapeHTML } = require('./app.js');

describe('escapeHTML function', () => {
    test('should return empty/falsy values unmodified', () => {
        expect(escapeHTML('')).toBe('');
        expect(escapeHTML(null)).toBe(null);
        expect(escapeHTML(undefined)).toBe(undefined);
    });

    test('should return strings without HTML characters unmodified', () => {
        expect(escapeHTML('hello world')).toBe('hello world');
        expect(escapeHTML('12345')).toBe('12345');
        expect(escapeHTML('no special chars!')).toBe('no special chars!');
    });

    test('should escape ampersand (&)', () => {
        expect(escapeHTML('a & b')).toBe('a &amp; b');
    });

    test('should escape less than (<)', () => {
        expect(escapeHTML('a < b')).toBe('a &lt; b');
    });

    test('should escape greater than (>)', () => {
        expect(escapeHTML('a > b')).toBe('a &gt; b');
    });

    test('should escape double quotes (")', () => {
        expect(escapeHTML('say "hello"')).toBe('say &quot;hello&quot;');
    });

    test('should escape single quotes (\')', () => {
        expect(escapeHTML("say 'hello'")).toBe("say &#39;hello&#39;");
    });

    test('should escape mixed HTML characters', () => {
        const input = `<script>alert("XSS & 'injection'")</script>`;
        const expected = `&lt;script&gt;alert(&quot;XSS &amp; &#39;injection&#39;&quot;)&lt;/script&gt;`;
        expect(escapeHTML(input)).toBe(expected);
    });

    test('should escape multiple occurrences of the same character', () => {
        expect(escapeHTML('<<<>>>&&&""\'\'')).toBe('&lt;&lt;&lt;&gt;&gt;&gt;&amp;&amp;&amp;&quot;&quot;&#39;&#39;');
    });
});
