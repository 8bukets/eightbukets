import unittest
from generate_json import parse_prompts

class TestGenerateJsonIterationEdgeCases(unittest.TestCase):
    def test_leading_text_before_first_prompt(self):
        """Tests that text before the first prompt in a category is ignored by the parser."""
        mock_data = """
Part 1: Leading Text Category (Prompts 1–1)
This is some leading text that should be ignored by the loop.
Prompt 1 — Real Prompt
Real content
"""
        result = parse_prompts(mock_data)
        prompts = result["categories"][0]["prompts"]
        self.assertEqual(len(prompts), 1)
        self.assertEqual(prompts[0]["id"], 1)
        self.assertEqual(prompts[0]["title"], "Real Prompt")
        self.assertEqual(prompts[0]["content"], "Real content")

    def test_extra_em_dashes_in_title(self):
        """Tests how the greedy title regex (.*) handles extra em-dashes in the title."""
        mock_data = """
Part 1: Dash Category (Prompts 1–1)

Prompt 1 — Title — with — dashes
Content
"""
        result = parse_prompts(mock_data)
        prompts = result["categories"][0]["prompts"]
        self.assertEqual(len(prompts), 1)
        self.assertEqual(prompts[0]["id"], 1)
        # It should capture everything after the first em-dash as title
        self.assertEqual(prompts[0]["title"], "Title — with — dashes")
        self.assertEqual(prompts[0]["content"], "Content")

    def test_no_valid_prompts_in_category(self):
        """Tests that a category with no valid prompt headers returns an empty list of prompts."""
        mock_data = """
Part 1: Empty Category (Prompts 1–0)

This category has no valid prompt headers according to the regex.
Only things like Prompt A - Title or Prompt 1: Title.
"""
        result = parse_prompts(mock_data)
        self.assertEqual(len(result["categories"]), 1)
        self.assertEqual(len(result["categories"][0]["prompts"]), 0)

    def test_mixed_valid_and_invalid_headers(self):
        """Tests the parser's behavior when valid and invalid prompt headers are mixed."""
        mock_data = """
Part 1: Mixed Category (Prompts 1–2)

Prompt 1 — Valid Header
Content 1
Prompt 2 - Invalid Header (hyphen instead of em-dash)
Content 2
Prompt 3 — Another Valid Header
Content 3
"""
        result = parse_prompts(mock_data)
        prompts = result["categories"][0]["prompts"]
        # Should only find 2 valid prompts
        self.assertEqual(len(prompts), 2)
        self.assertEqual(prompts[0]["id"], 1)
        self.assertEqual(prompts[1]["id"], 3)
        # Content of prompt 1 will contain the invalid prompt 2 text as it's treated as content
        self.assertIn("Prompt 2 - Invalid Header (hyphen instead of em-dash)", prompts[0]["content"])

    def test_consecutive_prompts_no_content(self):
        """Tests that prompts with no content are handled correctly."""
        mock_data = """
Part 1: Consecutive Category (Prompts 1–2)

Prompt 1 — Title 1
Prompt 2 — Title 2
Content 2
"""
        result = parse_prompts(mock_data)
        prompts = result["categories"][0]["prompts"]
        self.assertEqual(len(prompts), 2)
        self.assertEqual(prompts[0]["id"], 1)
        self.assertEqual(prompts[0]["title"], "Title 1")
        self.assertEqual(prompts[0]["content"], "")
        self.assertEqual(prompts[1]["id"], 2)
        self.assertEqual(prompts[1]["title"], "Title 2")
        self.assertEqual(prompts[1]["content"], "Content 2")

    def test_prompt_like_string_at_very_beginning_of_category(self):
        """Tests what happens if the category content starts immediately with a prompt."""
        mock_data = """Part 1: Start Immediately (Prompts 1–1)
Prompt 1 — Instant Title
Content"""
        result = parse_prompts(mock_data)
        prompts = result["categories"][0]["prompts"]
        self.assertEqual(len(prompts), 1)
        self.assertEqual(prompts[0]["id"], 1)
        self.assertEqual(prompts[0]["title"], "Instant Title")

    def test_prompt_block_iteration_unexpected_formatting(self):
        """Tests that unexpected formatting tests how robust the regex split and indexing are."""
        mock_data = """
Part 1: Unexpected Format Category (Prompts 1–2)

Prompt 01 — Title with leading zero
Content for 1
Prompt 999999 —
Content for empty title
"""
        result = parse_prompts(mock_data)
        prompts = result["categories"][0]["prompts"]

        self.assertEqual(len(prompts), 2)

        # Test leading zero ID parses to integer correctly
        self.assertEqual(prompts[0]["id"], 1)
        self.assertEqual(prompts[0]["title"], "Title with leading zero")
        self.assertEqual(prompts[0]["content"], "Content for 1")

        # Test large ID and empty title parses correctly
        self.assertEqual(prompts[1]["id"], 999999)
        self.assertEqual(prompts[1]["title"], "")
        self.assertEqual(prompts[1]["content"], "Content for empty title")

if __name__ == '__main__':
    unittest.main()
