import unittest
from generate_json import parse_prompts

class TestGenerateJsonRobustness(unittest.TestCase):
    def test_parse_prompts_with_hyphen_instead_of_emdash(self):
        # Current regex expects ' — ' (em-dash). If it's ' - ' (hyphen), it should fail to parse the prompt.
        mock_data = """
Part 1: Hyphen Test (Prompts 1–1)

Prompt 1 - Hyphen Title
Content
"""
        result = parse_prompts(mock_data)
        # Should not find any prompts because of the hyphen
        self.assertEqual(len(result["categories"][0]["prompts"]), 0)

    def test_parse_prompts_with_prompt_like_text_in_content(self):
        # Test how robust the split is when content contains something that looks like a prompt header
        mock_data = """
Part 1: Content Test (Prompts 1–1)

Prompt 1 — Real Title
This content contains Prompt 2 — Fake Title inside it.
"""
        result = parse_prompts(mock_data)
        # It currently WILL split on "Prompt 2 — Fake Title" because re.split is used on the whole content
        # and the regex matches it.
        # Note: (.*) is greedy, so if there are other prompts it might capture more than expected if not careful,
        # but re.split splits ON the match, so it's the text BETWEEN matches that becomes content.
        prompts = result["categories"][0]["prompts"]
        self.assertEqual(len(prompts), 2)
        self.assertEqual(prompts[0]["title"], "Real Title")
        # Due to (.*) being greedy in the regex `Prompt (\d+) — (.*)`,
        # the title of the second "prompt" will be "Fake Title inside it."
        self.assertEqual(prompts[1]["title"], "Fake Title inside it.")

    def test_parse_prompts_no_content_after_last_prompt(self):
        mock_data = """
Part 1: Empty Test (Prompts 1–1)

Prompt 1 — Title Only"""
        result = parse_prompts(mock_data)
        prompts = result["categories"][0]["prompts"]
        self.assertEqual(len(prompts), 1)
        self.assertEqual(prompts[0]["title"], "Title Only")
        self.assertEqual(prompts[0]["content"], "")

    def test_parse_prompts_extra_whitespace_in_header(self):
        # Current regex is r'Prompt (\d+) — (.*)'
        # It expects exactly one space before and after em-dash.
        mock_data = """
Part 1: Whitespace Test (Prompts 1–1)

Prompt 1  —  Title with extra spaces
Content
"""
        result = parse_prompts(mock_data)
        # It will NOT match because of double spaces.
        self.assertEqual(len(result["categories"][0]["prompts"]), 0)

    def test_parse_prompts_malformed_index(self):
        # What if it's not a number? Regex r'Prompt (\d+) — (.*)' won't match.
        mock_data = """
Part 1: Malformed Test (Prompts 1–1)

Prompt A — Not a number
Content
"""
        result = parse_prompts(mock_data)
        self.assertEqual(len(result["categories"][0]["prompts"]), 0)

if __name__ == '__main__':
    unittest.main()
