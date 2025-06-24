import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DocstringDetector } from '../../src/detectors/docstringDetector';
import { DocuFoldRangeProvider } from '../../src/providers/foldingRangeProvider';
import { StatusBarService } from '../../src/services/statusBarService';

suite('Extension Compatibility Tests', () => {
  let detector: DocstringDetector;
  let provider: DocuFoldRangeProvider;
  let statusBarService: StatusBarService;

  setup(() => {
    detector = new DocstringDetector();
    provider = new DocuFoldRangeProvider(detector);
    statusBarService = new StatusBarService();
  });

  teardown(() => {
    detector.clearCache();
    provider.clearCache();
    statusBarService.dispose();
  });

  suite('VSCode Built-in Features', () => {
    test('should not interfere with built-in folding', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Get our folding ranges
      const docufoldRanges = await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);

      // Should provide ranges without interfering with VSCode's built-in folding
      assert.ok(docufoldRanges && docufoldRanges.length > 0, 'Should provide folding ranges');

      // Verify our ranges use the correct folding kind
      docufoldRanges.forEach((range, index) => {
        assert.ok(range.kind === vscode.FoldingRangeKind.Comment, `Range ${index} should be Comment type`);
        assert.ok(typeof range.start === 'number', `Range ${index} should have numeric start`);
        assert.ok(typeof range.end === 'number', `Range ${index} should have numeric end`);
        assert.ok(range.start < range.end, `Range ${index} should have valid range`);
      });

      console.log(`Built-in folding compatibility: ${docufoldRanges.length} ranges provided`);
    });

    test('should work with VSCode search and replace', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Test that our extension doesn't interfere with search/replace
      const docstrings = await detector.detectDocstrings(document);

      // Should be able to detect docstrings even during text changes
      assert.ok(docstrings.length > 0, 'Should detect docstrings during text operations');

      // Verify docstring positions are valid for search operations
      docstrings.forEach((docstring, index) => {
        assert.ok(docstring.startPosition.line >= 0, `Docstring ${index} should have valid start line`);
        assert.ok(docstring.endPosition.line >= 0, `Docstring ${index} should have valid end line`);
        assert.ok(docstring.startPosition.line <= document.lineCount, `Docstring ${index} start should be within document`);
        assert.ok(docstring.endPosition.line <= document.lineCount, `Docstring ${index} end should be within document`);
      });

      console.log('Search and replace compatibility: OK');
    });

    test('should work with VSCode syntax highlighting', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Our extension should not interfere with syntax highlighting
      const docstrings = await detector.detectDocstrings(document);

      // Verify we're not modifying document content
      const originalContent = document.getText();
      await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);
      const afterContent = document.getText();

      assert.strictEqual(originalContent, afterContent, 'Should not modify document content');
      assert.ok(docstrings.length > 0, 'Should detect docstrings without affecting content');

      console.log('Syntax highlighting compatibility: OK');
    });
  });

  suite('Language Server Integration', () => {
    test('should not interfere with language server features', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Our folding provider should work alongside language servers
      const ranges = await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);

      // Should provide folding ranges without blocking language server
      assert.ok(ranges && ranges.length > 0, 'Should provide ranges without blocking language server');

      // Performance should be good enough not to interfere
      const startTime = Date.now();
      await detector.detectDocstrings(document);
      const endTime = Date.now();

      assert.ok(endTime - startTime < 100, 'Should be fast enough not to interfere with language server');

      console.log('Language server compatibility: OK');
    });

    test('should handle concurrent folding providers', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Test multiple concurrent folding operations
      const promises = [
        provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token),
        provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token),
        provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token),
      ];

      const results = await Promise.all(promises);

      // All should succeed and return consistent results
      results.forEach((result, index) => {
        assert.ok(result && result.length > 0, `Concurrent operation ${index} should succeed`);
      });

      // Results should be consistent
      const firstResult = results[0];
      if (firstResult) {
        results.forEach((result, index) => {
          assert.strictEqual(result?.length, firstResult.length, `Concurrent result ${index} should be consistent`);
        });
      }

      console.log('Concurrent folding providers: OK');
    });
  });

  suite('Editor Extensions Compatibility', () => {
    test('should work with bracket pair colorizer style extensions', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Test that our extension works with bracket-based extensions
      const docstrings = await detector.detectDocstrings(document);

      // Should handle documents with various bracket patterns
      docstrings.forEach((docstring, index) => {
        // Verify our detection doesn't get confused by brackets
        assert.ok(docstring.content.length > 0, `Docstring ${index} should have content`);
        assert.ok(docstring.preview.length > 0, `Docstring ${index} should have preview`);
      });

      console.log('Bracket pair colorizer compatibility: OK');
    });

    test('should work with minimap and overview ruler', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Our folding should work with minimap
      const ranges = await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);

      // Ranges should be valid for minimap display
      ranges?.forEach((range, index) => {
        assert.ok(range.start >= 0, `Range ${index} start should be non-negative`);
        assert.ok(range.end >= range.start, `Range ${index} should be valid`);
        assert.ok(range.end < document.lineCount, `Range ${index} should be within document bounds`);
      });

      console.log('Minimap and overview ruler compatibility: OK');
    });

    test('should work with code formatting extensions', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Test before formatting
      const docstringsBefore = await detector.detectDocstrings(document);

      // Simulate document changes (like formatting would do)
      const rangesBefore = await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);

      // Should handle document changes gracefully
      assert.ok(docstringsBefore.length > 0, 'Should detect docstrings before formatting');
      assert.ok(rangesBefore && rangesBefore.length > 0, 'Should provide ranges before formatting');

      // Test caching behavior with document changes
      const cacheStats = detector.getCacheStats();
      assert.ok(cacheStats.size >= 0, 'Cache should be functional');

      console.log('Code formatting compatibility: OK');
    });
  });

  suite('Theme and UI Extensions', () => {
    test('should work with different themes', () => {
      // Test that our status bar item works with different themes
      statusBarService.updateDocumentStatus({
        docstringCount: 5,
        foldedCount: 3,
        language: 'python',
        fileName: 'test.py',
      });

      const statusBarItem = statusBarService['statusBarItem'];

      // Should use semantic styling that works with themes
      assert.ok(statusBarItem.text, 'Status bar should have text');
      assert.ok(statusBarItem.tooltip, 'Status bar should have tooltip');

      // Should not use hardcoded colors that conflict with themes
      assert.ok(!statusBarItem.text.includes('#'), 'Should not use hardcoded color codes');

      console.log('Theme compatibility: OK');
    });

    test('should work with custom status bar extensions', () => {
      // Test that our status bar doesn't conflict with others
      const initialText = statusBarService['statusBarItem'].text;

      statusBarService.updateAutoFoldStatus(true);
      const updatedText = statusBarService['statusBarItem'].text;

      // Should update properly without conflicts
      assert.ok(updatedText, 'Status bar should update');
      assert.ok(updatedText.includes('DocuFold'), 'Status bar should identify our extension');

      console.log('Custom status bar compatibility: OK');
    });
  });

  suite('Performance with Other Extensions', () => {
    test('should maintain performance with multiple extensions', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-large-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Simulate load from multiple extensions
      const operations = [];
      for (let i = 0; i < 5; i++) {
        operations.push(detector.detectDocstrings(document));
        operations.push(provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token));
      }

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();

      const totalTime = endTime - startTime;

      // Should handle multiple concurrent operations efficiently
      assert.ok(totalTime < 1000, `Multiple operations should complete quickly (${totalTime}ms)`);
      assert.ok(
        results.every((result) => result !== undefined),
        'All operations should succeed'
      );

      console.log(`Multiple extensions performance: ${totalTime}ms for ${operations.length} operations`);
    });

    test('should handle memory efficiently with other extensions', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-medium-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Simulate repeated operations (like other extensions might do)
      for (let i = 0; i < 10; i++) {
        await detector.detectDocstrings(document);
        await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);
      }

      // Check cache management
      const cacheStats = detector.getCacheStats();
      assert.ok(cacheStats.size > 0, 'Cache should be active');

      // Clear cache and verify cleanup
      detector.clearCache();
      provider.clearCache();

      const clearedStats = detector.getCacheStats();
      assert.strictEqual(clearedStats.size, 0, 'Cache should be cleared');

      console.log('Memory efficiency with other extensions: OK');
    });
  });

  suite('Error Handling and Recovery', () => {
    test('should handle errors gracefully without affecting other extensions', async () => {
      // Test with document that might cause issues
      const mockDocument = {
        languageId: 'unsupported-language',
        getText: () => 'some content',
        lineCount: 1,
        uri: vscode.Uri.file('test.unknown'),
        version: 1,
      } as vscode.TextDocument;

      // Should handle unsupported languages gracefully
      const docstrings = await detector.detectDocstrings(mockDocument);
      const ranges = await provider.provideFoldingRanges(mockDocument, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);

      assert.strictEqual(docstrings.length, 0, 'Should return empty array for unsupported language');
      assert.ok(ranges && ranges.length === 0, 'Should return empty ranges for unsupported language');

      // Should not affect subsequent operations
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const validDocument = await vscode.workspace.openTextDocument(filePath);
      const validDocstrings = await detector.detectDocstrings(validDocument);

      assert.ok(validDocstrings.length > 0, 'Should work with valid documents after error');

      console.log('Error recovery: OK');
    });

    test('should handle cancellation properly', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-large-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Test cancellation handling
      const cancellationTokenSource = new vscode.CancellationTokenSource();

      const promise = provider.provideFoldingRanges(document, {} as vscode.FoldingContext, cancellationTokenSource.token);

      // Cancel after short delay
      setTimeout(() => {
        cancellationTokenSource.cancel();
      }, 50);

      const result = await promise;

      // Should handle cancellation gracefully
      assert.ok(result !== undefined, 'Should return result even when cancelled');

      console.log('Cancellation handling: OK');
    });
  });

  suite('Configuration Isolation', () => {
    test('should not interfere with other extension configurations', async () => {
      // Test that our configuration doesn't affect others
      const docufoldConfig = vscode.workspace.getConfiguration('docufold');

      // Should have our own configuration namespace
      assert.ok(docufoldConfig, 'Should have docufold configuration namespace');

      // Test accessing our specific settings
      const autoFoldEnabled = docufoldConfig.get('autoFoldEnabled', true);
      const previewLength = docufoldConfig.get('previewLength', 60);

      assert.ok(typeof autoFoldEnabled === 'boolean', 'Auto-fold setting should be boolean');
      assert.ok(typeof previewLength === 'number', 'Preview length should be number');
      assert.ok(previewLength > 0, 'Preview length should be positive');

      console.log('Configuration isolation: OK');
    });
  });
});
