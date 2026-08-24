const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="sidebar-content"></div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = { clipboard: { writeText: () => Promise.resolve() } };
global.fetch = () => Promise.resolve({ json: () => Promise.resolve({ categories: [] }) });

const app = require('./app.js');
const { renderSidebar } = app;

app.setSidebarContent(document.getElementById('sidebar-content'));

// Create massive dummy data: 100 categories, 50 prompts each = 5000 prompts
const categories = [];
for (let i = 0; i < 100; i++) {
    const prompts = [];
    for (let j = 0; j < 50; j++) {
        const id = i * 50 + j;
        prompts.push({
            id: id,
            title: `Prompt Title ${id} about some topic`,
            content: `This is the content of prompt ${id} with [VAR]`,
            titleLower: `prompt title ${id} about some topic`,
            contentLower: `this is the content of prompt ${id} with [var]`
        });
    }
    categories.push({
        name: `Category ${i}`,
        prompts: prompts
    });
}

// Initial full render
renderSidebar(categories, '');

function runPerfTest() {
    const start = process.hrtime.bigint();

    // Simulate typing 10 characters (a user typing a query)
    const searchTerms = ['a', 'ab', 'abo', 'abou', 'about', 'about ', 'about t', 'about to', 'about top', 'about topi'];
    for (let i = 0; i < 10; i++) {
        renderSidebar(categories, searchTerms[i]);
    }

    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000;
}

// Warm up
for (let i=0; i<3; i++) runPerfTest();

let total = 0;
for (let i=0; i<5; i++) {
    const t = runPerfTest();
    total += t;
}
console.log(`Average time for 10 keystrokes: ${(total/5).toFixed(2)} ms`);
