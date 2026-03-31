# NVIDIA Copilot VS Code Extension

A VS Code extension that integrates with NVIDIA Chat Completions API to answer questions about your code.

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/marcsolto/nvidia-copilot.git
cd nvidia-copilot
```

2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run compile
```

4. Start debugging in VS Code:

- Press `F5` to launch a new Extension Development Host.

## ⚙️ Configuration

Add this to your `settings.json`:

```json
{
  "nvidiaCopilot.apiKey": "YOUR_NVIDIA_API_KEY",
  "nvidiaCopilot.model": "meta/llama3-70b-instruct"
}
```

- `nvidiaCopilot.apiKey` (required): your NVIDIA API key.
- `nvidiaCopilot.model` (optional): model to use (default: `meta/llama3-70b-instruct`).

## ▶️ Usage

1. Open a code file in VS Code.
2. Run command `nvidia.copilot` (Command Palette: `Ctrl+Shift+P`).
3. Enter your question and submit.
4. The extension sends the question + context to NVIDIA API and shows the response.

### Listing Available Models

- Run command `nvidia.listModels` to fetch and select from available NVIDIA models.
- The selected model will be set in your `nvidiaCopilot.model` configuration.

## 📦 Key files

- `src/extension.ts`: command implementation, configuration reading, API call, and response handling.
- `src/test/extension.test.ts`: boilerplate test.
- `package.json`: contribution points, scripts, dependencies, and activation (`onCommand:nvidia.copilot`, `onCommand:nvidia.listModels`).

## 🧪 Tests

```bash
npm run test
```

## 🛠️ Useful scripts

- `npm run lint`
- `npm run check-types`
- `npm run watch`

## 🔍 Current behavior

- validates `apiKey` before sending request;
- uses configured model or default;
- includes user prompt and context:
  - full document text;
  - selected text (if available);
- shows error message on API failure.

## 💡 Future improvements

- conversation history support;
- system + assistant prompt options;
- async queueing and network retry/fallback;
- chunking large files to avoid huge payloads.
