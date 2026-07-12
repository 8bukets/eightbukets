import json
from pathlib import Path
import re

def parse_prompts(data=None, filename='prompts.txt'):
    if data is None:
        base_dir = Path(__file__).resolve().parent
        filepath = (base_dir / filename).resolve()

        # Security check: Ensure the resolved path is within the base directory to prevent path traversal
        try:
            filepath.relative_to(base_dir)
        except ValueError:
            raise PermissionError(f"Access denied: Path traversal detected for {filename}")

        if not filepath.is_file():
            raise FileNotFoundError(f"File not found: {filepath}")

        with open(filepath, 'r', encoding='utf-8') as f:
            data = f.read()

    # Optimize by removing known artifacts globally before parsing
    data = data.replace("How to Get Maximum Value From This Collection", "")

    categories = []

    # Split by Parts
    parts = re.split(r'Part \d+: (.*) \(Prompts \d+–\d+\)', data)
    # The first element is empty string before Part 1

    prompt_regex = re.compile(r'^\s*Prompt (\d+) — ?(.*)', flags=re.MULTILINE)

    for i in range(1, len(parts), 2):
        category_name = parts[i].strip()
        category_content = parts[i+1].strip()

        prompts = []
        # Split by "Prompt X — Title"
        prompt_blocks = prompt_regex.split(category_content)
        # first element could be empty or just newline
        for j in range(1, len(prompt_blocks), 3):
            pid = int(prompt_blocks[j])
            title = prompt_blocks[j+1].strip()
            content = prompt_blocks[j+2].strip()

            prompts.append({
                "id": pid,
                "title": title,
                "content": content
            })

        categories.append({
            "name": category_name,
            "prompts": prompts
        })

    return {"categories": categories}

if __name__ == '__main__':
    data = parse_prompts()
    with open('prompts.json', 'w') as f:
        json.dump(data, f, indent=2)
