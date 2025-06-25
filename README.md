![DocuFold Banner](resources/marketplace/banner.svg)
# DocuFold - Smart Docstring Folding for VSCode

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://marketplace.visualstudio.com/items?itemName=docufold.docufold)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

**DocuFold** is an intelligent VSCode extension that automatically folds docstrings and documentation comments in your code files, helping you maintain a clean, focused development environment while keeping documentation easily accessible when needed.

## 🚀 Features

### 🎯 **Smart Auto-Folding**

- **Automatic folding** of docstrings when files are opened
- **Intelligent detection** of documentation patterns across multiple languages
- **Configurable behavior** with workspace and user-level settings
- **Performance optimized** for large files (5000+ lines)

### 🌐 **Multi-Language Support**

DocuFold supports docstring folding for **8+ programming languages**:

| Language       | Pattern           | Example               |
| -------------- | ----------------- | --------------------- |
| **Python**     | `"""` or `'''`    | Triple-quoted strings |
| **JavaScript** | `/** */`          | JSDoc comments        |
| **TypeScript** | `/** */`          | TSDoc comments        |
| **Java**       | `/** */`          | Javadoc comments      |
| **C#**         | `///` or `/** */` | XML documentation     |
| **PHP**        | `/** */`          | PHPDoc comments       |
| **Go**         | `//` (multi-line) | Go doc comments       |
| **Rust**       | `///` or `//!`    | Rust doc comments     |

### 🎮 **Powerful Commands**

Access all functionality through the Command Palette (`Ctrl/Cmd + Shift + P`):

- `DocuFold: Toggle Auto-fold` - Enable/disable automatic folding
- `DocuFold: Fold All Docstrings` - Fold all docstrings in current file
- `DocuFold: Unfold All Docstrings` - Unfold all docstrings in current file
- `DocuFold: Fold Current Docstring` - Fold docstring at cursor position
- `DocuFold: Unfold Current Docstring` - Unfold docstring at cursor position

### ⌨️ **Keyboard Shortcuts**

Quick access with intuitive keyboard shortcuts:

| Action           | Windows/Linux         | macOS                |
| ---------------- | --------------------- | -------------------- |
| Toggle Auto-fold | `Ctrl + Shift + D, A` | `Cmd + Shift + D, A` |
| Fold All         | `Ctrl + Shift + D, F` | `Cmd + Shift + D, F` |
| Unfold All       | `Ctrl + Shift + D, U` | `Cmd + Shift + D, U` |
| Fold Current     | `Ctrl + Shift + D, C` | `Cmd + Shift + D, C` |
| Unfold Current   | `Ctrl + Shift + D, X` | `Cmd + Shift + D, X` |

### 📊 **Status Bar Integration**

- **Real-time status** showing auto-fold state (ON/OFF)
- **Document statistics** displaying folded/total docstrings count
- **Click to toggle** auto-fold functionality
- **Hover tooltips** with detailed information

### 🔍 **Smart Preview System**

- **Hover previews** showing docstring content without unfolding
- **Intelligent content extraction** showing the most relevant information
- **Configurable preview length** (20-200 characters)
- **Markdown formatting** support in hover tooltips

### ⚡ **Performance Optimized**

- **TTL caching** for fast repeated operations
- **Debounced processing** to prevent excessive computation
- **Incremental parsing** for large files
- **Memory efficient** with automatic cleanup

### ⚙️ **Highly Configurable**

Customize DocuFold behavior through VSCode settings:

```json
{
  "docufold.autoFoldEnabled": true,
  "docufold.previewLength": 60,
  "docufold.includePatterns": ["**/*.py", "**/*.js", "**/*.ts"],
  "docufold.excludePatterns": ["**/node_modules/**", "**/dist/**"],
  "docufold.enableStatusBar": true,
  "docufold.foldOnOpen": true,
  "docufold.enableHoverPreview": true
}
```

## 📦 Installation

### From VSCode Marketplace

1. Open VSCode
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "DocuFold"
4. Click **Install**

### From Command Line

```bash
code --install-extension docufold.docufold
```

### Manual Installation

1. Download the `.vsix` file from [Releases](https://github.com/StevanusPangau/DocuFold/releases)
2. Open VSCode
3. Run `Extensions: Install from VSIX...` command
4. Select the downloaded `.vsix` file

## 🎯 Quick Start

1. **Install** the extension
2. **Open** any supported code file (Python, JavaScript, TypeScript, etc.)
3. **Docstrings are automatically folded** (if auto-fold is enabled)
4. **Hover** over folded docstrings to see previews
5. **Use commands** or keyboard shortcuts to control folding

### Example: Python File

```python
def calculate_fibonacci(n):
    """
    Calculate the nth Fibonacci number using dynamic programming.

    This function efficiently computes Fibonacci numbers by storing
    previously calculated values to avoid redundant computations.

    Args:
        n (int): The position in the Fibonacci sequence (0-indexed)

    Returns:
        int: The nth Fibonacci number

    Raises:
        ValueError: If n is negative

    Examples:
        >>> calculate_fibonacci(10)
        55
        >>> calculate_fibonacci(0)
        0
    """  # ← This docstring will be automatically folded
    if n < 0:
        raise ValueError("n must be non-negative")
    # ... implementation
```

When folded, you'll see:

```python
def calculate_fibonacci(n):
    """Calculate the nth Fibonacci number using dynamic programming..."""  # ← Folded with preview
    if n < 0:
        raise ValueError("n must be non-negative")
    # ... implementation
```

## ⚙️ Configuration

### Basic Settings

| Setting                       | Type    | Default | Description                                      |
| ----------------------------- | ------- | ------- | ------------------------------------------------ |
| `docufold.autoFoldEnabled`    | boolean | `true`  | Enable automatic folding when files open         |
| `docufold.previewLength`      | number  | `60`    | Maximum characters shown in folded preview       |
| `docufold.foldOnOpen`         | boolean | `true`  | Automatically fold docstrings when opening files |
| `docufold.enableStatusBar`    | boolean | `true`  | Show DocuFold status in status bar               |
| `docufold.enableHoverPreview` | boolean | `true`  | Enable hover tooltips for folded docstrings      |

### File Pattern Settings

| Setting                    | Type  | Default                                     | Description              |
| -------------------------- | ----- | ------------------------------------------- | ------------------------ |
| `docufold.includePatterns` | array | `["**/*.py", "**/*.js", "**/*.ts", ...]`    | File patterns to include |
| `docufold.excludePatterns` | array | `["**/node_modules/**", "**/dist/**", ...]` | File patterns to exclude |

### Language-Specific Settings

Configure behavior for individual languages:

```json
{
  "docufold.languageSettings": {
    "python": {
      "enabled": true,
      "foldSingleLine": false,
      "customPatterns": []
    },
    "javascript": {
      "enabled": true,
      "foldSingleLine": true,
      "customPatterns": ["^\\s*\\/\\*\\*.*\\*\\/$"]
    }
  }
}
```

### Performance Settings

Fine-tune performance for your workflow:

```json
{
  "docufold.performanceSettings": {
    "maxFileSize": 1048576,
    "cacheTimeout": 300000,
    "debounceDelay": 250,
    "enablePerformanceLogging": false
  }
}
```

### Advanced Settings

```json
{
  "docufold.advancedSettings": {
    "respectUserFolding": true,
    "preserveFoldingOnSave": true,
    "autoFoldDelay": 500,
    "enableContextualFolding": true
  }
}
```

## 🎨 Usage Examples

### Python Development

```python
class DataProcessor:
    """
    A comprehensive data processing utility class.

    This class provides methods for cleaning, transforming,
    and analyzing various types of data structures.
    """  # ← Auto-folded, hover to see full content

    def process_data(self, data):
        """Process raw data and return cleaned results."""  # ← Single-line, may be folded based on settings
        # Implementation here
```

### JavaScript/TypeScript Development

```javascript
/**
 * Utility class for handling HTTP requests with retry logic.
 *
 * @class HTTPClient
 * @description Provides methods for making HTTP requests with
 * built-in retry mechanisms, timeout handling, and error recovery.
 */ // ← Auto-folded JSDoc comment
class HTTPClient {
  /**
   * Makes a GET request to the specified URL.
   * @param {string} url - The URL to request
   * @returns {Promise<Response>} The response object
   */ // ← Method documentation, also folded
  async get(url) {
    // Implementation
  }
}
```

### Java Development

```java
/**
 * Service class for user authentication and authorization.
 *
 * <p>This service handles user login, logout, token validation,
 * and role-based access control throughout the application.</p>
 *
 * @author DocuFold Team
 * @version 1.0
 * @since 2024
 */  // ← Javadoc comment folded
public class AuthService {
    // Class implementation
}
```

## 🔧 Commands Reference

### Command Palette Commands

| Command                              | Description                                | Keyboard Shortcut         |
| ------------------------------------ | ------------------------------------------ | ------------------------- |
| `DocuFold: Toggle Auto-fold`         | Enable/disable automatic docstring folding | `Ctrl/Cmd + Shift + D, A` |
| `DocuFold: Fold All Docstrings`      | Fold all docstrings in the current file    | `Ctrl/Cmd + Shift + D, F` |
| `DocuFold: Unfold All Docstrings`    | Unfold all docstrings in the current file  | `Ctrl/Cmd + Shift + D, U` |
| `DocuFold: Fold Current Docstring`   | Fold the docstring at cursor position      | `Ctrl/Cmd + Shift + D, C` |
| `DocuFold: Unfold Current Docstring` | Unfold the docstring at cursor position    | `Ctrl/Cmd + Shift + D, X` |

### Context Menu

Right-click in any supported file to access:

- **Fold Current Docstring**
- **Unfold Current Docstring**
- **Fold All Docstrings**
- **Unfold All Docstrings**

## 🚀 Performance

DocuFold is optimized for performance across different file sizes:

| File Size  | Lines     | Processing Time | Memory Usage |
| ---------- | --------- | --------------- | ------------ |
| Small      | < 500     | < 10ms          | < 1MB        |
| Medium     | 500-2000  | < 50ms          | < 5MB        |
| Large      | 2000-5000 | < 200ms         | < 10MB       |
| Very Large | 5000+     | < 500ms         | < 20MB       |

### Performance Features

- **TTL Caching**: 5-minute cache for detection results
- **Debounced Processing**: 250ms debounce to prevent excessive computation
- **Incremental Parsing**: Large files processed in chunks
- **Memory Management**: Automatic cleanup of unused cache entries

## 🔍 Troubleshooting

### Common Issues

**Q: Docstrings are not being folded automatically**

- Ensure `docufold.autoFoldEnabled` is set to `true`
- Check that your file type is in `docufold.includePatterns`
- Verify the file is not in `docufold.excludePatterns`

**Q: Performance is slow on large files**

- Increase `docufold.performanceSettings.debounceDelay`
- Reduce `docufold.performanceSettings.maxFileSize` if needed
- Enable `docufold.performanceSettings.enablePerformanceLogging` to debug

**Q: Hover previews are not showing**

- Ensure `docufold.enableHoverPreview` is `true`
- Check that docstrings are properly detected (try manual folding first)

**Q: Keyboard shortcuts are not working**

- Check for conflicts with other extensions
- Verify shortcuts in File > Preferences > Keyboard Shortcuts
- Search for "DocuFold" to see all available shortcuts

### Debug Information

Enable debug logging:

```json
{
  "docufold.performanceSettings.enablePerformanceLogging": true
}
```

Check VSCode Developer Console (`Help > Toggle Developer Tools`) for DocuFold logs.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/StevanusPangau/DocuFold.git
cd docufold

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Package extension
npm run package
```

### Project Structure

```
docufold/
├── src/
│   ├── commands/         # Command implementations
│   ├── detectors/        # Language-specific docstring detection
│   ├── providers/        # VSCode providers (folding, hover)
│   ├── services/         # Configuration and status bar services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── test/                # Test files
├── test-workspace/      # Test files for different languages
└── resources/          # Extension assets
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **VSCode Team** for the excellent extension API
- **TypeScript Team** for the robust type system
- **Mocha** and **ESLint** for testing and code quality tools
- **All contributors** who help make DocuFold better

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/StevanusPangau/DocuFold/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/StevanusPangau/DocuFold/discussions)
- **Documentation**: [Wiki](https://github.com/StevanusPangau/DocuFold/wiki)

---

**Made with ❤️ by the DocuFold Team**

_Keep your code clean, keep your docs accessible!_
