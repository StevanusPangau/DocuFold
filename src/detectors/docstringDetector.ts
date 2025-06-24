import * as vscode from 'vscode';
import { DocstringInfo, DocstringPattern, SupportedLanguage } from '@/types';
import { detectLanguage } from '@/utils/languageUtils';

/**
 * Main docstring detector class
 */
export class DocstringDetector {
  private patterns: Map<SupportedLanguage, DocstringPattern> = new Map();

  constructor() {
    this.initializePatterns();
  }

  /**
   * Initialize language patterns for supported languages
   */
  private initializePatterns(): void {
    // Python docstring patterns
    this.registerPattern({
      language: 'python',
      startPattern: /^\s*(""")/,
      endPattern: /(""")\s*$/,
      singleLinePattern: /^\s*(""".+""")\s*$/,
      multiline: true,
    });

    // Alternative Python single quotes
    this.registerPattern({
      language: 'python',
      startPattern: /^\s*(''')/,
      endPattern: /(''')\s*$/,
      singleLinePattern: /^\s*('''.+''')\s*$/,
      multiline: true,
    });

    // JavaScript JSDoc patterns
    this.registerPattern({
      language: 'javascript',
      startPattern: /^\s*(\/\*\*)/,
      endPattern: /(\*\/)\s*$/,
      singleLinePattern: /^\s*(\/\*\*.+\*\/)\s*$/,
      multiline: true,
    });

    // TypeScript JSDoc patterns
    this.registerPattern({
      language: 'typescript',
      startPattern: /^\s*(\/\*\*)/,
      endPattern: /(\*\/)\s*$/,
      singleLinePattern: /^\s*(\/\*\*.+\*\/)\s*$/,
      multiline: true,
    });

    // Java documentation patterns
    this.registerPattern({
      language: 'java',
      startPattern: /^\s*(\/\*\*)/,
      endPattern: /(\*\/)\s*$/,
      singleLinePattern: /^\s*(\/\*\*.+\*\/)\s*$/,
      multiline: true,
    });

    // C# XML documentation patterns (///)
    this.registerPattern({
      language: 'csharp',
      startPattern: /^\s*(\/\/\/)/,
      endPattern: /$/,
      singleLinePattern: /^\s*(\/\/\/.+)$/,
      multiline: false,
    });

    // PHP documentation patterns
    this.registerPattern({
      language: 'php',
      startPattern: /^\s*(\/\*\*)/,
      endPattern: /(\*\/)\s*$/,
      singleLinePattern: /^\s*(\/\*\*.+\*\/)\s*$/,
      multiline: true,
    });

    // JSX patterns (same as JavaScript)
    this.registerPattern({
      language: 'jsx-tags',
      startPattern: /^\s*(\/\*\*)/,
      endPattern: /(\*\/)\s*$/,
      singleLinePattern: /^\s*(\/\*\*.+\*\/)\s*$/,
      multiline: true,
    });

    // TSX patterns (same as TypeScript)
    this.registerPattern({
      language: 'tsx-tags',
      startPattern: /^\s*(\/\*\*)/,
      endPattern: /(\*\/)\s*$/,
      singleLinePattern: /^\s*(\/\*\*.+\*\/)\s*$/,
      multiline: true,
    });
  }

  /**
   * Detect all docstrings in a document
   * @param document - VSCode text document
   * @returns Array of detected docstring information
   */
  async detectDocstrings(document: vscode.TextDocument): Promise<DocstringInfo[]> {
    const language = detectLanguage(document);
    if (!language) {
      return [];
    }

    const docstrings: DocstringInfo[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    if (language === 'python') {
      docstrings.push(...this.detectPythonDocstrings(document, lines));
    } else if (['javascript', 'typescript', 'java', 'php', 'jsx-tags', 'tsx-tags'].includes(language)) {
      docstrings.push(...this.detectBlockCommentDocstrings(document, lines, language));
    } else if (language === 'csharp') {
      docstrings.push(...this.detectCSharpDocstrings(document, lines));
    }

    return docstrings;
  }

  /**
   * Detect Python docstrings (triple quotes """ and ''', single line)
   * @param document - VSCode text document
   * @param lines - Array of document lines
   * @returns Array of detected Python docstrings
   */
  private detectPythonDocstrings(document: vscode.TextDocument, lines: string[]): DocstringInfo[] {
    const docstrings: DocstringInfo[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }

      // Check for triple quote start (""" or ''')
      const tripleQuoteMatch = line.match(/^\s*("""|''')/);

      if (tripleQuoteMatch && tripleQuoteMatch[1]) {
        const quoteType = tripleQuoteMatch[1];
        const startPos = new vscode.Position(i, tripleQuoteMatch.index || 0);

        // Check if it's a single line docstring
        const singleLineMatch = line.match(new RegExp(`^\\s*(${quoteType}.+${quoteType})\\s*$`));

        if (singleLineMatch && singleLineMatch[1]) {
          // Single line docstring
          const endPos = new vscode.Position(i, line.length);
          const content = singleLineMatch[1];
          const preview = this.extractPreview(content, quoteType);

          docstrings.push({
            startPosition: startPos,
            endPosition: endPos,
            content,
            preview,
            language: 'python',
            isSingleLine: true,
          });

          i++;
        } else {
          // Multi-line docstring - find the end
          let endLine = i + 1;
          let found = false;

          while (endLine < lines.length && !found) {
            const endLineContent = lines[endLine];
            if (endLineContent && endLineContent.includes(quoteType)) {
              found = true;
            } else {
              endLine++;
            }
          }

          if (found && lines[endLine]) {
            const endPos = new vscode.Position(endLine, lines[endLine]!.length);
            const contentLines = lines.slice(i, endLine + 1);
            const content = contentLines.join('\n');
            const preview = this.extractPreview(content, quoteType);

            docstrings.push({
              startPosition: startPos,
              endPosition: endPos,
              content,
              preview,
              language: 'python',
              isSingleLine: false,
            });

            i = endLine + 1;
          } else {
            // Unclosed docstring, skip
            i++;
          }
        }
      } else {
        i++;
      }
    }

    return docstrings;
  }

  /**
   * Detect JSDoc/block comment docstrings (/** */ patterns)
   * Used for JavaScript, TypeScript, Java, and PHP
   * @param document - VSCode text document
   * @param lines - Array of document lines
   * @param language - Target language
   * @returns Array of detected block comment docstrings
   */
  private detectBlockCommentDocstrings(
    document: vscode.TextDocument,
    lines: string[],
    language: SupportedLanguage
  ): DocstringInfo[] {
    const docstrings: DocstringInfo[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }

      // Check for /** start pattern
      const startMatch = line.match(/^\s*(\/\*\*)/);

      if (startMatch && startMatch[1]) {
        const startPos = new vscode.Position(i, startMatch.index || 0);

        // Check if it's a single line docstring (/** comment */)  
        const singleLineMatch = line.match(/^\s*(\/\*\*.+\*\/)\s*$/);

        if (singleLineMatch && singleLineMatch[1]) {
          // Single line docstring
          const endPos = new vscode.Position(i, line.length);
          const content = singleLineMatch[1];
          const preview = this.extractBlockCommentPreview(content);

          docstrings.push({
            startPosition: startPos,
            endPosition: endPos,
            content,
            preview,
            language,
            isSingleLine: true,
          });

          i++;
        } else {
          // Multi-line docstring - find the closing */  
          let endLine = i;
          let found = false;

          // Continue searching from current line if */ is not on the same line
          while (endLine < lines.length && !found) {
            const currentLine = lines[endLine];
            if (currentLine && currentLine.includes('*/')) {
              found = true;
            } else {
              endLine++;
            }
          }

          if (found && lines[endLine]) {
            const endPos = new vscode.Position(endLine, lines[endLine]!.length);
            const contentLines = lines.slice(i, endLine + 1);
            const content = contentLines.join('\n');
            const preview = this.extractBlockCommentPreview(content);

            docstrings.push({
              startPosition: startPos,
              endPosition: endPos,
              content,
              preview,
              language,
              isSingleLine: false,
            });

            i = endLine + 1;
          } else {
            // Unclosed docstring, skip
            i++;
          }
        }
      } else {
        i++;
      }
    }

    return docstrings;
  }

  /**
   * Detect C# XML documentation (/// patterns)
   * @param document - VSCode text document
   * @param lines - Array of document lines
   * @returns Array of detected C# XML documentation
   */
  private detectCSharpDocstrings(document: vscode.TextDocument, lines: string[]): DocstringInfo[] {
    const docstrings: DocstringInfo[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }

      // Check for /// start pattern
      const startMatch = line.match(/^\s*(\/\/\/)/);

      if (startMatch && startMatch[1]) {
        const startPos = new vscode.Position(i, startMatch.index || 0);
        let endLine = i;

        // Find consecutive /// lines
        while (endLine + 1 < lines.length) {
          const nextLine = lines[endLine + 1];
          if (nextLine && nextLine.match(/^\s*\/\/\//)) {
            endLine++;
          } else {
            break;
          }
        }

        const endPos = new vscode.Position(endLine, lines[endLine]!.length);
        const contentLines = lines.slice(i, endLine + 1);
        const content = contentLines.join('\n');
        const preview = this.extractCSharpPreview(content);

        docstrings.push({
          startPosition: startPos,
          endPosition: endPos,
          content,
          preview,
          language: 'csharp',
          isSingleLine: i === endLine,
        });

        i = endLine + 1;
      } else {
        i++;
      }
    }

    return docstrings;
  }

  /**
   * Extract preview text from block comment docstring content
   * @param content - Full docstring content
   * @returns Preview text
   */
  private extractBlockCommentPreview(content: string): string {
    // Remove /** and */ and get the first meaningful line
    let preview = content.replace(/\/\*\*|\*\//g, '').trim();

    // Remove leading * from lines and get first non-empty content
    const lines = preview.split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^\s*\*\s?/, '').trim();
      if (trimmed) {
        preview = trimmed;
        break;
      }
    }

    // Limit preview length
    const maxLength = 60;
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength - 3) + '...';
    }

    return preview || 'Documentation';
  }

  /**
   * Extract preview text from C# XML documentation content
   * @param content - Full docstring content
   * @returns Preview text
   */
  private extractCSharpPreview(content: string): string {
    // Remove /// and get the first meaningful line
    let preview = content.replace(/\/\/\//g, '').trim();

    // Get first non-empty line
    const lines = preview.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        // Extract text from XML tags like <summary>Text</summary>
        const xmlMatch = trimmed.match(/<summary>(.*?)<\/summary>/);
        if (xmlMatch && xmlMatch[1]) {
          preview = xmlMatch[1].trim();
        } else {
          // Look for content inside XML tags
          const contentMatch = trimmed.match(/>([^<]+)</);
          if (contentMatch && contentMatch[1]) {
            preview = contentMatch[1].trim();
          } else {
            preview = trimmed;
          }
        }
        break;
      }
    }

    // Limit preview length
    const maxLength = 60;
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength - 3) + '...';
    }

    return preview || 'Documentation';
  }

  /**
   * Extract preview text from docstring content
   * @param content - Full docstring content
   * @param quoteType - Type of quote used (""" or ''')
   * @returns Preview text
   */
  private extractPreview(content: string, quoteType: string): string {
    // Remove the quote marks and get the first meaningful line
    let preview = content.replace(new RegExp(quoteType, 'g'), '').trim();

    // Get first non-empty line
    const lines = preview.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        preview = trimmed;
        break;
      }
    }

    // Limit preview length (will be configurable later)
    const maxLength = 60;
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength - 3) + '...';
    }

    return preview || 'Docstring';
  }

  /**
   * Register a new language pattern
   * @param pattern - Docstring pattern for a language
   */
  registerPattern(pattern: DocstringPattern): void {
    this.patterns.set(pattern.language, pattern);
  }

  /**
   * Get pattern for a specific language
   * @param language - Target language
   * @returns Docstring pattern or undefined
   */
  getPattern(language: SupportedLanguage): DocstringPattern | undefined {
    return this.patterns.get(language);
  }

  /**
   * Get all registered patterns
   * @returns Map of all language patterns
   */
  getAllPatterns(): Map<SupportedLanguage, DocstringPattern> {
    return new Map(this.patterns);
  }
}
