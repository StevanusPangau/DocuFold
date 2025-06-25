import * as vscode from 'vscode';
import { SupportedLanguage } from '../types';

/**
 * Maps VSCode language IDs to our supported languages
 */
const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  javascriptreact: 'jsx-tags',
  typescriptreact: 'tsx-tags',
  java: 'java',
  csharp: 'csharp',
  php: 'php',
};

/**
 * Detects the supported language from a VSCode document
 * @param document - The VSCode text document
 * @returns The supported language or undefined if not supported
 */
export function detectLanguage(document: vscode.TextDocument): SupportedLanguage | undefined {
  return LANGUAGE_MAP[document.languageId];
}

/**
 * Checks if a language is supported by DocuFold
 * @param languageId - VSCode language ID
 * @returns True if the language is supported
 */
export function isLanguageSupported(languageId: string): boolean {
  return languageId in LANGUAGE_MAP;
}

/**
 * Gets all supported language IDs
 * @returns Array of supported VSCode language IDs
 */
export function getSupportedLanguageIds(): string[] {
  return Object.keys(LANGUAGE_MAP);
}

/**
 * Gets the display name for a supported language
 * @param language - The supported language
 * @returns Human-readable language name
 */
export function getLanguageDisplayName(language: SupportedLanguage): string {
  const displayNames: Record<SupportedLanguage, string> = {
    python: 'Python',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    java: 'Java',
    csharp: 'C#',
    php: 'PHP',
    'jsx-tags': 'React JSX',
    'tsx-tags': 'React TSX',
  };

  return displayNames[language] || language;
}

/**
 * Checks if a file should be processed based on include/exclude patterns
 * @param document - The VSCode text document
 * @param includePatterns - Glob patterns to include
 * @param excludePatterns - Glob patterns to exclude
 * @returns True if the file should be processed
 */
export function shouldProcessFile(document: vscode.TextDocument, includePatterns: string[], excludePatterns: string[]): boolean {
  const filePath = document.uri.fsPath;

  // Check if language is supported
  if (!isLanguageSupported(document.languageId)) {
    return false;
  }

  // Check exclude patterns first
  for (const pattern of excludePatterns) {
    if (matchesGlobPattern(filePath, pattern)) {
      return false;
    }
  }

  // Check include patterns
  for (const pattern of includePatterns) {
    if (matchesGlobPattern(filePath, pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Simple glob pattern matching
 * @param filePath - File path to test
 * @param pattern - Glob pattern
 * @returns True if the file matches the pattern
 */
function matchesGlobPattern(filePath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*\*/g, '.*') // ** matches any number of directories
    .replace(/\*/g, '[^/]*') // * matches any characters except /
    .replace(/\?/g, '.') // ? matches any single character
    .replace(/\./g, '\\.'); // Escape dots

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}
