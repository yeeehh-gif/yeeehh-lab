"""
Vocabulary extraction via DeepSeek API + NotebookLM source content.
1. Fetch each source's fulltext from NotebookLM CLI
2. Send content to DeepSeek API for vocabulary extraction
3. Return structured vocabulary items
"""
import json
import sys
import subprocess
import os
import urllib.request
import urllib.error

DEEPSEEK_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

EXTRACTION_PROMPT = """Extract useful English vocabulary, phrases, and sentence patterns from the text below.
For each item, provide:
- word: the word or phrase (in English)
- definition: meaning in Simplified Chinese (简体中文)
- example_sentence: the original sentence from the text where this appears
- category: "reading" for academic/written, "speaking" for conversational, "writing" for composition use

Only include items worth learning (not "the", "a", "is", etc). Pick the most useful ones.
Limit to at most 20 items.

Return ONLY a JSON array, no markdown fences, no other text:
[{"word":"ubiquitous","definition":"无处不在的","example_sentence":"The internet has become ubiquitous in modern life.","category":"reading"}]

Text:
{text}"""


def get_source_fulltext(source_id: str) -> tuple[str, str]:
    """Fetch fulltext and title of a NotebookLM source."""
    result = subprocess.run(
        ["notebooklm", "source", "fulltext", source_id, "--json"],
        capture_output=True, text=True, timeout=30,
        env={**os.environ},
    )
    if result.returncode != 0:
        raise RuntimeError(f"Fulltext failed: {result.stderr}")

    data = json.loads(result.stdout)
    content = data.get("content", "")
    title = data.get("title", "Unknown source")

    if not content:
        raise ValueError(f"Empty content for {source_id}")
    return content, title


def extract_with_deepseek(text: str) -> list[dict]:
    """Send text to DeepSeek API for vocabulary extraction."""
    if not DEEPSEEK_KEY:
        raise RuntimeError("DEEPSEEK_API_KEY not set")

    prompt = EXTRACTION_PROMPT.replace("{text}", text[:10000])

    body = json.dumps({
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a professional English teacher. Extract vocabulary from text and return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 4096,
    }).encode("utf-8")

    req = urllib.request.Request(DEEPSEEK_URL, data=body, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEEPSEEK_KEY}",
    })

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        raise RuntimeError(f"DeepSeek API error {e.code}: {body_text}")

    raw = result["choices"][0]["message"]["content"].strip()
    # Remove markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()
        if raw.startswith("json"):
            raw = raw[4:].strip()

    items = json.loads(raw)
    if not isinstance(items, list):
        raise RuntimeError(f"DeepSeek returned non-array: {raw[:200]}")
    return items


def run(selections_json: str) -> str:
    if not DEEPSEEK_KEY:
        return json.dumps({"error": "DEEPSEEK_API_KEY not set"}, ensure_ascii=False)

    selections = json.loads(selections_json)
    if not selections:
        return json.dumps([], ensure_ascii=False)

    all_items = []

    for i, sel in enumerate(selections):
        source_id = sel["sourceId"]
        title = sel.get("title", source_id)
        notebook = sel.get("notebookName", "")

        print(f"[{i+1}/{len(selections)}] {title}", file=sys.stderr)

        try:
            content, src_title = get_source_fulltext(source_id)
            print(f"  Fetched {len(content)} chars", file=sys.stderr)

            items = extract_with_deepseek(content)
            for item in items:
                item["source_note"] = notebook or src_title
                item["selected"] = True
            all_items.extend(items)
            print(f"  → {len(items)} words extracted", file=sys.stderr)

        except Exception as e:
            print(f"  ⚠ Failed: {e}", file=sys.stderr)

    return json.dumps(all_items, ensure_ascii=False)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: extract-vocabulary.py '<json_array>'"}, ensure_ascii=False))
        sys.exit(1)
    print(run(sys.argv[1]))
