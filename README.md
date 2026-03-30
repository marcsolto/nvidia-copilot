# nvidia-copilot README

This is the README for your extension "nvidia-copilot". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

# NVIDIA Copilot VS Code Extension

Extensão VS Code para integrar com a API NVIDIA Chat Completions.

## 🚀 Instalação

1. clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/nvidia-copilot.git
cd nvidia-copilot
```

2. Instale as dependências

```bash
npm install
```

3. Compile

```bash
npm run compile
```

4. Execute em modo de depuração

- No VS Code, pressione `F5` para abrir um novo Extension Host.

## ⚙️ Configuração

No `settings.json`, adicione:

```json
{
	"nvidiaCopilot.apiKey": "SEU_API_KEY_NVIDIA",
	"nvidiaCopilot.model": "meta/llama3-70b-instruct"
}
```

- `nvidiaCopilot.apiKey` (obrigatório): chave API NVIDIA.
- `nvidiaCopilot.model` (opcional): modelo a ser usado; padrão `meta/llama3-70b-instruct`.

## ▶️ Uso

1. Abra um arquivo de código no VS Code.
2. Execute o comando `nvidia.chat` (Command Palette: `Ctrl+Shift+P`).
3. Digite sua pergunta e confirme.
4. A extensão envia a pergunta + contexto para a API NVIDIA e mostra a resposta.

## 📦 Arquivos principais

- `src/extension.ts`: implementação do comando, leitura de config, chamada HTTP e resposta.
- `src/test/extension.test.ts`: teste boilerplate.
- `package.json`: contribuições, scripts, dependências e ativação (`onCommand:nvidia.chat`).

## 🧪 Testes

```bash
npm run test
```

## 🛠️ Scripts úteis

- `npm run lint`
- `npm run check-types`
- `npm run watch`

## 🔧 Comportamento atual

- valida `apiKey` antes da chamada;
- usa modelo de config ou padrão;
- inclui prompt do usuário e contextos:
	- texto inteiro do documento;
	- seleção de texto, se houver;
- mostra erro em caso de falha de API.

## 💡 Melhorias futuras

- histórico de conversas;
- opções de prompt system + assistant;
- suporte a mensageria assincrona e fallback de rede;
- paginação/recorte de arquivo para evitar payloads muito grandes.
