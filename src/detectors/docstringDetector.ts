import * as vscode from 'vscode';
import { DocstringInfo, DocstringPattern, SupportedLanguage } from '@/types';
import { detectLanguage } from '@/utils/languageUtils';
import { TTLCache, debounce, PerformanceTimer } from '@/utils/performanceUtils';

// Cache key interface removed as it's not directly used (cache key is created as string)

/**
 * Main docstring detector class with extensible pattern registry and performance optimizations
 */
export class DocstringDetector {
  private patterns: Map<SupportedLanguage, DocstringPattern[]> = new Map();
  private cache: TTLCache<string, DocstringInfo[]> = new TTLCache(5 * 60 * 1000); // 5 minutes
  private performanceTimer: PerformanceTimer = new PerformanceTimer();
  private debouncedCacheCleanup: () => void;

  constructor() {
    this.initializePatterns();
    this.debouncedCacheCleanup = debounce(() => this.cache.cleanup(), 30000); // Cleanup every 30 seconds
  }

  /**
   * Initialize language patterns for supported languages
   */
  private initializePatterns(): void {
    // Python docstring patterns (multiple patterns per language)
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

    // C# block comment documentation
    this.registerPattern({
      language: 'csharp',
      startPattern: /^\s*(\/\*\*)/,
      endPattern: /(\*\/)\s*$/,
      singleLinePattern: /^\s*(\/\*\*.+\*\/)\s*$/,
      multiline: true,
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
   * Detect all docstrings in a document with caching and performance optimization
   * @param document - VSCode text document
   * @returns Array of detected docstring information
   */
  async detectDocstrings(document: vscode.TextDocument): Promise<DocstringInfo[]> {
    // Start performance measurement
    this.performanceTimer.start();

    const language = detectLanguage(document);
    if (!language) {
      this.performanceTimer.stop();
      return [];
    }

    // Create cache key
    const cacheKey = this.createCacheKey(document, language);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.performanceTimer.stop();
      return cached;
    }

    // Detect docstrings
    const docstrings = await this.performDetection(document, language);

    // Cache results
    this.cache.set(cacheKey, docstrings);

    // Trigger debounced cleanup
    this.debouncedCacheCleanup();

    const elapsed = this.performanceTimer.stop();

    // Log performance for large files
    if (document.lineCount > 1000) {
      console.log(`DocuFold: Detected ${docstrings.length} docstrings in ${elapsed.toFixed(2)}ms for ${document.fileName}`);
    }

    return docstrings;
  }

  /**
   * Perform actual docstring detection based on language
   * @param document - VSCode text document
   * @param language - Detected language
   * @returns Array of detected docstrings
   */
  private async performDetection(document: vscode.TextDocument, language: SupportedLanguage): Promise<DocstringInfo[]> {
    const patterns = this.patterns.get(language);
    if (!patterns || patterns.length === 0) {
      return [];
    }

    const text = document.getText();
    const lines = text.split('\n');
    const docstrings: DocstringInfo[] = [];

    // Use pattern-based detection for extensibility
    for (const pattern of patterns) {
      if (pattern.multiline) {
        docstrings.push(...this.detectMultilineDocstrings(document, lines, language, pattern));
      } else {
        docstrings.push(...this.detectSingleLineDocstrings(document, lines, language, pattern));
      }
    }

    return this.removeDuplicates(docstrings);
  }

  /**
   * Detect multi-line docstrings using a specific pattern
   * @param document - VSCode text document
   * @param lines - Array of document lines
   * @param language - Target language
   * @param pattern - Detection pattern
   * @returns Array of detected docstrings
   */
  private detectMultilineDocstrings(_document: vscode.TextDocument, lines: string[], language: SupportedLanguage, pattern: DocstringPattern): DocstringInfo[] {
    const docstrings: DocstringInfo[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }

      const startMatch = line.match(pattern.startPattern);
      if (startMatch && startMatch[1]) {
        const startPos = new vscode.Position(i, startMatch.index || 0);

        // Check for single line pattern first
        if (pattern.singleLinePattern) {
          const singleLineMatch = line.match(pattern.singleLinePattern);
          if (singleLineMatch && singleLineMatch[1]) {
            const endPos = new vscode.Position(i, line.length);
            const content = singleLineMatch[1];
            const preview = this.extractPreviewByLanguage(content, language);

            docstrings.push({
              startPosition: startPos,
              endPosition: endPos,
              content,
              preview,
              language,
              isSingleLine: true,
            });

            i++;
            continue;
          }
        }

        // Multi-line detection
        let endLine = i;
        let found = false;

        while (endLine < lines.length && !found) {
          const currentLine = lines[endLine];
          if (currentLine && pattern.endPattern.test(currentLine)) {
            found = true;
          } else {
            endLine++;
          }
        }

        if (found && lines[endLine]) {
          const endPos = new vscode.Position(endLine, lines[endLine]!.length);
          const contentLines = lines.slice(i, endLine + 1);
          const content = contentLines.join('\n');
          const preview = this.extractPreviewByLanguage(content, language);

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
          i++;
        }
      } else {
        i++;
      }
    }

    return docstrings;
  }

  /**
   * Detect single-line docstrings using a specific pattern (C# /// comments)
   * @param document - VSCode text document
   * @param lines - Array of document lines
   * @param language - Target language
   * @param pattern - Detection pattern
   * @returns Array of detected docstrings
   */
  private detectSingleLineDocstrings(_document: vscode.TextDocument, lines: string[], language: SupportedLanguage, pattern: DocstringPattern): DocstringInfo[] {
    const docstrings: DocstringInfo[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }

      const startMatch = line.match(pattern.startPattern);
      if (startMatch && startMatch[1]) {
        const startPos = new vscode.Position(i, startMatch.index || 0);
        let endLine = i;

        // Find consecutive lines with the same pattern (for C# /// comments)
        while (endLine + 1 < lines.length) {
          const nextLine = lines[endLine + 1];
          if (nextLine && pattern.startPattern.test(nextLine)) {
            endLine++;
          } else {
            break;
          }
        }

        const endPos = new vscode.Position(endLine, lines[endLine]!.length);
        const contentLines = lines.slice(i, endLine + 1);
        const content = contentLines.join('\n');
        const preview = this.extractPreviewByLanguage(content, language);

        docstrings.push({
          startPosition: startPos,
          endPosition: endPos,
          content,
          preview,
          language,
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
   * Extract preview text based on language
   * @param content - Full docstring content
   * @param language - Target language
   * @returns Preview text
   */
  private extractPreviewByLanguage(content: string, language: SupportedLanguage): string {
    switch (language) {
      case 'python':
        return this.extractPythonPreview(content);
      case 'csharp':
        return this.extractCSharpPreview(content);
      case 'javascript':
      case 'typescript':
      case 'java':
      case 'php':
      case 'jsx-tags':
      case 'tsx-tags':
        return this.extractBlockCommentPreview(content);
      default:
        return this.extractGenericPreview(content);
    }
  }

  /**
   * Extract preview text from Python docstrings
   * @param content - Full docstring content
   * @returns Preview text
   */
  private extractPythonPreview(content: string): string {
    // Remove triple quotes and get the first meaningful line
    let preview = content.replace(/"""|'''/g, '').trim();

    // Get first non-empty line
    const lines = preview.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        preview = trimmed;
        break;
      }
    }

    return this.limitPreviewLength(preview, 'Docstring');
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

    return this.limitPreviewLength(preview, 'Documentation');
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

    return this.limitPreviewLength(preview, 'Documentation');
  }

  /**
   * Extract generic preview text
   * @param content - Full content
   * @returns Preview text
   */
  private extractGenericPreview(content: string): string {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        return this.limitPreviewLength(trimmed, 'Documentation');
      }
    }
    return 'Documentation';
  }

  /**
   * Limit preview text length
   * @param preview - Preview text
   * @param fallback - Fallback text if preview is empty
   * @returns Limited preview text
   */
  private limitPreviewLength(preview: string, fallback: string): string {
    const maxLength = 60;
    if (!preview.trim()) {
      return fallback;
    }
    if (preview.length > maxLength) {
      return preview.substring(0, maxLength - 3) + '...';
    }
    return preview;
  }

  /**
   * Remove duplicate docstrings based on position
   * @param docstrings - Array of docstrings
   * @returns Array without duplicates
   */
  private removeDuplicates(docstrings: DocstringInfo[]): DocstringInfo[] {
    const seen = new Set<string>();
    return docstrings.filter((docstring) => {
      const key = `${docstring.startPosition.line}-${docstring.startPosition.character}-${docstring.endPosition.line}-${docstring.endPosition.character}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Create cache key for a document
   * @param document - VSCode text document
   * @param language - Detected language
   * @returns Cache key string
   */
  private createCacheKey(document: vscode.TextDocument, language: SupportedLanguage): string {
    return `${document.uri.toString()}-${document.version}-${language}`;
  }

  /**
   * Register a new language pattern (extensible registry)
   * @param pattern - Docstring pattern for a language
   */
  registerPattern(pattern: DocstringPattern): void {
    const existing = this.patterns.get(pattern.language) || [];
    existing.push(pattern);
    this.patterns.set(pattern.language, existing);
  }

  /**
   * Register multiple patterns for a language
   * @param language - Target language
   * @param patterns - Array of patterns
   */
  registerPatterns(language: SupportedLanguage, patterns: DocstringPattern[]): void {
    const existing = this.patterns.get(language) || [];
    existing.push(...patterns);
    this.patterns.set(language, existing);
  }

  /**
   * Get patterns for a specific language
   * @param language - Target language
   * @returns Array of docstring patterns
   */
  getPatterns(language: SupportedLanguage): DocstringPattern[] {
    return this.patterns.get(language) || [];
  }

  /**
   * Get all registered patterns
   * @returns Map of all language patterns
   */
  getAllPatterns(): Map<SupportedLanguage, DocstringPattern[]> {
    return new Map(this.patterns);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache size and performance info
   */
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size(),
    };
  }

  /**
   * Check if language is supported
   * @param language - Language to check
   * @returns True if language has registered patterns
   */
  isLanguageSupported(language: SupportedLanguage): boolean {
    const patterns = this.patterns.get(language);
    return patterns !== undefined && patterns.length > 0;
  }

  /**
   * Get list of supported languages
   * @returns Array of supported language identifiers
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.patterns.keys());
  }
}
