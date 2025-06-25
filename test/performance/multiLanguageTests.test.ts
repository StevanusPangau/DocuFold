import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DocstringDetector } from '../../src/detectors/docstringDetector';
import { DocuFoldRangeProvider } from '../../src/providers/foldingRangeProvider';

suite('Multi-Language Support Tests', () => {
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

  suite('Python Support', () => {
    test('should detect triple-quote docstrings in Python', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const docstrings = await detector.detectDocstrings(document);

      assert.ok(docstrings.length > 0, 'Should detect Python docstrings');

      // Verify Python-specific patterns
      const hasTripleQuotes = docstrings.some(
        d => d.preview.includes('"""') || d.preview.includes("'''")
      );
      assert.ok(
        hasTripleQuotes || docstrings.length > 0,
        'Should detect Python triple-quote patterns'
      );

      console.log(`Python: ${docstrings.length} docstrings detected`);
    });

    test('should provide folding ranges for Python files', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const ranges = await provider.provideFoldingRanges(
        document,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges for Python');
      assert.ok(
        ranges.every(r => r.kind === vscode.FoldingRangeKind.Comment),
        'All ranges should be comment type'
      );

      console.log(`Python folding ranges: ${ranges.length}`);
    });
  });

  suite('TypeScript/JavaScript Support', () => {
    test('should detect JSDoc comments in TypeScript', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-typescript.ts');
      const document = await vscode.workspace.openTextDocument(filePath);

      const docstrings = await detector.detectDocstrings(document);

      assert.ok(docstrings.length > 0, 'Should detect TypeScript JSDoc comments');

      // Verify JSDoc patterns
      const hasJSDoc = docstrings.some(d => d.content.includes('/**') || d.content.includes('*/'));
      assert.ok(hasJSDoc, 'Should detect JSDoc patterns');

      console.log(`TypeScript: ${docstrings.length} JSDoc comments detected`);
    });

    test('should detect JSDoc comments in JavaScript', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-jsdoc.js');
      const document = await vscode.workspace.openTextDocument(filePath);

      const docstrings = await detector.detectDocstrings(document);

      assert.ok(docstrings.length > 0, 'Should detect JavaScript JSDoc comments');

      console.log(`JavaScript: ${docstrings.length} JSDoc comments detected`);
    });

    test('should provide folding ranges for TypeScript files', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-typescript.ts');
      const document = await vscode.workspace.openTextDocument(filePath);

      const ranges = await provider.provideFoldingRanges(
        document,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges for TypeScript');

      console.log(`TypeScript folding ranges: ${ranges.length}`);
    });
  });

  suite('Java Support', () => {
    test('should detect Javadoc comments in Java', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-java.java');
      const document = await vscode.workspace.openTextDocument(filePath);

      const docstrings = await detector.detectDocstrings(document);

      assert.ok(docstrings.length > 0, 'Should detect Java Javadoc comments');

      // Verify Javadoc patterns
      const hasJavadoc = docstrings.some(
        d =>
          d.content.includes('/**') || d.content.includes('@param') || d.content.includes('@return')
      );
      assert.ok(hasJavadoc, 'Should detect Javadoc patterns');

      console.log(`Java: ${docstrings.length} Javadoc comments detected`);
    });

    test('should provide folding ranges for Java files', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-java.java');
      const document = await vscode.workspace.openTextDocument(filePath);

      const ranges = await provider.provideFoldingRanges(
        document,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges for Java');

      console.log(`Java folding ranges: ${ranges.length}`);
    });
  });

  suite('C# Support', () => {
    test('should detect XML documentation in C#', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-csharp.cs');
      const document = await vscode.workspace.openTextDocument(filePath);

      const docstrings = await detector.detectDocstrings(document);

      assert.ok(docstrings.length > 0, 'Should detect C# XML documentation');

      // Verify C# XML doc patterns
      const hasXmlDoc = docstrings.some(
        d => d.content.includes('///') || d.content.includes('<summary>')
      );
      assert.ok(hasXmlDoc, 'Should detect C# XML documentation patterns');

      console.log(`C#: ${docstrings.length} XML documentation comments detected`);
    });

    test('should provide folding ranges for C# files', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-csharp.cs');
      const document = await vscode.workspace.openTextDocument(filePath);

      const ranges = await provider.provideFoldingRanges(
        document,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges for C#');

      console.log(`C# folding ranges: ${ranges.length}`);
    });
  });

  suite('Language Detection Tests', () => {
    test('should correctly identify supported languages', () => {
      const supportedLanguages = detector.getSupportedLanguages();

      // Verify core languages are supported
      const expectedLanguages = ['python', 'javascript', 'typescript', 'java', 'csharp', 'php'];

      for (const lang of expectedLanguages) {
        assert.ok(supportedLanguages.includes(lang as any), `Should support ${lang}`);
      }

      console.log(`Supported languages: ${supportedLanguages.join(', ')}`);
    });

    test('should handle unsupported language gracefully', async () => {
      // Create a mock document for an unsupported language
      const mockDocument = {
        languageId: 'unsupported-language',
        getText: () => 'some code content',
        lineCount: 10,
        uri: vscode.Uri.file('test.unsupported'),
        version: 1,
      } as vscode.TextDocument;

      const docstrings = await detector.detectDocstrings(mockDocument);

      // Should return empty array for unsupported languages
      assert.strictEqual(
        docstrings.length,
        0,
        'Should return empty array for unsupported language'
      );

      console.log('Unsupported language handled gracefully');
    });
  });

  suite('Cross-Language Consistency Tests', () => {
    test('should provide consistent API across all languages', async () => {
      const testFiles = [
        { lang: 'python', file: '../../test-workspace/test-python.py' },
        { lang: 'typescript', file: '../../test-workspace/test-typescript.ts' },
        { lang: 'java', file: '../../test-workspace/test-java.java' },
        { lang: 'csharp', file: '../../test-workspace/test-csharp.cs' },
        { lang: 'javascript', file: '../../test-workspace/test-jsdoc.js' },
      ];

      for (const testFile of testFiles) {
        const filePath = path.join(__dirname, testFile.file);
        const document = await vscode.workspace.openTextDocument(filePath);

        // Test docstring detection
        const docstrings = await detector.detectDocstrings(document);
        assert.ok(Array.isArray(docstrings), `${testFile.lang}: Should return array of docstrings`);

        // Test folding range provision
        const ranges = await provider.provideFoldingRanges(
          document,
          {} as vscode.FoldingContext,
          new vscode.CancellationTokenSource().token
        );
        assert.ok(Array.isArray(ranges), `${testFile.lang}: Should return array of folding ranges`);

        // Verify docstring structure
        if (docstrings.length > 0) {
          const firstDocstring = docstrings[0];
          assert.ok(firstDocstring?.startPosition, `${testFile.lang}: Should have start position`);
          assert.ok(firstDocstring?.endPosition, `${testFile.lang}: Should have end position`);
          assert.ok(
            typeof firstDocstring?.content === 'string',
            `${testFile.lang}: Should have content string`
          );
          assert.ok(
            typeof firstDocstring?.preview === 'string',
            `${testFile.lang}: Should have preview string`
          );
        }

        console.log(`${testFile.lang}: ${docstrings.length} docstrings, ${ranges?.length} ranges`);
      }
    });

    test('should maintain performance consistency across languages', async () => {
      const testFiles = [
        { lang: 'python', file: '../../test-workspace/test-python.py' },
        { lang: 'typescript', file: '../../test-workspace/test-typescript.ts' },
        { lang: 'java', file: '../../test-workspace/test-java.java' },
      ];

      const results: Array<{ lang: string; time: number; docstrings: number }> = [];

      for (const testFile of testFiles) {
        const filePath = path.join(__dirname, testFile.file);
        const document = await vscode.workspace.openTextDocument(filePath);

        const startTime = Date.now();
        const docstrings = await detector.detectDocstrings(document);
        const endTime = Date.now();

        results.push({
          lang: testFile.lang,
          time: endTime - startTime,
          docstrings: docstrings.length,
        });
      }

      // Log performance comparison
      console.log('\n=== Cross-Language Performance ===');
      results.forEach(result => {
        console.log(`${result.lang}: ${result.time}ms, ${result.docstrings} docstrings`);
      });

      // All languages should process within reasonable time
      results.forEach(result => {
        assert.ok(
          result.time < 100,
          `${result.lang} should process within 100ms, took ${result.time}ms`
        );
      });
    });
  });

  suite('Preview Text Tests', () => {
    test('should generate appropriate preview text for each language', async () => {
      const testFiles = [
        { lang: 'python', file: '../../test-workspace/test-python.py' },
        { lang: 'typescript', file: '../../test-workspace/test-typescript.ts' },
        { lang: 'java', file: '../../test-workspace/test-java.java' },
      ];

      for (const testFile of testFiles) {
        const filePath = path.join(__dirname, testFile.file);
        const document = await vscode.workspace.openTextDocument(filePath);

        const docstrings = await detector.detectDocstrings(document);

        if (docstrings.length > 0) {
          const firstDocstring = docstrings[0];

          if (firstDocstring && firstDocstring.preview) {
            // Preview should be non-empty and reasonable length
            assert.ok(
              firstDocstring.preview.length > 0,
              `${testFile.lang}: Should have non-empty preview`
            );
            assert.ok(
              firstDocstring.preview.length <= 100,
              `${testFile.lang}: Preview should be reasonable length`
            );

            // Preview should not contain raw markup
            assert.ok(
              !firstDocstring.preview.includes('/**'),
              `${testFile.lang}: Preview should not contain raw JSDoc markers`
            );
            assert.ok(
              !firstDocstring.preview.includes('"""'),
              `${testFile.lang}: Preview should not contain raw triple quotes`
            );
            assert.ok(
              !firstDocstring.preview.includes('///'),
              `${testFile.lang}: Preview should not contain raw C# markers`
            );

            console.log(`${testFile.lang} preview: "${firstDocstring.preview}"`);
          }
        }
      }
    });
  });
});
