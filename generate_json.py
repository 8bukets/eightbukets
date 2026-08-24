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

    categories = []

    # Split by Parts
    parts = re.split(r'Part \d+: (.*) \(Prompts \d+–\d+\)', data)
    # The first element is empty string before Part 1

    prompt_regex = re.compile(r'^\s*Prompt (\d+) — ?(.*)', flags=re.MULTILINE)

    for i in range(1, len(parts), 2):
        category_name = parts[i].strip()
        category_content = parts[i+1].strip()

        prompts = []

        matches = prompt_regex.finditer(category_content)

        try:
            prev_match = next(matches)
        except StopIteration:
            categories.append({
                "name": category_name,
                "prompts": prompts
            })
            continue

        for match in matches:
            pid = int(prev_match.group(1))
            title = prev_match.group(2).strip()
            content = category_content[prev_match.end():match.start()].replace("How to Get Maximum Value From This Collection", "").strip()
            prompts.append({
                "id": pid,
                "title": title,
                "content": content
            })
            prev_match = match

        pid = int(prev_match.group(1))
        title = prev_match.group(2).strip()
        content = category_content[prev_match.end():].replace("How to Get Maximum Value From This Collection", "").strip()
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
