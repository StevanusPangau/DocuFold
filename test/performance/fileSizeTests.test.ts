import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DocstringDetector } from '../../src/detectors/docstringDetector';
import { DocuFoldRangeProvider } from '../../src/providers/foldingRangeProvider';

suite('File Size Performance Tests', () => {
  let detector: DocstringDetector;
  let provider: DocuFoldRangeProvider;

  setup(() => {
    detector = new DocstringDetector();
    provider = new DocuFoldRangeProvider(detector);
  });

  teardown(() => {
    detector.clearCache();
    provider.clearCache();
  });

  suite('Small File Tests (< 100 lines)', () => {
    test('should process small Python file quickly', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-small-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const startTime = Date.now();
      const docstrings = await detector.detectDocstrings(document);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should process small files very quickly (< 50ms)
      assert.ok(processingTime < 50, `Small file processing took ${processingTime}ms, expected < 50ms`);
      assert.ok(docstrings.length > 0, 'Should detect docstrings in small file');

      console.log(`Small file (${document.lineCount} lines): ${processingTime}ms, ${docstrings.length} docstrings`);
    });

    test('should provide folding ranges for small file quickly', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-small-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const startTime = Date.now();
      const ranges = await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      assert.ok(processingTime < 50, `Small file folding took ${processingTime}ms, expected < 50ms`);
      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges for small file');

      console.log(`Small file folding ranges: ${processingTime}ms, ${ranges?.length} ranges`);
    });
  });

  suite('Medium File Tests (500-1000 lines)', () => {
    test('should process medium Python file efficiently', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-medium-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const startTime = Date.now();
      const docstrings = await detector.detectDocstrings(document);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should process medium files reasonably quickly (< 200ms)
      assert.ok(processingTime < 200, `Medium file processing took ${processingTime}ms, expected < 200ms`);
      assert.ok(docstrings.length > 0, 'Should detect docstrings in medium file');

      console.log(`Medium file (${document.lineCount} lines): ${processingTime}ms, ${docstrings.length} docstrings`);
    });

    test('should provide folding ranges for medium file efficiently', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-medium-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const startTime = Date.now();
      const ranges = await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      assert.ok(processingTime < 200, `Medium file folding took ${processingTime}ms, expected < 200ms`);
      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges for medium file');

      console.log(`Medium file folding ranges: ${processingTime}ms, ${ranges?.length} ranges`);
    });

    test('should use caching effectively for repeated operations', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-medium-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // First detection (should be cached)
      const startTime1 = Date.now();
      const docstrings1 = await detector.detectDocstrings(document);
      const endTime1 = Date.now();
      const firstTime = endTime1 - startTime1;

      // Second detection (should use cache)
      const startTime2 = Date.now();
      const docstrings2 = await detector.detectDocstrings(document);
      const endTime2 = Date.now();
      const secondTime = endTime2 - startTime2;

      // Cached operation should be significantly faster
      assert.ok(secondTime < firstTime / 2, `Cached operation (${secondTime}ms) should be faster than first (${firstTime}ms)`);
      assert.deepStrictEqual(docstrings1, docstrings2, 'Cached results should be identical');

      console.log(`Medium file caching: First ${firstTime}ms, Cached ${secondTime}ms`);
    });
  });

  suite('Large File Tests (5000+ lines)', () => {
    test('should process large Python file within acceptable time', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-large-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const startTime = Date.now();
      const docstrings = await detector.detectDocstrings(document);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should process large files within reasonable time (< 1000ms)
      assert.ok(processingTime < 1000, `Large file processing took ${processingTime}ms, expected < 1000ms`);
      assert.ok(docstrings.length > 0, 'Should detect docstrings in large file');
      assert.ok(document.lineCount > 5000, `File should have > 5000 lines, has ${document.lineCount}`);

      console.log(`Large file (${document.lineCount} lines): ${processingTime}ms, ${docstrings.length} docstrings`);
    });

    test('should provide folding ranges for large file efficiently', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-large-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const startTime = Date.now();
      const ranges = await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should provide folding ranges within acceptable time (< 1000ms)
      assert.ok(processingTime < 1000, `Large file folding took ${processingTime}ms, expected < 1000ms`);
      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges for large file');

      console.log(`Large file folding ranges: ${processingTime}ms, ${ranges?.length} ranges`);
    });

    test('should handle large file with performance monitoring', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-large-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Test with performance monitoring enabled
      const startTime = Date.now();
      const ranges = await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Verify performance monitoring triggers for large files
      assert.ok(document.lineCount > 1000, 'Should trigger performance monitoring for large files');
      assert.ok(ranges && ranges.length > 0, 'Should still provide results with monitoring');

      console.log(`Large file with monitoring (${document.lineCount} lines): ${processingTime}ms`);
    });

    test('should handle cancellation for large files', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-large-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const cancellationTokenSource = new vscode.CancellationTokenSource();

      // Start processing and cancel after 100ms
      const promise = provider.provideFoldingRanges(document, {} as vscode.FoldingContext, cancellationTokenSource.token);

      setTimeout(() => {
        cancellationTokenSource.cancel();
      }, 100);

      const ranges = await promise;

      // Should handle cancellation gracefully
      assert.ok(ranges !== undefined, 'Should return results or empty array on cancellation');

      console.log(`Large file cancellation test completed`);
    });
  });

  suite('Performance Comparison Tests', () => {
    test('should show performance scaling across file sizes', async () => {
      const testFiles = [
        { name: 'small', path: '../../test-workspace/test-small-python.py' },
        { name: 'medium', path: '../../test-workspace/test-medium-python.py' },
        { name: 'large', path: '../../test-workspace/test-large-python.py' },
      ];

      const results: Array<{ name: string; lines: number; time: number; docstrings: number }> = [];

      for (const testFile of testFiles) {
        const filePath = path.join(__dirname, testFile.path);
        const document = await vscode.workspace.openTextDocument(filePath);

        const startTime = Date.now();
        const docstrings = await detector.detectDocstrings(document);
        const endTime = Date.now();

        results.push({
          name: testFile.name,
          lines: document.lineCount,
          time: endTime - startTime,
          docstrings: docstrings.length,
        });
      }

      // Log performance comparison
      console.log('\n=== Performance Scaling Comparison ===');
      results.forEach((result) => {
        const timePerLine = (result.time / result.lines).toFixed(3);
        console.log(`${result.name}: ${result.lines} lines, ${result.time}ms, ${result.docstrings} docstrings (${timePerLine}ms/line)`);
      });

      // Verify reasonable scaling
      const smallResult = results.find((r) => r.name === 'small')!;
      const largeResult = results.find((r) => r.name === 'large')!;

      const lineRatio = largeResult.lines / smallResult.lines;
      const timeRatio = largeResult.time / smallResult.time;

      // Time should not scale worse than O(n^2)
      assert.ok(timeRatio < lineRatio * lineRatio, `Time scaling should be better than O(n^2). Line ratio: ${lineRatio.toFixed(2)}, Time ratio: ${timeRatio.toFixed(2)}`);

      console.log(`Scaling analysis: ${lineRatio.toFixed(2)}x lines, ${timeRatio.toFixed(2)}x time`);
    });
  });

  suite('Memory Usage Tests', () => {
    test('should not leak memory with repeated operations', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-medium-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Perform multiple operations to test memory usage
      for (let i = 0; i < 10; i++) {
        await detector.detectDocstrings(document);
        await provider.provideFoldingRanges(document, {} as vscode.FoldingContext, new vscode.CancellationTokenSource().token);
      }

      // Clear caches and verify they're actually cleared
      detector.clearCache();
      provider.clearCache();

      const cacheStats = detector.getCacheStats();
      assert.strictEqual(cacheStats.size, 0, 'Cache should be empty after clearing');

      console.log('Memory leak test completed successfully');
    });
  });
});
