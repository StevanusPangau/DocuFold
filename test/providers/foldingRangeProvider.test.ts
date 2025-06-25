import * as assert from 'assert';
import * as vscode from 'vscode';
import { DocuFoldRangeProvider } from '../../src/providers/foldingRangeProvider';
import { DocstringDetector } from '../../src/detectors/docstringDetector';
import { DocstringInfo } from '../../src/types';

/**
 * Helper function to create a mock VSCode document
 */
function createMockDocument(
  content: string,
  languageId: string,
  fileName: string = 'test.py'
): vscode.TextDocument {
  const lines = content.split('\n');
  return {
    uri: vscode.Uri.file(fileName),
    fileName,
    isUntitled: false,
    languageId,
    version: 1,
    isDirty: false,
    isClosed: false,
    save: async () => true,
    eol: vscode.EndOfLine.LF,
    lineCount: lines.length,
    lineAt: (line: number) => ({
      lineNumber: line,
      text: lines[line] || '',
      range: new vscode.Range(line, 0, line, (lines[line] || '').length),
      rangeIncludingLineBreak: new vscode.Range(line, 0, line + 1, 0),
      firstNonWhitespaceCharacterIndex: 0,
      isEmptyOrWhitespace: !(lines[line] || '').trim(),
    }),
    offsetAt: (position: vscode.Position) => {
      let offset = 0;
      for (let i = 0; i < position.line; i++) {
        offset += (lines[i] || '').length + 1; // +1 for newline
      }
      return offset + position.character;
    },
    positionAt: (offset: number) => {
      let currentOffset = 0;
      for (let line = 0; line < lines.length; line++) {
        const lineLength = (lines[line] || '').length + 1; // +1 for newline
        if (currentOffset + lineLength > offset) {
          return new vscode.Position(line, offset - currentOffset);
        }
        currentOffset += lineLength;
      }
      return new vscode.Position(lines.length - 1, (lines[lines.length - 1] || '').length);
    },
    getText: (range?: vscode.Range) => {
      if (!range) {
        return content;
      }
      const startOffset = Math.max(0, range.start.line);
      const endOffset = Math.min(lines.length, range.end.line + 1);
      return lines.slice(startOffset, endOffset).join('\n');
    },
    getWordRangeAtPosition: () => undefined,
    validateRange: (range: vscode.Range) => range,
    validatePosition: (position: vscode.Position) => position,
  } as vscode.TextDocument;
}

/**
 * Mock cancellation token
 */
function createMockCancellationToken(cancelled: boolean = false): vscode.CancellationToken {
  return {
    isCancellationRequested: cancelled,
    onCancellationRequested: () => ({ dispose: () => {} }),
  } as vscode.CancellationToken;
}

suite('DocuFoldRangeProvider Tests', () => {
  let provider: DocuFoldRangeProvider;
  let detector: DocstringDetector;

  setup(() => {
    detector = new DocstringDetector();
    provider = new DocuFoldRangeProvider(detector);
  });

  suite('Task 3.1: VSCode FoldingRangeProvider Interface', () => {
    test('should implement VSCode FoldingRangeProvider interface', () => {
      assert.ok(provider instanceof DocuFoldRangeProvider);
      assert.ok(typeof provider.provideFoldingRanges === 'function');
    });

    test('should provide folding ranges for Python docstrings', async () => {
      const content = `def test_function():
    """
    This is a multi-line docstring
    with detailed description.
    """
    return True

def another_function():
    """Another docstring"""
    pass`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      assert.ok(Array.isArray(ranges));
      assert.strictEqual(ranges.length, 1); // Only multi-line docstring should be foldable
      assert.strictEqual(ranges[0].start, 1);
      assert.strictEqual(ranges[0].end, 4);
      assert.strictEqual(ranges[0].kind, vscode.FoldingRangeKind.Comment);
    });

    test('should handle cancellation token', async () => {
      const content = `def test_function():
    """Multi-line docstring"""
    pass`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken(true); // Cancelled
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      assert.strictEqual(ranges.length, 0);
    });

    test('should return empty array for unsupported languages', async () => {
      const content = `some content`;
      const document = createMockDocument(content, 'unsupported');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      assert.strictEqual(ranges.length, 0);
    });
  });

  suite('Task 3.2: Integration with Docstring Detector', () => {
    test('should integrate with docstring detector', async () => {
      const content = `/**
 * JavaScript JSDoc comment
 * with multiple lines
 */
function testFunction() {
    return true;
}`;

      const document = createMockDocument(content, 'javascript', 'test.js');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      assert.strictEqual(ranges.length, 1);
      assert.strictEqual(ranges[0].start, 0);
      assert.strictEqual(ranges[0].end, 3);
    });

    test('should get docstrings for debugging', async () => {
      const content = `def test_function():
    """Test docstring"""
    pass`;

      const document = createMockDocument(content, 'python');
      const docstrings = await provider.getDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'python');
      assert.strictEqual(docstrings[0].preview, 'Test docstring');
    });
  });

  suite('Task 3.3: Auto-folding Functionality', () => {
    test('should enable/disable auto-folding', () => {
      assert.strictEqual(provider.isAutoFoldEnabled(), true); // Default enabled

      provider.setAutoFoldEnabled(false);
      assert.strictEqual(provider.isAutoFoldEnabled(), false);

      provider.setAutoFoldEnabled(true);
      assert.strictEqual(provider.isAutoFoldEnabled(), true);
    });

    test('should skip auto-folding when disabled', async () => {
      const content = `def test_function():
    """Test docstring"""
    pass`;

      const document = createMockDocument(content, 'python');
      provider.setAutoFoldEnabled(false);

      // This would normally apply folding, but should skip when disabled
      await provider.applyAutoFolding(document);
      // Since we can't easily test VSCode commands, we just ensure no errors are thrown
      assert.ok(true);
    });
  });

  suite('Task 3.4: Folding Range Calculation Logic', () => {
    test('should calculate folding ranges for valid docstrings', async () => {
      const content = `class TestClass:
    """
    Class docstring
    with multiple lines
    """
    
    def method1(self):
        """
        Method docstring
        line 2
        line 3
        """
        pass
    
    def method2(self):
        """Single line method docstring"""
        pass`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      assert.strictEqual(ranges.length, 2); // Two multi-line docstrings

      // First docstring (class)
      assert.strictEqual(ranges[0].start, 1);
      assert.strictEqual(ranges[0].end, 4);

      // Second docstring (method1)
      assert.strictEqual(ranges[1].start, 7);
      assert.strictEqual(ranges[1].end, 10);
    });

    test('should validate folding ranges', async () => {
      const content = `def test_function():
    """Valid multi-line
    docstring"""
    
    def invalid_function():
    """Invalid docstring on same line"""`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      // Should only include valid multi-line docstring
      assert.strictEqual(ranges.length, 1);
      assert.strictEqual(ranges[0].start, 1);
      assert.strictEqual(ranges[0].end, 2);
    });

    test('should handle edge cases in validation', async () => {
      const content = `def test_function():
    """Single line docstring"""
    pass`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      // Single line docstrings should not be foldable
      assert.strictEqual(ranges.length, 0);
    });
  });

  suite('Task 3.5: Performance Optimization for Large Files', () => {
    test('should handle large files efficiently', async () => {
      // Create a large file content
      const functionTemplate = `def function_{index}():
    """
    Docstring for function {index}
    with multiple lines
    """
    return {index}

`;

      let content = '';
      for (let i = 0; i < 500; i++) {
        content += functionTemplate.replace(/{index}/g, i.toString());
      }

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();

      const startTime = Date.now();
      const ranges = await provider.provideFoldingRanges(document, {}, token);
      const endTime = Date.now();

      // Should detect all docstrings
      assert.strictEqual(ranges.length, 500);

      // Should complete in reasonable time (less than 1 second for 500 functions)
      const executionTime = endTime - startTime;
      assert.ok(
        executionTime < 1000,
        `Execution time ${executionTime}ms should be less than 1000ms`
      );
    });

    test('should process large files in chunks', async () => {
      // Create content with 1500 lines to trigger chunk processing
      let content = '';
      for (let i = 0; i < 300; i++) {
        content += `def function_${i}():\n    """\n    Docstring ${i}\n    """\n    pass\n\n`;
      }

      const document = createMockDocument(content, 'python');
      const ranges = await provider.processLargeFile(document, 500);

      // Should still detect all docstrings
      assert.strictEqual(ranges.length, 300);
      assert.ok(ranges.every(range => range.kind === vscode.FoldingRangeKind.Comment));
    });
  });

  suite('Task 3.6: Folding Range Caching', () => {
    test('should cache folding ranges', async () => {
      const content = `def test_function():
    """
    Test docstring
    with multiple lines
    """
    return True`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();

      // First call
      const startTime1 = Date.now();
      const ranges1 = await provider.provideFoldingRanges(document, {}, token);
      const endTime1 = Date.now();

      // Second call (should be cached)
      const startTime2 = Date.now();
      const ranges2 = await provider.provideFoldingRanges(document, {}, token);
      const endTime2 = Date.now();

      // Results should be identical
      assert.strictEqual(ranges1.length, ranges2.length);
      assert.strictEqual(ranges1[0].start, ranges2[0].start);
      assert.strictEqual(ranges1[0].end, ranges2[0].end);

      // Second call should be faster (cached)
      const time1 = endTime1 - startTime1;
      const time2 = endTime2 - startTime2;
      assert.ok(
        time2 <= time1,
        `Cached call (${time2}ms) should be faster than first call (${time1}ms)`
      );
    });

    test('should provide cache statistics', () => {
      const stats = provider.getCacheStats();
      assert.ok(typeof stats.size === 'number');
      assert.ok(stats.size >= 0);
    });

    test('should clear cache', async () => {
      const content = `def test_function():
    """Test docstring"""
    pass`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();

      // Populate cache
      await provider.provideFoldingRanges(document, {}, token);
      let stats = provider.getCacheStats();
      assert.ok(stats.size > 0);

      // Clear cache
      provider.clearCache();
      stats = provider.getCacheStats();
      assert.strictEqual(stats.size, 0);
    });
  });

  suite('Task 3.7: Error Handling and Fallback Mechanisms', () => {
    test('should handle errors gracefully', async () => {
      // Create a mock that throws an error
      const mockDetector = {
        detectDocstrings: async () => {
          throw new Error('Test error');
        },
      } as any;

      const errorProvider = new DocuFoldRangeProvider(mockDetector);
      const document = createMockDocument('test content', 'python');
      const token = createMockCancellationToken();

      // Should not throw, should return empty array
      const ranges = await errorProvider.provideFoldingRanges(document, {}, token);
      assert.strictEqual(ranges.length, 0);
    });

    test('should handle cancellation during processing', async () => {
      const content = `def test_function():
    """Test docstring"""
    pass`;

      const document = createMockDocument(content, 'python');

      // Create a token that becomes cancelled during processing
      let cancelled = false;
      const token = {
        isCancellationRequested: () => cancelled,
        onCancellationRequested: () => ({ dispose: () => {} }),
      } as vscode.CancellationToken;

      // Start the operation and cancel it
      const rangesPromise = provider.provideFoldingRanges(document, {}, token);
      cancelled = true; // Cancel during processing

      const ranges = await rangesPromise;
      assert.strictEqual(ranges.length, 0);
    });

    test('should handle invalid document gracefully', async () => {
      const invalidDocument = {
        uri: vscode.Uri.file('invalid.py'),
        languageId: 'python',
        lineCount: 0,
        version: 1,
      } as any;

      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(invalidDocument, {}, token);

      // Should handle gracefully and return empty array
      assert.strictEqual(ranges.length, 0);
    });
  });

  suite('Task 3.8: Manual Folding Commands', () => {
    test('should fold all docstrings', async () => {
      const content = `def function1():
    """Docstring 1"""
    pass

def function2():
    """
    Docstring 2
    """
    pass`;

      const document = createMockDocument(content, 'python');

      // Mock editor is not easily testable, but we ensure no errors are thrown
      await provider.foldAllDocstrings(document);
      assert.ok(true);
    });

    test('should unfold all docstrings', async () => {
      const content = `def function1():
    """Docstring 1"""
    pass`;

      const document = createMockDocument(content, 'python');

      await provider.unfoldAllDocstrings(document);
      assert.ok(true);
    });

    test('should toggle docstring at position', async () => {
      const content = `def test_function():
    """
    Test docstring
    """
    pass`;

      const document = createMockDocument(content, 'python');
      const position = new vscode.Position(2, 0); // Inside docstring

      await provider.toggleDocstringAtPosition(document, position, true);
      await provider.toggleDocstringAtPosition(document, position, false);
      assert.ok(true);
    });

    test('should handle position outside docstring', async () => {
      const content = `def test_function():
    """Test docstring"""
    return True  # This line`;

      const document = createMockDocument(content, 'python');
      const position = new vscode.Position(2, 0); // Outside docstring

      // Should handle gracefully when no docstring at position
      await provider.toggleDocstringAtPosition(document, position, true);
      assert.ok(true);
    });
  });

  suite('Multi-language Support', () => {
    test('should handle JavaScript JSDoc', async () => {
      const content = `/**
 * JavaScript function
 * @param {string} name
 * @returns {boolean}
 */
function testFunction(name) {
    return true;
}`;

      const document = createMockDocument(content, 'javascript', 'test.js');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      assert.strictEqual(ranges.length, 1);
      assert.strictEqual(ranges[0].start, 0);
      assert.strictEqual(ranges[0].end, 4);
    });

    test('should handle C# XML documentation', async () => {
      const content = `/// <summary>
/// C# method documentation
/// </summary>
/// <param name="value">Parameter</param>
public void TestMethod(string value) {
    // method body
}`;

      const document = createMockDocument(content, 'csharp', 'test.cs');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      assert.strictEqual(ranges.length, 1);
      assert.strictEqual(ranges[0].start, 0);
      assert.strictEqual(ranges[0].end, 3);
    });

    test('should handle mixed language patterns', async () => {
      const content = `/**
 * Block comment docstring
 */
function blockComment() {}

/// Single line XML comment
function xmlComment() {}`;

      const document = createMockDocument(content, 'typescript', 'test.ts');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      // Should detect the block comment
      assert.strictEqual(ranges.length, 1);
      assert.strictEqual(ranges[0].start, 0);
      assert.strictEqual(ranges[0].end, 2);
    });
  });

  suite('Edge Cases and Boundary Conditions', () => {
    test('should handle empty documents', async () => {
      const document = createMockDocument('', 'python');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      assert.strictEqual(ranges.length, 0);
    });

    test('should handle documents with only single-line docstrings', async () => {
      const content = `def func1():
    """Single line 1"""
    pass

def func2():
    """Single line 2"""
    pass`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      // Single line docstrings should not be foldable
      assert.strictEqual(ranges.length, 0);
    });

    test('should handle malformed docstrings', async () => {
      const content = `def test_function():
    """Unclosed docstring
    return True`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      // Malformed docstrings should not create folding ranges
      assert.strictEqual(ranges.length, 0);
    });

    test('should handle very long docstrings', async () => {
      let longDocstring = '    """\n';
      for (let i = 0; i < 100; i++) {
        longDocstring += `    Line ${i} of very long docstring\n`;
      }
      longDocstring += '    """';

      const content = `def test_function():\n${longDocstring}\n    return True`;

      const document = createMockDocument(content, 'python');
      const token = createMockCancellationToken();
      const ranges = await provider.provideFoldingRanges(document, {}, token);

      assert.strictEqual(ranges.length, 1);
      assert.strictEqual(ranges[0].start, 1);
      assert.strictEqual(ranges[0].end, 101); // 100 lines + start/end
    });
  });
});
