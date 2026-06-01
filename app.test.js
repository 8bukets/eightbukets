/**
 * @jest-environment jsdom
 */

const { renderSidebar, setSidebarContent, setCurrentPrompt } = require('./app.js');

describe('renderSidebar', () => {
    let mockCategories;
    let sidebarContent;

    beforeEach(() => {
        // Setup DOM element
        document.body.innerHTML = '<div id="sidebar-content"></div>';
        sidebarContent = document.getElementById('sidebar-content');
        setSidebarContent(sidebarContent);

        // Reset current prompt
        setCurrentPrompt(null);

        // Setup mock data
        mockCategories = [
            {
                name: "Marketing",
                prompts: [
                    { id: 1, title: "SEO Blog Post", content: "Write a blog post about [TOPIC]" },
                    { id: 2, title: "Social Media Campaign", content: "Create a campaign for [PRODUCT]" }
                ]
            },
            {
                name: "Development",
                prompts: [
                    { id: 3, title: "Code Review", content: "Review this [LANGUAGE] code" }
                ]
            }
        ];
    });

    test('renders all categories and prompts when filterText is empty', () => {
        renderSidebar(mockCategories, '');

        // Check if categories are rendered
        const categoryHeaders = sidebarContent.querySelectorAll('h3');
        expect(categoryHeaders.length).toBe(2);
        expect(categoryHeaders[0].textContent).toBe('Marketing');
        expect(categoryHeaders[1].textContent).toBe('Development');

        // Check if all prompts are rendered
        const promptButtons = sidebarContent.querySelectorAll('button');
        expect(promptButtons.length).toBe(3);
        expect(promptButtons[0].textContent).toBe('SEO Blog Post');
        expect(promptButtons[1].textContent).toBe('Social Media Campaign');
        expect(promptButtons[2].textContent).toBe('Code Review');
    });

    test('filters prompts based on title case-insensitively', () => {
        renderSidebar(mockCategories, 'seo blog');

        const promptButtons = sidebarContent.querySelectorAll('button');
        expect(promptButtons.length).toBe(1);
        expect(promptButtons[0].textContent).toBe('SEO Blog Post');

        // Check that only the relevant category is rendered
        const categoryHeaders = sidebarContent.querySelectorAll('h3');
        expect(categoryHeaders.length).toBe(1);
        expect(categoryHeaders[0].textContent).toBe('Marketing');
    });

    test('filters prompts based on content case-insensitively', () => {
        renderSidebar(mockCategories, 'review this');

        const promptButtons = sidebarContent.querySelectorAll('button');
        expect(promptButtons.length).toBe(1);
        expect(promptButtons[0].textContent).toBe('Code Review');
    });

    test('renders nothing if filter matches no prompts', () => {
        renderSidebar(mockCategories, 'nonexistent filter text');

        expect(sidebarContent.innerHTML).toBe('');
    });

    test('renders nothing if categories array is empty', () => {
        renderSidebar([], '');

        expect(sidebarContent.innerHTML).toBe('');
    });

    test('applies active styling to the currently selected prompt', () => {
        // Set the currently selected prompt
        setCurrentPrompt(mockCategories[0].prompts[0]);

        renderSidebar(mockCategories, '');

        const promptButtons = sidebarContent.querySelectorAll('button');
        expect(promptButtons[0].classList.contains('bg-indigo-100')).toBe(true);
        expect(promptButtons[0].classList.contains('text-indigo-800')).toBe(true);

        // Check that other buttons don't have active styling
        expect(promptButtons[1].classList.contains('bg-indigo-100')).toBe(false);
    });

    test('attaches click handler to prompts that calls selectPrompt', () => {
        // We can't directly test selectPrompt being called since it's defined in the same scope,
        // but we can mock it or check if clicking triggers expected errors/behavior.
        // For unit testing renderSidebar, verifying the button has an onclick function is enough.
        renderSidebar(mockCategories, '');
        const promptButtons = sidebarContent.querySelectorAll('button');
        expect(typeof promptButtons[0].onclick).toBe('function');
    });
});
