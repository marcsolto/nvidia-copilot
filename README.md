# NVIDIA Copilot VS Code Extension

An AI-powered coding assistant for VS Code using NVIDIA's high-performance LLMs and Embedding models. Experience a Copilot-like workflow with full workspace awareness.

## ✨ Key Features

- **💬 Multi-turn Chat**: Interactive chat sidebar for continuous conversation.
- **🔍 RAG (Retrieval-Augmented Generation)**: Semantic search across your entire workspace to provide relevant code context.
- **💡 Inline Suggestions (Ghost Text)**: Real-time code completions as you type.
- **🔐 Secure Storage**: Your NVIDIA API Key is stored safely using VS Code's Secret Storage.
- **⚙️ Model Switching**: Easily list and switch between different NVIDIA models.

## 🚀 Installation

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) installed.
2. **Clone and Install**:
   ```bash
   git clone https://github.com/marcsolto/nvidia-copilot.git
   cd nvidia-copilot
   npm install
   ```
3. **Build**:
   ```bash
   npm run compile
   ```
4. **Run**:
   - Press `F5` in VS Code to launch the Extension Development Host.

## ⚙️ Configuration

1. Open the Command Palette (`Ctrl+Shift+P`).
2. Run **NVIDIA: Set API Key** and enter your key from [NVIDIA Build](https://build.nvidia.com/).
3. (Optional) Run **NVIDIA: List available models** to select your preferred LLM.
4. (Optional) Toggle **NVIDIA Copilot: Enable Inline Suggestions** in VS Code Settings.

## ▶️ Usage

### 🗨️ Chat with AI
- Run **NVIDIA: Ask about code** from the Command Palette.
- Use the sidebar to ask questions. The AI will automatically include your active file selection as context.

### 📂 Workspace Context (RAG)
- To enable repository-wide awareness, run **NVIDIA: Index Workspace (RAG)**.
- Once indexed, the AI will perform semantic searches to find relevant snippets from other files in your project.

### ⌨️ Inline Completions
- Just start typing in any code file.
- Press `Tab` to accept a suggestion.

## 🛠️ Development

- `npm run watch`: Automatically rebuild on changes.
- `npm run compile`: Full build and lint.
- `src/ragService.ts`: Core logic for indexing and search.
- `src/webviewPanel.ts`: Interactive chat UI.

## 📄 License
MIT
