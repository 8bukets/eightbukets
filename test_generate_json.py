import unittest
from unittest.mock import patch, mock_open
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

    def test_parse_prompts_robustness(self):
        # Testing how it handles unexpected formatting
        mock_data = """
Part 1: Robustness Test (Prompts 1–5)

Prompt 1 — Normal Prompt
Content 1

Prompt 2 - Hyphen instead of em-dash
Content 2

   Prompt 3 — Leading spaces
Content 3

Prompt 4 — Multiple — em-dashes
Content 4

Prompt 5 — Nested Header
Content 5 with a fake Prompt 6 — Header in it.
"""
        # Based on current regex r'Prompt (\d+) — (.*)'
        # Prompt 2 will be MISSED because it uses a hyphen.
        # Prompt 3 should be FOUND because regex is not anchored.
        # Prompt 4 should have "Multiple — em-dashes" as title because (.*) is greedy.
        # Prompt 6 will be MISSED because it is inline, so it becomes part of the content.

        expected = {
            "categories": [
                {
                    "name": "Robustness Test",
                    "prompts": [
                        {
                            "id": 1,
                            "title": "Normal Prompt",
                            "content": "Content 1\n\nPrompt 2 - Hyphen instead of em-dash\nContent 2"
                        },
                        # id 2 missed
                        {
                            "id": 3,
                            "title": "Leading spaces",
                            "content": "Content 3"
                        },
                        {
                            "id": 4,
                            "title": "Multiple — em-dashes",
                            "content": "Content 4"
                        },
                        {
                            "id": 5,
                            "title": "Nested Header",
                            "content": "Content 5 with a fake Prompt 6 — Header in it."
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

    def test_parse_prompts_path_traversal(self):
        # Test that path traversal raises PermissionError
        with self.assertRaises(PermissionError) as cm:
            parse_prompts(filename='../foo.txt')
        self.assertEqual("Access denied: Path traversal detected for ../foo.txt", str(cm.exception))

    @patch("pathlib.Path.relative_to")
    def test_parse_prompts_path_traversal_mock(self, mock_relative_to):
        # Mock relative_to to deterministically test ValueError raising PermissionError
        mock_relative_to.side_effect = ValueError("Mocked ValueError")
        with self.assertRaises(PermissionError) as cm:
            parse_prompts(filename='dummy.txt')
        self.assertIn("Access denied: Path traversal detected for dummy.txt", str(cm.exception))

    def test_parse_prompts_file_not_found(self):
        # Test that a non-existent but safe path raises FileNotFoundError
        filename = 'non_existent_file_12345.txt'
        with self.assertRaises(FileNotFoundError) as cm:
            parse_prompts(filename=filename)
        self.assertIn("File not found:", str(cm.exception))
        self.assertIn(filename, str(cm.exception))

    def test_parse_prompts_with_directory_path(self):
        # Test that passing a directory path raises FileNotFoundError
        # '.' is always a directory and is safe within base_dir
        with self.assertRaises(FileNotFoundError) as cm:
            parse_prompts(filename='.')
        self.assertIn("File not found:", str(cm.exception))

    def test_parse_prompts_read_from_file(self):
        # Test reading from a file using mocks to cover lines 19-20
        mock_content = "Part 1: Mock Category (Prompts 1–1)\n\nPrompt 1 — Mock Title\nMock Content"
        with patch("pathlib.Path.is_file", return_value=True):
            with patch("builtins.open", mock_open(read_data=mock_content)):
                result = parse_prompts(filename="mock_prompts.txt")

        self.assertEqual(len(result["categories"]), 1)
        self.assertEqual(result["categories"][0]["name"], "Mock Category")
        self.assertEqual(result["categories"][0]["prompts"][0]["title"], "Mock Title")

    @patch("pathlib.Path.is_file")
    def test_parse_prompts_mocked_file_not_found(self, mock_is_file):
        # Mock is_file to always return False to deterministically test line 17
        mock_is_file.return_value = False
        filename = "some_random_file.txt"

        with self.assertRaises(FileNotFoundError) as cm:
            parse_prompts(filename=filename)

        self.assertIn("File not found:", str(cm.exception))
        self.assertIn(filename, str(cm.exception))

    @patch("pathlib.Path.is_file")
    def test_missing_file_error_in_parse_prompts(self, mock_is_file):
        mock_is_file.return_value = False
        with self.assertRaises(FileNotFoundError) as cm:
            parse_prompts(filename='this_file_definitely_does_not_exist_at_all.txt')
        self.assertIn("File not found:", str(cm.exception))
        self.assertIn("this_file_definitely_does_not_exist_at_all.txt", str(cm.exception))

if __name__ == '__main__':
    unittest.main()
