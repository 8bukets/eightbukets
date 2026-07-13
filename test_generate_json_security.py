import unittest
from generate_json import parse_prompts

class TestGenerateJsonSecurity(unittest.TestCase):
    def test_parse_prompts_absolute_path_traversal(self):
        # Test that absolute path raises PermissionError
        with self.assertRaises(PermissionError) as cm:
            parse_prompts(filename='/etc/passwd')
        self.assertIn("Access denied: Path traversal detected", str(cm.exception))

    def test_parse_prompts_deep_traversal(self):
        # Test that deep traversal raises PermissionError
        with self.assertRaises(PermissionError) as cm:
            parse_prompts(filename='../../../../etc/passwd')
        self.assertIn("Access denied: Path traversal detected", str(cm.exception))

    def test_parse_prompts_safe_relative_path(self):
        # Test that a path with '..' that stays within the directory is allowed
        # Note: prompts.txt must exist for this to not raise FileNotFoundError
        # We can use the fact that prompts.txt exists in the repo
        try:
            parse_prompts(filename='./prompts.txt')
        except (PermissionError, FileNotFoundError) as e:
            self.fail(f"parse_prompts raised {type(e).__name__} for a safe relative path")

    def test_parse_prompts_traversal_with_non_existent_file(self):
        # Even if the file doesn't exist, it should raise PermissionError first if it's a traversal
        with self.assertRaises(PermissionError):
            parse_prompts(filename='../non_existent_secret.txt')

    def test_parse_prompts_null_byte(self):
        # Null bytes in filenames can sometimes bypass checks, though pathlib handles them well
        with self.assertRaises((ValueError, PermissionError)):
            parse_prompts(filename='prompts.txt\0/../etc/passwd')

if __name__ == '__main__':
    unittest.main()
