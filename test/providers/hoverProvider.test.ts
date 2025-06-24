import * as assert from 'assert';
import * as vscode from 'vscode';
import { DocuFoldHoverProvider } from '@/providers/hoverProvider';

suite('DocuFoldHoverProvider Test Suite', () => {
  let hoverProvider: DocuFoldHoverProvider;

  setup(() => {
    hoverProvider = new DocuFoldHoverProvider();
  });

  suite('Constructor', () => {
    test('should create hover provider with default services', () => {
      const provider = new DocuFoldHoverProvider();
      assert.ok(provider);
    });

    test('should create hover provider with custom services', () => {
      const provider = new DocuFoldHoverProvider(undefined, undefined);
      assert.ok(provider);
    });
  });

  suite('Provider Interface', () => {
    test('should implement VSCode HoverProvider interface', () => {
      assert.strictEqual(typeof hoverProvider.provideHover, 'function');
    });

    test('should have provideHover method with correct signature', () => {
      const method = hoverProvider.provideHover;
      assert.strictEqual(method.length, 3); // document, position, token
    });
  });

  suite('Content Formatting', () => {
    test('should format Python docstring content correctly', () => {
      const pythonContent = '"""This is a Python docstring with quotes"""';
      const formatted = (hoverProvider as any).formatDocstringContent(pythonContent, 'python');

      assert.ok(!formatted.includes('"""'));
      assert.ok(formatted.includes('This is a Python docstring'));
    });

    test('should format JavaScript JSDoc content correctly', () => {
      const jsContent = '/**\n * This is JSDoc\n * @param test\n */';
      const formatted = (hoverProvider as any).formatDocstringContent(jsContent, 'javascript');

      assert.ok(!formatted.includes('/**'));
      assert.ok(!formatted.includes('*/'));
      assert.ok(formatted.includes('This is JSDoc'));
      assert.ok(formatted.includes('@param test'));
    });

    test('should format C# XML documentation correctly', () => {
      const csharpContent = '/// <summary>\n/// This is C# XML doc\n/// </summary>';
      const formatted = (hoverProvider as any).formatDocstringContent(csharpContent, 'csharp');

      assert.ok(!formatted.includes('///'));
      assert.ok(!formatted.includes('<summary>'));
      assert.ok(formatted.includes('This is C# XML doc'));
    });

    test('should truncate long content', () => {
      const longContent = 'A'.repeat(1000);
      const formatted = (hoverProvider as any).formatDocstringContent(longContent, 'python');

      assert.ok(formatted.length <= 503); // 500 + '...'
      assert.ok(formatted.endsWith('...'));
    });

    test('should handle empty content', () => {
      const formatted = (hoverProvider as any).formatDocstringContent('', 'python');
      assert.strictEqual(formatted, '');
    });
  });

  suite('Hover Creation', () => {
    test('should create hover with markdown content', () => {
      const mockDocstring = {
        startPosition: new vscode.Position(1, 0),
        endPosition: new vscode.Position(3, 6),
        content: 'Sample docstring content',
        preview: 'Sample docstring',
        language: 'python',
        isSingleLine: false,
      };

      const hover = (hoverProvider as any).createHover(mockDocstring, 'python');

      assert.ok(hover instanceof vscode.Hover);
      assert.ok(hover.contents.length > 0);

      const markdown = hover.contents[0] as vscode.MarkdownString;
      assert.ok(markdown instanceof vscode.MarkdownString);
      assert.strictEqual(markdown.isTrusted, true);
      assert.ok(markdown.value.includes('DocuFold Preview'));
    });

    test('should include correct range in hover', () => {
      const mockDocstring = {
        startPosition: new vscode.Position(1, 0),
        endPosition: new vscode.Position(3, 6),
        content: 'Sample docstring content',
        preview: 'Sample docstring',
        language: 'python',
        isSingleLine: false,
      };

      const hover = (hoverProvider as any).createHover(mockDocstring, 'python');

      assert.ok(hover.range);
      assert.deepStrictEqual(hover.range.start, mockDocstring.startPosition);
      assert.deepStrictEqual(hover.range.end, mockDocstring.endPosition);
    });
  });
});
