import unittest
from generate_json import parse_prompts

class TestGenerateJson(unittest.TestCase):
    def test_parse_prompts_happy_path(self):
        mock_data = """
Part 1: Content Creation (Prompts 1–10)

Prompt 1 — Full Article Writer
You are an expert content strategist and writer specializing in [NICHE].
Prompt 2 — Twitter/X Thread Writer
You are a viral content writer for X/Twitter.
"""
        expected = {
            "categories": [
                {
                    "name": "Content Creation",
                    "prompts": [
                        {
                            "id": 1,
                            "title": "Full Article Writer",
                            "content": "You are an expert content strategist and writer specializing in [NICHE]."
                        },
                        {
                            "id": 2,
                            "title": "Twitter/X Thread Writer",
                            "content": "You are a viral content writer for X/Twitter."
                        }
                    ]
                }
            ]
        }

        result = parse_prompts(mock_data)
        self.assertEqual(result, expected)

    def test_parse_prompts_multiple_categories(self):
        mock_data = """
Part 1: Content Creation (Prompts 1–10)

Prompt 1 — Full Article Writer
Content 1
Part 2: Business and Strategy (Prompts 11–20)

Prompt 11 — Competitive Analysis
Content 11
"""
        expected = {
            "categories": [
                {
                    "name": "Content Creation",
                    "prompts": [
                        {
                            "id": 1,
                            "title": "Full Article Writer",
                            "content": "Content 1"
                        }
                    ]
                },
                {
                    "name": "Business and Strategy",
                    "prompts": [
                        {
                            "id": 11,
                            "title": "Competitive Analysis",
                            "content": "Content 11"
                        }
                    ]
                }
            ]
        }

        result = parse_prompts(mock_data)
        self.assertEqual(result, expected)

    def test_parse_prompts_empty_string(self):
        mock_data = ""
        expected = {"categories": []}
        result = parse_prompts(mock_data)
        self.assertEqual(result, expected)

    def test_parse_prompts_no_categories_or_prompts(self):
        mock_data = "Just some random text that does not match any regex."
        expected = {"categories": []}
        result = parse_prompts(mock_data)
        self.assertEqual(result, expected)

    def test_parse_prompts_removes_unwanted_text(self):
        mock_data = """
Part 1: Special Case (Prompts 1–1)

Prompt 1 — Special Prompt
This is some content. How to Get Maximum Value From This Collection More content here.
"""
        expected = {
            "categories": [
                {
                    "name": "Special Case",
                    "prompts": [
                        {
                            "id": 1,
                            "title": "Special Prompt",
                            "content": "This is some content.  More content here."
                        }
                    ]
                }
            ]
        }

        result = parse_prompts(mock_data)
        self.assertEqual(result, expected)

    def test_parse_prompts_file_not_found(self):
        with self.assertRaises(FileNotFoundError):
            parse_prompts(filename="non_existent_file_12345.txt")

    def test_parse_prompts_path_traversal(self):
        with self.assertRaises(PermissionError):
            parse_prompts(filename="../outside.txt")

if __name__ == '__main__':
    unittest.main()
