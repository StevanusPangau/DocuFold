import * as assert from 'assert';
import * as vscode from 'vscode';
import { DocstringDetector } from '../../src/detectors/docstringDetector';
import { DocstringInfo, SupportedLanguage } from '../../src/types';

/**
 * Helper function to create a mock VSCode document
 */
function createMockDocument(content: string, languageId: string, fileName: string = 'test.py'): vscode.TextDocument {
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

suite('DocstringDetector Tests', () => {
  let detector: DocstringDetector;

  setup(() => {
    detector = new DocstringDetector();
  });

  suite('Python Docstring Detection', () => {
    test('should detect single-line Python docstring with triple double quotes', async () => {
      const content = `def test_function():
    """This is a single line docstring"""
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'python');
      assert.strictEqual(docstrings[0].isSingleLine, true);
      assert.strictEqual(docstrings[0].preview, 'This is a single line docstring');
      assert.strictEqual(docstrings[0].startPosition.line, 1);
    });

    test('should detect multi-line Python docstring with triple double quotes', async () => {
      const content = `def test_function():
    """
    This is a multi-line docstring
    with detailed description.
    """
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'python');
      assert.strictEqual(docstrings[0].isSingleLine, false);
      assert.strictEqual(docstrings[0].preview, 'This is a multi-line docstring');
      assert.strictEqual(docstrings[0].startPosition.line, 1);
      assert.strictEqual(docstrings[0].endPosition.line, 4);
    });

    test('should detect Python docstring with triple single quotes', async () => {
      const content = `def test_function():
    '''This is a single quote docstring'''
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'python');
      assert.strictEqual(docstrings[0].preview, 'This is a single quote docstring');
    });

    test('should handle unclosed Python docstring gracefully', async () => {
      const content = `def test_function():
    """This is an unclosed docstring
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 0);
    });

    test('should detect multiple Python docstrings', async () => {
      const content = `def function1():
    """First function docstring"""
    pass

def function2():
    """
    Second function docstring
    with multiple lines
    """
    pass`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 2);
      assert.strictEqual(docstrings[0].preview, 'First function docstring');
      assert.strictEqual(docstrings[1].preview, 'Second function docstring');
    });
  });

  suite('JavaScript/TypeScript JSDoc Detection', () => {
    test('should detect single-line JSDoc comment', async () => {
      const content = `/** This is a single line JSDoc */
function testFunction() {
    return true;
}`;

      const document = createMockDocument(content, 'javascript', 'test.js');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'javascript');
      assert.strictEqual(docstrings[0].isSingleLine, true);
      assert.strictEqual(docstrings[0].preview, 'This is a single line JSDoc');
    });

    test('should detect multi-line JSDoc comment', async () => {
      const content = `/**
 * This is a multi-line JSDoc comment
 * with detailed description.
 * @param {string} name - Parameter description
 * @returns {boolean} Return description
 */
function testFunction(name) {
    return true;
}`;

      const document = createMockDocument(content, 'javascript', 'test.js');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'javascript');
      assert.strictEqual(docstrings[0].isSingleLine, false);
      assert.strictEqual(docstrings[0].preview, 'This is a multi-line JSDoc comment');
    });

    test('should detect TypeScript JSDoc comment', async () => {
      const content = `/**
 * TypeScript function with JSDoc
 * @param name - The name parameter
 * @returns The result
 */
function testFunction(name: string): boolean {
    return true;
}`;

      const document = createMockDocument(content, 'typescript', 'test.ts');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'typescript');
      assert.strictEqual(docstrings[0].preview, 'TypeScript function with JSDoc');
    });
  });

  suite('C# XML Documentation Detection', () => {
    test('should detect single-line C# XML documentation', async () => {
      const content = `/// <summary>This is a single line C# documentation</summary>
public void TestMethod() {
    // method body
}`;

      const document = createMockDocument(content, 'csharp', 'test.cs');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'csharp');
      assert.strictEqual(docstrings[0].isSingleLine, true);
      assert.strictEqual(docstrings[0].preview, 'This is a single line C# documentation');
    });

    test('should detect multi-line C# XML documentation', async () => {
      const content = `/// <summary>
/// This is a multi-line C# documentation
/// with detailed description.
/// </summary>
/// <param name="value">Parameter description</param>
/// <returns>Return description</returns>
public string TestMethod(string value) {
    return value;
}`;

      const document = createMockDocument(content, 'csharp', 'test.cs');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'csharp');
      assert.strictEqual(docstrings[0].isSingleLine, false);
      assert.strictEqual(docstrings[0].preview, 'This is a multi-line C# documentation');
    });
  });

  suite('Java Documentation Detection', () => {
    test('should detect Java documentation comment', async () => {
      const content = `/**
 * This is a Java documentation comment
 * @param args Command line arguments
 */
public static void main(String[] args) {
    System.out.println("Hello World");
}`;

      const document = createMockDocument(content, 'java', 'test.java');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'java');
      assert.strictEqual(docstrings[0].preview, 'This is a Java documentation comment');
    });
  });

  suite('PHP Documentation Detection', () => {
    test('should detect PHP documentation comment', async () => {
      const content = `<?php
/**
 * This is a PHP documentation comment
 * @param string $name The name parameter
 * @return bool The result
 */
function testFunction($name) {
    return true;
}
?>`;

      const document = createMockDocument(content, 'php', 'test.php');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].language, 'php');
      assert.strictEqual(docstrings[0].preview, 'This is a PHP documentation comment');
    });
  });

  suite('Pattern Registry Tests', () => {
    test('should register new language pattern', () => {
      const customPattern = {
        language: 'rust' as SupportedLanguage,
        startPattern: /^\s*(\/\/\/)/,
        endPattern: /$/,
        singleLinePattern: /^\s*(\/\/\/.+)$/,
        multiline: false,
      };

      detector.registerPattern(customPattern);
      const patterns = detector.getPatterns('rust' as SupportedLanguage);

      assert.strictEqual(patterns.length, 1);
      assert.strictEqual(patterns[0].language, 'rust');
    });

    test('should register multiple patterns for same language', () => {
      const pattern1 = {
        language: 'python' as SupportedLanguage,
        startPattern: /^\s*(r""")/,
        endPattern: /(""")\s*$/,
        singleLinePattern: /^\s*(r""".+""")\s*$/,
        multiline: true,
      };

      detector.registerPattern(pattern1);
      const patterns = detector.getPatterns('python');

      // Should have original patterns plus the new one
      assert.ok(patterns.length >= 3);
    });

    test('should check if language is supported', () => {
      assert.strictEqual(detector.isLanguageSupported('python'), true);
      assert.strictEqual(detector.isLanguageSupported('javascript'), true);
      assert.strictEqual(detector.isLanguageSupported('rust' as SupportedLanguage), false);
    });

    test('should get list of supported languages', () => {
      const languages = detector.getSupportedLanguages();
      assert.ok(languages.includes('python'));
      assert.ok(languages.includes('javascript'));
      assert.ok(languages.includes('typescript'));
      assert.ok(languages.includes('csharp'));
    });
  });

  suite('Performance and Caching Tests', () => {
    test('should cache detection results', async () => {
      const content = `def test_function():
    """This is a test docstring"""
    return True`;

      const document = createMockDocument(content, 'python');

      // First call
      const start1 = Date.now();
      const docstrings1 = await detector.detectDocstrings(document);
      const time1 = Date.now() - start1;

      // Second call (should be cached)
      const start2 = Date.now();
      const docstrings2 = await detector.detectDocstrings(document);
      const time2 = Date.now() - start2;

      assert.strictEqual(docstrings1.length, docstrings2.length);
      assert.strictEqual(docstrings1[0].preview, docstrings2[0].preview);

      // Second call should be faster (cached)
      assert.ok(time2 <= time1);
    });

    test('should provide cache statistics', () => {
      const stats = detector.getCacheStats();
      assert.ok(typeof stats.size === 'number');
      assert.ok(stats.size >= 0);
    });

    test('should clear cache', async () => {
      const content = `def test_function():
    """Test docstring"""
    return True`;

      const document = createMockDocument(content, 'python');
      await detector.detectDocstrings(document);

      let stats = detector.getCacheStats();
      assert.ok(stats.size > 0);

      detector.clearCache();
      stats = detector.getCacheStats();
      assert.strictEqual(stats.size, 0);
    });
  });

  suite('Edge Cases and Error Handling', () => {
    test('should handle empty document', async () => {
      const document = createMockDocument('', 'python');
      const docstrings = await detector.detectDocstrings(document);
      assert.strictEqual(docstrings.length, 0);
    });

    test('should handle unsupported language', async () => {
      const document = createMockDocument('some content', 'unsupported');
      const docstrings = await detector.detectDocstrings(document);
      assert.strictEqual(docstrings.length, 0);
    });

    test('should handle malformed docstrings', async () => {
      const content = `def test_function():
    """Malformed docstring
    # This is not properly closed
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);
      assert.strictEqual(docstrings.length, 0);
    });

    test('should remove duplicate docstrings', async () => {
      // This might happen if multiple patterns match the same text
      const content = `def test_function():
    """Test docstring"""
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      // Should not have duplicates
      const positions = docstrings.map((d) => `${d.startPosition.line}-${d.startPosition.character}`);
      const uniquePositions = [...new Set(positions)];
      assert.strictEqual(positions.length, uniquePositions.length);
    });

    test('should handle very long preview text', async () => {
      const longText = 'This is a very long docstring that should be truncated because it exceeds the maximum preview length limit';
      const content = `def test_function():
    """${longText}"""
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.ok(docstrings[0].preview.length <= 60);
      assert.ok(docstrings[0].preview.endsWith('...'));
    });

    test('should handle nested quotes in docstrings', async () => {
      const content = `def test_function():
    """This docstring has "nested quotes" inside"""
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.ok(docstrings[0].preview.includes('nested quotes'));
    });
  });

  suite('Boundary Detection Tests', () => {
    test('should correctly detect docstring boundaries', async () => {
      const content = `def test_function():
    """
    This is a test docstring
    with multiple lines
    """
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].startPosition.line, 1);
      assert.strictEqual(docstrings[0].endPosition.line, 4);
      assert.ok(docstrings[0].startPosition.character >= 0);
      assert.ok(docstrings[0].endPosition.character >= 0);
    });

    test('should handle indented docstrings', async () => {
      const content = `class TestClass:
    def test_method(self):
        """
        This is an indented docstring
        inside a class method
        """
        pass`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].startPosition.line, 2);
      assert.ok(docstrings[0].startPosition.character > 0); // Should be indented
    });
  });

  suite('Preview Text Extraction Tests', () => {
    test('should extract meaningful preview from Python docstring', async () => {
      const content = `def test_function():
    """
    
    This is the actual content after empty lines
    More details here
    """
    return True`;

      const document = createMockDocument(content, 'python');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].preview, 'This is the actual content after empty lines');
    });

    test('should extract preview from JSDoc with asterisks', async () => {
      const content = `/**
 * This is the main description
 * with asterisks on each line
 * @param name Parameter description
 */
function test() {}`;

      const document = createMockDocument(content, 'javascript', 'test.js');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].preview, 'This is the main description');
    });

    test('should extract preview from C# XML documentation', async () => {
      const content = `/// <summary>
/// This is the summary text
/// </summary>
public void Test() {}`;

      const document = createMockDocument(content, 'csharp', 'test.cs');
      const docstrings = await detector.detectDocstrings(document);

      assert.strictEqual(docstrings.length, 1);
      assert.strictEqual(docstrings[0].preview, 'This is the summary text');
    });
  });
});
