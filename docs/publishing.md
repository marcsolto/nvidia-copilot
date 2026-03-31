# Publishing to VS Code Marketplace

This guide explains how to package and publish the **NVIDIA Copilot** extension.

## 1. Create a Publisher
Before publishing, you need a publisher ID.
- Go to the [Azure DevOps](https://dev.azure.com/) portal and create a Personal Access Token (PAT) with `Marketplace: Manage` scope.
- Create a publisher at the [Visual Studio Marketplace Management Portal](https://marketplace.visualstudio.com/manage).

## 2. Install VSCE
`vsce` is the command-line tool for packaging and publishing VS Code extensions.
```bash
npm install -g @vscode/vsce
```

## 3. Login
Login with your publisher ID and PAT:
```bash
vsce login <publisher-id>
```

## 4. Packaging
To create a `.vsix` file for manual sharing or local installation:
```bash
vsce package
```
This will generate a file like `nvidia-copilot-0.0.1.vsix`.

## 5. Publishing
To publish directly to the marketplace:
```bash
vsce publish
```

### 📝 Important Notes
- **Version**: Ensure you increment the version in `package.json` before publishing a new update.
- **README/Icons**: Make sure your `README.md` is complete and you have a high-quality icon defined in `package.json` under `"icon"`.
- **Validation**: VS Code will perform automated validation. Once passed, your extension will be public.

For more details, refer to the official [VS Code Publishing Documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
