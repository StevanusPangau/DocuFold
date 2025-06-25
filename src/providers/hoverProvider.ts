import * as vscode from 'vscode';
import { DocstringDetector } from '../detectors/docstringDetector';
import { ConfigurationService } from '../services/configurationService';
import { getSupportedLanguageIds } from '../utils/languageUtils';

/**
 * Hover provider for DocuFold extension
 * Shows extended docstring previews when hovering over folded content
 */
export class DocuFoldHoverProvider implements vscode.HoverProvider {
  private docstringDetector: DocstringDetector;
  private configurationService: ConfigurationService;

  constructor(docstringDetector?: DocstringDetector, configurationService?: ConfigurationService) {
    this.docstringDetector = docstringDetector || new DocstringDetector();
    this.configurationService = configurationService || new ConfigurationService();
  }

  /**
   * Provide hover information for the given position
   */
  async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
    try {
      // Check if hover preview is enabled
      const config = this.configurationService.getConfiguration();
      if (!config.enableHoverPreview) {
        return undefined;
      }

      // Check if language is supported
      const languageId = document.languageId;
      if (!getSupportedLanguageIds().includes(languageId)) {
        return undefined;
      }

      // Check for cancellation
      if (token.isCancellationRequested) {
        return undefined;
      }

      // Detect docstrings in the document
      const docstrings = await this.docstringDetector.detectDocstrings(document);

      if (docstrings.length === 0) {
        return undefined;
      }

      // Find docstring at the hover position
      const docstringAtPosition = docstrings.find((docstring) => position.line >= docstring.startPosition.line && position.line <= docstring.endPosition.line);

      if (!docstringAtPosition) {
        return undefined;
      }

      // Check if this is likely a folded region
      // We'll show hover for any docstring, but especially useful for folded ones
      const hover = this.createHover(docstringAtPosition, languageId);

      return hover;
    } catch (error) {
      console.error('Error providing hover information:', error);
      return undefined;
    }
  }

  /**
   * Create hover content for a docstring
   */
  private createHover(docstring: any, languageId: string): vscode.Hover {
    // Create markdown content
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    // Add header
    markdown.appendMarkdown(`**DocuFold Preview** *(${languageId})*\n\n`);

    // Add docstring content with syntax highlighting
    const content = this.formatDocstringContent(docstring.content, languageId);
    markdown.appendCodeblock(content, languageId);

    // Add metadata
    const lines = docstring.endPosition.line - docstring.startPosition.line + 1;
    const chars = docstring.content.length;
    markdown.appendMarkdown(`\n---\n`);
    markdown.appendMarkdown(`📄 **Lines:** ${lines} | 📝 **Characters:** ${chars}`);

    // Add preview info
    if (docstring.preview && docstring.preview !== docstring.content) {
      markdown.appendMarkdown(`\n🔍 **Preview:** ${docstring.preview}`);
    }

    // Add folding hint
    if (lines > 1) {
      markdown.appendMarkdown(`\n\n💡 *Use DocuFold commands to fold/unfold this docstring*`);
    }

    // Create hover range
    const range = new vscode.Range(docstring.startPosition, docstring.endPosition);

    return new vscode.Hover(markdown, range);
  }

  /**
   * Format docstring content for display
   */
  private formatDocstringContent(content: string, languageId: string): string {
    // Limit content length for hover display
    const maxLength = 500;
    let formattedContent = content;

    if (content.length > maxLength) {
      formattedContent = content.substring(0, maxLength) + '...';
    }

    // Clean up common docstring formatting based on language
    switch (languageId) {
      case 'python':
        // Remove triple quotes for cleaner display
        formattedContent = formattedContent.replace(/^['"]?['"]?['"]?/, '').replace(/['"]?['"]?['"]?$/, '');
        break;
      case 'javascript':
      case 'typescript':
        // Clean JSDoc formatting
        formattedContent = formattedContent
          .replace(/^\/\*\*/, '')
          .replace(/\*\/$/, '')
          .replace(/^\s*\*\s?/gm, '');
        break;
      case 'csharp':
        // Clean XML doc comments
        formattedContent = formattedContent.replace(/^\s*\/\/\/\s?/gm, '').replace(/<\/?[^>]+>/g, ''); // Remove XML tags
        break;
    }

    return formattedContent.trim();
  }
}
