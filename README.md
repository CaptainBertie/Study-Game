# MMAN1130 Study Game (React + TypeScript + Vite)

A lightweight quiz app you can run locally. Supports importing your own questions from a JSON file.

## Prerequisites
- Node.js 18+ (20+ recommended)
- npm (comes with Node)

## Run locally
```bash
cd mman1130-quiz
npm install
npm run dev
```
Open the printed URL (usually `http://localhost:5173`). Hot reload is enabled.

## Build and preview (optional)
```bash
npm run build
npm run preview
```

## Create an offline zip (no install required)
```bash
npm run pack:offline
```
This produces `mman1130-quiz-offline.zip` in the project root. Share that file. Recipients can unzip and double-click `index.html` inside the folder to play.

If the OS blocks local scripts, right-click `index.html` → Open.

## Importing your own questions (JSON)
On the Start screen, use the “Import questions (JSON)” box to drag-and-drop a `.json` file or click “browse`. If parsing succeeds you’ll see a message like “Loaded 20 questions”. Click Start Quiz to begin.

### JSON format
- The file must be a JSON array of question objects.
- Each question must have a `prompt`, `choices` and `correctIndex`.
- `choices` can be either strings or objects with `label` and `text`.
- `id` and `explanation` are optional.
- You may use `answerIndex` instead of `correctIndex`.

#### Minimal example
```json
[
  {
    "prompt": "What is 2 + 2?",
    "choices": ["3", "4", "5", "22"],
    "correctIndex": 1
  }
]
```

#### Full featured example
```json
[
  {
    "id": 1,
    "prompt": "What is the primary purpose of engineering standards?",
    "choices": [
      { "label": "A", "text": "To limit innovation in design" },
      { "label": "B", "text": "To reduce manufacturing costs only" },
      { "label": "C", "text": "To ensure safety, reliability, and consistency" },
      { "label": "D", "text": "To increase paperwork in engineering projects" }
    ],
    "correctIndex": 2,
    "explanation": "Standards codify best practice so parts and documentation are compatible across suppliers and time."
  }
]
```

### Validation rules
- `prompt`: non-empty string
- `choices`: at least 2 entries
  - If an entry is a string, it becomes `{ label: "A|B|C…", text: "the string" }`
  - If an entry is an object, it should contain `text`; `label` is optional
- `correctIndex` (or `answerIndex`): 0-based index inside `choices`
- `explanation`: optional string

### Tips
- If `id` is omitted, it will auto-number starting from 1.
- If `label` is omitted, letters A, B, C, … are assigned automatically.
- Re-importing a file replaces the current quiz set.

### Keyboard navigation
- Up/Down: move between answers
- Enter: select focused answer and go to next question
- Left/Right: switch questions

## Project structure
- `src/App.tsx`: main quiz component (UI + logic, including importer)
- `src/main.tsx`: Vite bootstrap
- `index.html`: app entry

## License
For study purposes only.
