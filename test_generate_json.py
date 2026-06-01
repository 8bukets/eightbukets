import unittest
import generate_json

class TestGenerateJson(unittest.TestCase):
    def setUp(self):
        # Save the original raw_data so we can restore it after tests
        self.original_raw_data = generate_json.raw_data

    def tearDown(self):
        # Restore the original raw_data
        generate_json.raw_data = self.original_raw_data

    def test_parse_prompts_basic(self):
        generate_json.raw_data = """
Part 1: Content Creation (Prompts 1–2)

Prompt 1 — Full Article Writer
You are an expert content strategist.
Prompt 2 — Twitter/X Thread Writer
You are a viral content writer for X/Twitter.
"""
        result = generate_json.parse_prompts()
        self.assertEqual(len(result["categories"]), 1)
        self.assertEqual(result["categories"][0]["name"], "Content Creation")
        self.assertEqual(len(result["categories"][0]["prompts"]), 2)

        self.assertEqual(result["categories"][0]["prompts"][0]["id"], 1)
        self.assertEqual(result["categories"][0]["prompts"][0]["title"], "Full Article Writer")
        self.assertEqual(result["categories"][0]["prompts"][0]["content"], "You are an expert content strategist.")

        self.assertEqual(result["categories"][0]["prompts"][1]["id"], 2)
        self.assertEqual(result["categories"][0]["prompts"][1]["title"], "Twitter/X Thread Writer")
        self.assertEqual(result["categories"][0]["prompts"][1]["content"], "You are a viral content writer for X/Twitter.")

    def test_parse_prompts_multiple_categories(self):
        generate_json.raw_data = """
Part 1: Content Creation (Prompts 1–1)

Prompt 1 — First Prompt
First prompt content.
Part 2: Marketing (Prompts 2–2)

Prompt 2 — Second Prompt
Second prompt content.
"""
        result = generate_json.parse_prompts()
        self.assertEqual(len(result["categories"]), 2)
        self.assertEqual(result["categories"][0]["name"], "Content Creation")
        self.assertEqual(len(result["categories"][0]["prompts"]), 1)
        self.assertEqual(result["categories"][1]["name"], "Marketing")
        self.assertEqual(len(result["categories"][1]["prompts"]), 1)

    def test_parse_prompts_removes_specific_string(self):
        generate_json.raw_data = """
Part 1: Content Creation (Prompts 1–1)

Prompt 1 — Full Article Writer
How to Get Maximum Value From This Collection
You are an expert content strategist.
"""
        result = generate_json.parse_prompts()
        self.assertEqual(len(result["categories"]), 1)
        self.assertEqual(len(result["categories"][0]["prompts"]), 1)

        expected_content = "You are an expert content strategist."
        self.assertEqual(result["categories"][0]["prompts"][0]["content"], expected_content)

    def test_parse_prompts_empty_data(self):
        generate_json.raw_data = ""
        result = generate_json.parse_prompts()
        self.assertEqual(result["categories"], [])

if __name__ == '__main__':
    unittest.main()
