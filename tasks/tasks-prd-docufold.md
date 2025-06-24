# DocuFold Extension Task List

Based on PRD: `prd-docufold.md`

## Relevant Files

- `package.json` - Extension manifest with metadata, commands, and dependencies
- `src/extension.ts` - Main extension entry point and activation logic
- `tsconfig.json` - TypeScript configuration for extension development
- `test/tsconfig.json` - TypeScript configuration for test files
- `.vscode-test.mjs` - VSCode test runner configuration
- `test/suite/index.ts` - Main test suite setup with Mocha configuration
- `test/runTest.ts` - Test runner entry point for VSCode extension testing
- `test/extension.test.ts` - Basic extension functionality tests
- `.eslintrc.json` - ESLint configuration for code quality
- `src/providers/foldingRangeProvider.ts` - Core folding range provider implementation
- `src/detectors/docstringDetector.ts` - Language-specific docstring detection engine
- `src/services/configurationService.ts` - Settings and configuration management
- `src/services/statusBarService.ts` - Status bar integration and indicators
- `src/commands/foldingCommands.ts` - Command palette and manual folding commands
- `src/utils/languageUtils.ts` - Language detection and pattern utilities
- `src/utils/performanceUtils.ts` - Performance optimization utilities
- `src/types/index.ts` - TypeScript type definitions
- `test/extension.test.ts` - Main extension functionality tests
- `test/providers/foldingRangeProvider.test.ts` - Unit tests for folding provider
- `test/detectors/docstringDetector.test.ts` - Unit tests for docstring detection
- `test/services/configurationService.test.ts` - Unit tests for configuration service
- `README.md` - Extension documentation and usage guide
- `CHANGELOG.md` - Version history and release notes

### Notes

- This is a VSCode extension, so it follows the VSCode Extension API structure
- Tests should use VSCode extension testing framework with Mocha
- Use `npm run test` to run all tests
- Extension will be published to VSCode marketplace

## Tasks

- [ ] 1.0 Project Setup & Extension Scaffolding

  - [x] 1.1 Initialize VSCode extension project using `yo code` generator or manual setup
  - [x] 1.2 Configure TypeScript with proper tsconfig.json for extension development
  - [x] 1.3 Setup testing framework with Mocha and VSCode extension test runner
  - [ ] 1.4 Configure package.json with extension metadata, activation events, and commands
  - [ ] 1.5 Setup build pipeline with webpack or esbuild for extension bundling
  - [ ] 1.6 Create basic folder structure (src/, test/, out/) and initial files
  - [ ] 1.7 Setup development and debugging configuration in .vscode/launch.json

- [ ] 2.0 Core Docstring Detection Engine

  - [ ] 2.1 Create TypeScript interfaces for docstring detection patterns and results
  - [ ] 2.2 Implement Python docstring detection (triple quotes """ and ''', single line)
  - [ ] 2.3 Implement JavaScript/TypeScript JSDoc detection (/\*\* \*/ patterns)
  - [ ] 2.4 Implement Java/C# XML documentation detection (/// and /\*\* \*/)
  - [ ] 2.5 Create extensible language pattern registry for future language support
  - [ ] 2.6 Implement docstring boundary detection (start/end positions)
  - [ ] 2.7 Add preview text extraction (first line or summary) functionality
  - [ ] 2.8 Implement performance optimizations (caching, debouncing)
  - [ ] 2.9 Create comprehensive unit tests for all language detectors

- [ ] 3.0 Folding Range Provider Implementation

  - [ ] 3.1 Implement VSCode FoldingRangeProvider interface
  - [ ] 3.2 Integrate docstring detector with folding range provider
  - [ ] 3.3 Implement auto-folding functionality on document open
  - [ ] 3.4 Create folding range calculation logic for detected docstrings
  - [ ] 3.5 Add performance optimization for large files (incremental parsing)
  - [ ] 3.6 Implement folding range caching mechanism
  - [ ] 3.7 Add error handling and fallback mechanisms
  - [ ] 3.8 Create comprehensive tests for folding provider functionality

- [ ] 4.0 User Interface & Commands Integration

  - [ ] 4.1 Implement "DocuFold: Toggle Auto-fold" command
  - [ ] 4.2 Implement "DocuFold: Fold All Docstrings" command
  - [ ] 4.3 Implement "DocuFold: Unfold All Docstrings" command
  - [ ] 4.4 Implement "DocuFold: Fold Current Docstring" command
  - [ ] 4.5 Implement "DocuFold: Unfold Current Docstring" command
  - [ ] 4.6 Create status bar item with current folding status display
  - [ ] 4.7 Configure keyboard shortcuts with default key bindings
  - [ ] 4.8 Add context menu integration for fold/unfold actions
  - [ ] 4.9 Implement hover tooltips for folded docstrings with extended preview
  - [ ] 4.10 Create comprehensive tests for all commands and UI interactions

- [ ] 5.0 Configuration & Settings Management

  - [ ] 5.1 Define configuration schema in package.json contributions
  - [ ] 5.2 Implement configuration service for reading user/workspace settings
  - [ ] 5.3 Add "enable/disable auto-folding" setting
  - [ ] 5.4 Add "file pattern inclusion/exclusion" settings
  - [ ] 5.5 Add "preview text length" configuration option
  - [ ] 5.6 Add language-specific behavior settings
  - [ ] 5.7 Implement workspace vs user settings precedence logic
  - [ ] 5.8 Add configuration change listeners and dynamic updates
  - [ ] 5.9 Create settings validation and error handling
  - [ ] 5.10 Create comprehensive tests for configuration management

- [ ] 6.0 Testing & Quality Assurance

  - [ ] 6.1 Create integration tests for complete extension workflow
  - [ ] 6.2 Test extension with various file sizes (small, medium, large 5000+ lines)
  - [ ] 6.3 Test multi-language support across different file types
  - [ ] 6.4 Performance testing and optimization validation
  - [ ] 6.5 User acceptance testing with real-world codebases
  - [ ] 6.6 Accessibility testing for screen readers and keyboard navigation
  - [ ] 6.7 Compatibility testing with other VSCode extensions

- [ ] 7.0 Documentation & Publishing
  - [ ] 7.1 Write comprehensive README.md with features, installation, and usage
  - [ ] 7.2 Create CHANGELOG.md with version history
  - [ ] 7.3 Add inline code documentation and JSDoc comments
  - [ ] 7.4 Create extension icon and marketplace assets
  - [ ] 7.5 Setup CI/CD pipeline for automated testing and publishing
  - [ ] 7.6 Package extension for VSCode marketplace
  - [ ] 7.7 Publish extension to VSCode marketplace
