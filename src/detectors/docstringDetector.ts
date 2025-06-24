import * as vscode from 'vscode';
import { DocstringInfo, DocstringPattern, SupportedLanguage } from '@/types';

/**
 * Main docstring detector class
 * TODO: Implement in Task 2.0 - Core Docstring Detection Engine
 */
export class DocstringDetector {
  private patterns: Map<SupportedLanguage, DocstringPattern> = new Map();

  constructor() {
    // TODO: Initialize language patterns
  }

  /**
   * Detect all docstrings in a document
   * @param document - VSCode text document
   * @returns Array of detected docstring information
   */
  async detectDocstrings(_document: vscode.TextDocument): Promise<DocstringInfo[]> {
    // TODO: Implement docstring detection logic
    return [];
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
}
