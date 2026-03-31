# Roadmap: NVIDIA Copilot VS Code Extension

This document outlines the planned features and improvements for the NVIDIA Copilot extension, aiming to provide a high-performance, AI-powered coding experience using NVIDIA's API.

## Short-term Goals (Phase 1)
- [x] **Secure API Key Management**: Port storage to `VS Code Secrets`.
- [x] **Context-Aware Chat**: Automatic selection/file content passage to LLM.
- [x] **Markdown Rendering**: Support for code blocks and rich text in chat.
- [x] **Model Switching**: UI to select from available NVIDIA models.
- [ ] **Inline Code Suggestions**: Ghost text suggestions (similar to Copilot).
- [ ] **Multi-turn Conversation History**: Maintaining context across multiple chat prompts.

## Mid-term Goals (Phase 2)
- [ ] **RAG (Retrieval-Augmented Generation)**: Indexing the local workspace to answer complex repository-wide questions.
- [ ] **Custom System Prompts**: Allowing users to define specific personas or rules for the AI.
- [ ] **Streaming Performance Optimization**: Reducing latency in token rendering.
- [ ] **File Preview/Diffs**: Showing suggested changes in a diff view before applying.

## Long-term Goals (Phase 3)
- [ ] **NVIDIA NIM Integration**: Support for self-hosted or specialized NIM microservices.
- [ ] **Voice Commands**: Integrated voice-to-code functionality.
- [ ] **Automated Unit Test Generation**: One-click test creation based on current file context.
- [ ] **Security Auditing**: Using specialized NVIDIA models to scan for vulnerabilities.

## Contribution
We welcome feedback and contributions! Feel free to suggest new features or report issues.
