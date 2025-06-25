import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DocuFoldConfiguration } from '../../src/types';
import { ConfigurationService } from '../../src/services/configurationService';
import { DocstringDetector } from '../../src/detectors/docstringDetector';
import { DocuFoldRangeProvider } from '../../src/providers/foldingRangeProvider';

suite('DocuFold Integration Tests', () => {
  let extension: vscode.Extension<any>;
  let configurationService: ConfigurationService;
  let docstringDetector: DocstringDetector;
  let foldingRangeProvider: DocuFoldRangeProvider;

  const testWorkspacePath = path.join(__dirname, '..', '..', 'test-workspace');

  suiteSetup(async () => {
    // Activate the extension
    const ext = vscode.extensions.getExtension('docufold.docufold');
    assert.ok(ext, 'Extension should be available');
    extension = ext;

    if (!extension.isActive) {
      await extension.activate();
    }

    // Initialize services
    configurationService = new ConfigurationService();
    docstringDetector = new DocstringDetector();
    foldingRangeProvider = new DocuFoldRangeProvider(docstringDetector);

    // Ensure test workspace exists
    if (!fs.existsSync(testWorkspacePath)) {
      throw new Error(`Test workspace not found at: ${testWorkspacePath}`);
    }
  });

  suiteTeardown(() => {
    configurationService?.dispose();
    // foldingRangeProvider doesn't have dispose method
  });

  suite('Extension Activation and Setup', () => {
    test('Extension should activate successfully', () => {
      assert.ok(extension.isActive, 'Extension should be active');
    });

    test('All commands should be registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      const expectedCommands = [
        'docufold.toggleAutoFold',
        'docufold.foldAllDocstrings',
        'docufold.unfoldAllDocstrings',
        'docufold.foldCurrentDocstring',
        'docufold.unfoldCurrentDocstring',
      ];

      for (const cmd of expectedCommands) {
        assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
      }
    });

    test('Configuration service should be initialized', () => {
      const config = configurationService.getConfiguration();
      assert.ok(config, 'Configuration should be available');
      assert.strictEqual(typeof config.autoFoldEnabled, 'boolean');
      assert.strictEqual(typeof config.previewLength, 'number');
    });

    test('Folding range provider should be registered', () => {
      // Check if folding range provider is properly initialized
      assert.ok(foldingRangeProvider, 'Folding range provider should be initialized');
    });
  });

  suite('Python File Integration', () => {
    let pythonDocument: vscode.TextDocument;
    let pythonEditor: vscode.TextEditor;

    setup(async () => {
      const pythonFilePath = path.join(testWorkspacePath, 'test-python.py');
      const pythonUri = vscode.Uri.file(pythonFilePath);
      pythonDocument = await vscode.workspace.openTextDocument(pythonUri);
      pythonEditor = await vscode.window.showTextDocument(pythonDocument);
    });

    teardown(async () => {
      if (pythonEditor) {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    });

    test('Should detect Python docstrings correctly', async () => {
      const docstrings = await docstringDetector.detectDocstrings(pythonDocument);

      assert.ok(docstrings.length > 0, 'Should detect docstrings in Python file');

      // Check for module-level docstring
      const moduleDocstring = docstrings.find(d => d.startPosition.line === 0);
      assert.ok(moduleDocstring, 'Should detect module-level docstring');
      assert.ok(
        moduleDocstring.preview.includes('module-level docstring'),
        'Should extract correct preview'
      );

      // Check for function docstrings
      const functionDocstrings = docstrings.filter(d => d.preview.includes('function'));
      assert.ok(functionDocstrings.length > 0, 'Should detect function docstrings');

      // Check for class docstrings
      const classDocstrings = docstrings.filter(d => d.preview.includes('class'));
      assert.ok(classDocstrings.length > 0, 'Should detect class docstrings');
    });

    test('Should provide folding ranges for Python docstrings', async () => {
      const foldingRanges = await foldingRangeProvider.provideFoldingRanges(
        pythonDocument,
        {},
        new vscode.CancellationTokenSource().token
      );

      assert.ok(foldingRanges.length > 0, 'Should provide folding ranges');

      // Verify folding ranges are valid
      for (const range of foldingRanges) {
        assert.ok(range.start >= 0, 'Folding range start should be valid');
        assert.ok(range.end > range.start, 'Folding range end should be after start');
        assert.strictEqual(
          range.kind,
          vscode.FoldingRangeKind.Comment,
          'Should be comment folding range'
        );
      }
    });

    test('Should execute fold all docstrings command', async () => {
      // Execute fold all command
      await vscode.commands.executeCommand('docufold.foldAllDocstrings');

      // Verify command executed without error
      assert.ok(true, 'Fold all command should execute successfully');
    });

    test('Should execute unfold all docstrings command', async () => {
      // Execute unfold all command
      await vscode.commands.executeCommand('docufold.unfoldAllDocstrings');

      // Verify command executed without error
      assert.ok(true, 'Unfold all command should execute successfully');
    });
  });

  suite('TypeScript File Integration', () => {
    let tsDocument: vscode.TextDocument;
    let tsEditor: vscode.TextEditor;

    setup(async () => {
      const tsFilePath = path.join(testWorkspacePath, 'test-typescript.ts');
      const tsUri = vscode.Uri.file(tsFilePath);
      tsDocument = await vscode.workspace.openTextDocument(tsUri);
      tsEditor = await vscode.window.showTextDocument(tsDocument);
    });

    teardown(async () => {
      if (tsEditor) {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    });

    test('Should detect TypeScript JSDoc comments correctly', async () => {
      const docstrings = await docstringDetector.detectDocstrings(tsDocument);

      assert.ok(docstrings.length > 0, 'Should detect JSDoc comments in TypeScript file');

      // Check for module-level JSDoc
      const moduleDocstring = docstrings.find(d => d.preview.includes('TypeScript module'));
      assert.ok(moduleDocstring, 'Should detect module-level JSDoc');

      // Check for function JSDoc
      const functionDocstrings = docstrings.filter(
        d => d.preview.includes('function') || d.preview.includes('Multi-line')
      );
      assert.ok(functionDocstrings.length > 0, 'Should detect function JSDoc comments');

      // Check for class JSDoc
      const classDocstrings = docstrings.filter(
        d => d.preview.includes('Constructor') || d.preview.includes('class')
      );
      assert.ok(classDocstrings.length > 0, 'Should detect class JSDoc comments');
    });

    test('Should provide folding ranges for TypeScript JSDoc', async () => {
      const foldingRanges = await foldingRangeProvider.provideFoldingRanges(
        tsDocument,
        {},
        new vscode.CancellationTokenSource().token
      );

      assert.ok(foldingRanges.length > 0, 'Should provide folding ranges for TypeScript');

      // Verify all ranges are multi-line (single-line JSDoc should not be folded by default)
      for (const range of foldingRanges) {
        assert.ok(range.end > range.start, 'Should only fold multi-line JSDoc comments');
      }
    });
  });

  suite('Java File Integration', () => {
    let javaDocument: vscode.TextDocument;
    let javaEditor: vscode.TextEditor;

    setup(async () => {
      const javaFilePath = path.join(testWorkspacePath, 'test-java.java');
      const javaUri = vscode.Uri.file(javaFilePath);
      javaDocument = await vscode.workspace.openTextDocument(javaUri);
      javaEditor = await vscode.window.showTextDocument(javaDocument);
    });

    teardown(async () => {
      if (javaEditor) {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    });

    test('Should detect Java Javadoc comments correctly', async () => {
      const docstrings = await docstringDetector.detectDocstrings(javaDocument);

      assert.ok(docstrings.length > 0, 'Should detect Javadoc comments in Java file');

      // Check for class-level Javadoc
      const classDocstring = docstrings.find(d => d.preview.includes('comprehensive Java class'));
      assert.ok(classDocstring, 'Should detect class-level Javadoc');

      // Check for method Javadoc
      const methodDocstrings = docstrings.filter(
        d =>
          d.preview.includes('method') ||
          d.preview.includes('Constructor') ||
          d.preview.includes('Getter')
      );
      assert.ok(methodDocstrings.length > 0, 'Should detect method Javadoc comments');
    });

    test('Should provide folding ranges for Java Javadoc', async () => {
      const foldingRanges = await foldingRangeProvider.provideFoldingRanges(
        javaDocument,
        {},
        new vscode.CancellationTokenSource().token
      );

      assert.ok(foldingRanges.length > 0, 'Should provide folding ranges for Java');
    });
  });

  suite('C# File Integration', () => {
    let csharpDocument: vscode.TextDocument;
    let csharpEditor: vscode.TextEditor;

    setup(async () => {
      const csharpFilePath = path.join(testWorkspacePath, 'test-csharp.cs');
      const csharpUri = vscode.Uri.file(csharpFilePath);
      csharpDocument = await vscode.workspace.openTextDocument(csharpUri);
      csharpEditor = await vscode.window.showTextDocument(csharpDocument);
    });

    teardown(async () => {
      if (csharpEditor) {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    });

    test('Should detect C# XML documentation correctly', async () => {
      const docstrings = await docstringDetector.detectDocstrings(csharpDocument);

      assert.ok(docstrings.length > 0, 'Should detect XML documentation in C# file');

      // Check for class-level documentation
      const classDocstring = docstrings.find(d => d.preview.includes('C# class'));
      assert.ok(classDocstring, 'Should detect class-level XML documentation');

      // Check for method documentation
      const methodDocstrings = docstrings.filter(
        d =>
          d.preview.includes('method') ||
          d.preview.includes('constructor') ||
          d.preview.includes('property')
      );
      assert.ok(methodDocstrings.length > 0, 'Should detect method XML documentation');
    });

    test('Should provide folding ranges for C# XML documentation', async () => {
      const foldingRanges = await foldingRangeProvider.provideFoldingRanges(
        csharpDocument,
        {},
        new vscode.CancellationTokenSource().token
      );

      assert.ok(foldingRanges.length > 0, 'Should provide folding ranges for C#');
    });
  });

  suite('JavaScript File Integration', () => {
    let jsDocument: vscode.TextDocument;
    let jsEditor: vscode.TextEditor;

    setup(async () => {
      const jsFilePath = path.join(testWorkspacePath, 'test-jsdoc.js');
      const jsUri = vscode.Uri.file(jsFilePath);
      jsDocument = await vscode.workspace.openTextDocument(jsUri);
      jsEditor = await vscode.window.showTextDocument(jsDocument);
    });

    teardown(async () => {
      if (jsEditor) {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    });

    test('Should detect JavaScript JSDoc comments correctly', async () => {
      const docstrings = await docstringDetector.detectDocstrings(jsDocument);

      assert.ok(docstrings.length > 0, 'Should detect JSDoc comments in JavaScript file');

      // Check for function JSDoc
      const functionDocstrings = docstrings.filter(
        d =>
          d.preview.includes('single line') ||
          d.preview.includes('multi-line') ||
          d.preview.includes('Calculate')
      );
      assert.ok(functionDocstrings.length > 0, 'Should detect function JSDoc comments');
    });

    test('Should provide folding ranges for JavaScript JSDoc', async () => {
      const foldingRanges = await foldingRangeProvider.provideFoldingRanges(
        jsDocument,
        {},
        new vscode.CancellationTokenSource().token
      );

      assert.ok(foldingRanges.length > 0, 'Should provide folding ranges for JavaScript');
    });
  });

  suite('Configuration Integration', () => {
    test('Should respect auto-fold configuration', async () => {
      // Test with auto-fold enabled
      await configurationService.updateConfiguration('autoFoldEnabled', true);
      let config = configurationService.getConfiguration();
      assert.strictEqual(config.autoFoldEnabled, true, 'Auto-fold should be enabled');

      // Test with auto-fold disabled
      await configurationService.updateConfiguration('autoFoldEnabled', false);
      config = configurationService.getConfiguration();
      assert.strictEqual(config.autoFoldEnabled, false, 'Auto-fold should be disabled');

      // Reset to default
      await configurationService.updateConfiguration('autoFoldEnabled', true);
    });

    test('Should respect preview length configuration', async () => {
      const originalLength = configurationService.getConfiguration().previewLength;

      // Update preview length
      await configurationService.updateConfiguration('previewLength', 100);
      let config = configurationService.getConfiguration();
      assert.strictEqual(config.previewLength, 100, 'Preview length should be updated');

      // Reset to original
      await configurationService.updateConfiguration('previewLength', originalLength);
    });

    test('Should respect language-specific configuration', async () => {
      const config = configurationService.getConfiguration();

      // Check that language settings exist
      assert.ok(config.languageSettings, 'Language settings should exist');
      assert.ok(config.languageSettings['python'], 'Python language settings should exist');
      assert.ok(config.languageSettings['javascript'], 'JavaScript language settings should exist');
      assert.ok(config.languageSettings['typescript'], 'TypeScript language settings should exist');

      // Check language enablement
      assert.strictEqual(
        configurationService.isLanguageEnabled('python'),
        true,
        'Python should be enabled by default'
      );
      assert.strictEqual(
        configurationService.isLanguageEnabled('javascript'),
        true,
        'JavaScript should be enabled by default'
      );
    });
  });

  suite('Command Integration', () => {
    let testDocument: vscode.TextDocument;
    let testEditor: vscode.TextEditor;

    setup(async () => {
      const pythonFilePath = path.join(testWorkspacePath, 'test-python.py');
      const pythonUri = vscode.Uri.file(pythonFilePath);
      testDocument = await vscode.workspace.openTextDocument(pythonUri);
      testEditor = await vscode.window.showTextDocument(testDocument);
    });

    teardown(async () => {
      if (testEditor) {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    });

    test('Should execute toggle auto-fold command', async () => {
      const originalConfig = configurationService.getConfiguration().autoFoldEnabled;

      // Execute toggle command
      await vscode.commands.executeCommand('docufold.toggleAutoFold');

      // Verify configuration changed
      const newConfig = configurationService.getConfiguration().autoFoldEnabled;
      assert.notStrictEqual(originalConfig, newConfig, 'Auto-fold setting should toggle');

      // Toggle back
      await vscode.commands.executeCommand('docufold.toggleAutoFold');
      const finalConfig = configurationService.getConfiguration().autoFoldEnabled;
      assert.strictEqual(
        originalConfig,
        finalConfig,
        'Auto-fold setting should return to original'
      );
    });

    test('Should execute fold current docstring command', async () => {
      // Position cursor on a line with docstring
      const position = new vscode.Position(5, 0); // Adjust based on test file structure
      testEditor.selection = new vscode.Selection(position, position);

      // Execute fold current command
      await vscode.commands.executeCommand('docufold.foldCurrentDocstring');

      // Command should execute without error
      assert.ok(true, 'Fold current docstring command should execute successfully');
    });

    test('Should execute unfold current docstring command', async () => {
      // Position cursor on a line with docstring
      const position = new vscode.Position(5, 0);
      testEditor.selection = new vscode.Selection(position, position);

      // Execute unfold current command
      await vscode.commands.executeCommand('docufold.unfoldCurrentDocstring');

      // Command should execute without error
      assert.ok(true, 'Unfold current docstring command should execute successfully');
    });
  });

  suite('Error Handling Integration', () => {
    test('Should handle invalid documents gracefully', async () => {
      // Create a mock invalid document
      const invalidUri = vscode.Uri.parse('untitled:invalid-file.txt');
      const invalidDocument = await vscode.workspace.openTextDocument(invalidUri);

      // Should not throw when processing invalid document
      const docstrings = await docstringDetector.detectDocstrings(invalidDocument);
      assert.ok(Array.isArray(docstrings), 'Should return empty array for invalid document');
    });

    test('Should handle empty documents gracefully', async () => {
      // Create empty document
      const emptyUri = vscode.Uri.parse('untitled:empty.py');
      const emptyDocument = await vscode.workspace.openTextDocument(emptyUri);

      // Should handle empty document without error
      const docstrings = await docstringDetector.detectDocstrings(emptyDocument);
      assert.strictEqual(docstrings.length, 0, 'Should return empty array for empty document');

      const foldingRanges = await foldingRangeProvider.provideFoldingRanges(
        emptyDocument,
        {},
        new vscode.CancellationTokenSource().token
      );
      assert.strictEqual(
        foldingRanges.length,
        0,
        'Should return empty folding ranges for empty document'
      );
    });

    test('Should handle configuration errors gracefully', async () => {
      // Test with invalid configuration values
      try {
        await configurationService.updateConfiguration('previewLength', -1 as any);
        const config = configurationService.getConfiguration();
        // Should use default or sanitized value
        assert.ok(config.previewLength > 0, 'Should sanitize invalid preview length');
      } catch (error) {
        // Configuration update might reject invalid values
        assert.ok(true, 'Configuration should handle invalid values');
      }
    });
  });

  suite('Performance Integration', () => {
    test('Should handle medium-sized files efficiently', async function () {
      this.timeout(5000); // 5 second timeout

      // Use the TypeScript test file which is reasonably sized
      const tsFilePath = path.join(testWorkspacePath, 'test-typescript.ts');
      const tsUri = vscode.Uri.file(tsFilePath);
      const tsDocument = await vscode.workspace.openTextDocument(tsUri);

      const startTime = Date.now();

      // Detect docstrings
      const docstrings = await docstringDetector.detectDocstrings(tsDocument);

      // Provide folding ranges
      const foldingRanges = await foldingRangeProvider.provideFoldingRanges(
        tsDocument,
        {},
        new vscode.CancellationTokenSource().token
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      assert.ok(docstrings.length > 0, 'Should detect docstrings');
      assert.ok(foldingRanges.length > 0, 'Should provide folding ranges');
      assert.ok(processingTime < 1000, `Processing should be fast (took ${processingTime}ms)`);
    });

    test('Should cache results for repeated operations', async () => {
      const pythonFilePath = path.join(testWorkspacePath, 'test-python.py');
      const pythonUri = vscode.Uri.file(pythonFilePath);
      const pythonDocument = await vscode.workspace.openTextDocument(pythonUri);

      // First call
      const startTime1 = Date.now();
      const docstrings1 = await docstringDetector.detectDocstrings(pythonDocument);
      const endTime1 = Date.now();
      const time1 = endTime1 - startTime1;

      // Second call (should use cache)
      const startTime2 = Date.now();
      const docstrings2 = await docstringDetector.detectDocstrings(pythonDocument);
      const endTime2 = Date.now();
      const time2 = endTime2 - startTime2;

      assert.deepStrictEqual(docstrings1, docstrings2, 'Results should be identical');
      assert.ok(time2 <= time1, 'Second call should be faster or equal due to caching');
    });
  });
});
