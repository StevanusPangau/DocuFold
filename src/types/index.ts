import * as vscode from 'vscode';

/**
 * Supported programming languages for docstring detection
 */
export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'csharp' | 'php' | 'jsx-tags' | 'tsx-tags';

/**
 * Docstring detection pattern for a specific language
 */
export interface DocstringPattern {
  /** Language identifier */
  language: SupportedLanguage;
  /** Start pattern regex */
  startPattern: RegExp;
  /** End pattern regex */
  endPattern: RegExp;
  /** Single line pattern regex (optional) */
  singleLinePattern?: RegExp;
  /** Whether the pattern supports multiline docstrings */
  multiline: boolean;
}

/**
 * Detected docstring information
 */
export interface DocstringInfo {
  /** Start position of the docstring */
  startPosition: vscode.Position;
  /** End position of the docstring */
  endPosition: vscode.Position;
  /** Full docstring content */
  content: string;
  /** Preview text (first line or summary) */
  preview: string;
  /** Language of the docstring */
  language: SupportedLanguage;
  /** Whether this is a single-line docstring */
  isSingleLine: boolean;
}

/**
 * Configuration options for DocuFold
 */
export interface DocuFoldConfiguration {
  /** Enable/disable automatic folding */
  autoFoldEnabled: boolean;
  /** Maximum character length for preview text */
  previewLength: number;
  /** File patterns to include */
  includePatterns: string[];
  /** File patterns to exclude */
  excludePatterns: string[];
  /** Show status in status bar */
  enableStatusBar: boolean;
  /** Automatically fold on file open */
  foldOnOpen: boolean;
  /** Enable hover preview */
  enableHoverPreview: boolean;
}

/**
 * Folding range with additional DocuFold metadata
 */
export interface DocuFoldRange extends vscode.FoldingRange {
  /** Associated docstring information */
  docstringInfo: DocstringInfo;
  /** Whether this range is currently folded */
  isFolded: boolean;
}

/**
 * Status of DocuFold for a document
 */
export interface DocumentStatus {
  /** Document URI */
  uri?: vscode.Uri;
  /** Number of detected docstrings */
  docstringCount: number;
  /** Number of currently folded docstrings */
  foldedCount: number;
  /** Language of the document */
  language: string;
  /** File name */
  fileName: string;
  /** Whether auto-folding is enabled for this document */
  autoFoldEnabled?: boolean;
  /** Last update timestamp */
  lastUpdated?: Date;
}

/**
 * Extension context and state
 */
export interface ExtensionState {
  /** Extension context */
  context: vscode.ExtensionContext;
  /** Configuration service */
  configuration: DocuFoldConfiguration;
  /** Document statuses */
  documentStatuses: Map<string, DocumentStatus>;
  /** Status bar item */
  statusBarItem?: vscode.StatusBarItem;
}
