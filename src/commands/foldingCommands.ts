import * as vscode from 'vscode';
import { DocstringDetector } from '../detectors/docstringDetector';
import { ConfigurationService } from '../services/configurationService';
import { StatusBarService } from '../services/statusBarService';
import { getSupportedLanguageIds } from '../utils/languageUtils';

/**
 * Folding commands for DocuFold extension
 * Provides all user-facing commands for docstring folding functionality
 */
export class FoldingCommands {
  private context: vscode.ExtensionContext;
  private docstringDetector: DocstringDetector;
  private configurationService: ConfigurationService;
  private statusBarService: StatusBarService | undefined;

  constructor(context: vscode.ExtensionContext, docstringDetector?: DocstringDetector, configurationService?: ConfigurationService, statusBarService?: StatusBarService) {
    this.context = context;
    this.docstringDetector = docstringDetector || new DocstringDetector();
    this.configurationService = configurationService || new ConfigurationService();
    this.statusBarService = statusBarService;
  }

  /**
   * Register all folding commands
   */
  registerCommands(): void {
    const commands = [
      vscode.commands.registerCommand('docufold.toggleAutoFold', this.toggleAutoFold.bind(this)),
      vscode.commands.registerCommand('docufold.foldAllDocstrings', this.foldAllDocstrings.bind(this)),
      vscode.commands.registerCommand('docufold.unfoldAllDocstrings', this.unfoldAllDocstrings.bind(this)),
      vscode.commands.registerCommand('docufold.foldCurrentDocstring', this.foldCurrentDocstring.bind(this)),
      vscode.commands.registerCommand('docufold.unfoldCurrentDocstring', this.unfoldCurrentDocstring.bind(this)),
    ];

    commands.forEach((command) => this.context.subscriptions.push(command));
  }

  /**
   * Toggle auto-folding functionality
   */
  private async toggleAutoFold(): Promise<void> {
    try {
      const config = this.configurationService.getConfiguration();
      const newAutoFoldState = !config.autoFoldEnabled;

      // Update configuration
      await vscode.workspace.getConfiguration('docufold').update('autoFoldEnabled', newAutoFoldState, vscode.ConfigurationTarget.Global);

      // Show status message
      const status = newAutoFoldState ? 'enabled' : 'disabled';
      vscode.window.showInformationMessage(`DocuFold: Auto-folding ${status}`);

      // Update status bar if available
      if (this.statusBarService) {
        this.statusBarService.updateAutoFoldStatus(newAutoFoldState);
      }

      // If enabling auto-fold, apply it to current document
      if (newAutoFoldState) {
        await this.foldAllDocstrings();
      }
    } catch (error) {
      console.error('Failed to toggle auto-fold:', error);
      vscode.window.showErrorMessage('Failed to toggle auto-folding. Please try again.');
    }
  }

  /**
   * Fold all docstrings in the current document
   */
  private async foldAllDocstrings(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!this.validateEditor(editor)) {
      return;
    }

    try {
      const document = editor.document;
      const languageId = document.languageId;

      // Check if language is supported
      if (!getSupportedLanguageIds().includes(languageId)) {
        vscode.window.showWarningMessage(`DocuFold: Language '${languageId}' is not supported`);
        return;
      }

      // Detect docstrings
      const docstrings = await this.docstringDetector.detectDocstrings(document);

      if (docstrings.length === 0) {
        vscode.window.showInformationMessage('DocuFold: No docstrings found in this file');
        return;
      }

      // Create folding ranges for multi-line docstrings
      const foldingRanges = docstrings.filter((docstring) => docstring.endPosition.line > docstring.startPosition.line).map((docstring) => new vscode.Range(docstring.startPosition, docstring.endPosition));

      if (foldingRanges.length === 0) {
        vscode.window.showInformationMessage('DocuFold: No multi-line docstrings found to fold');
        return;
      }

      // Apply folding using VSCode's folding commands
      await vscode.commands.executeCommand('editor.fold', {
        levels: 1,
        direction: 'up',
        selectionLines: foldingRanges.map((range) => range.start.line),
      });

      // Update status bar
      if (this.statusBarService) {
        this.statusBarService.updateDocumentStatus({
          docstringCount: docstrings.length,
          foldedCount: foldingRanges.length,
          language: languageId,
          fileName: document.fileName,
        });
      }

      vscode.window.showInformationMessage(`DocuFold: Folded ${foldingRanges.length} docstring(s)`);
    } catch (error) {
      console.error('Failed to fold all docstrings:', error);
      vscode.window.showErrorMessage('Failed to fold docstrings. Please try again.');
    }
  }

  /**
   * Unfold all docstrings in the current document
   */
  private async unfoldAllDocstrings(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!this.validateEditor(editor)) {
      return;
    }

    try {
      const document = editor.document;
      const languageId = document.languageId;

      // Check if language is supported
      if (!getSupportedLanguageIds().includes(languageId)) {
        vscode.window.showWarningMessage(`DocuFold: Language '${languageId}' is not supported`);
        return;
      }

      // Detect docstrings to get accurate count
      const docstrings = await this.docstringDetector.detectDocstrings(document);

      // Unfold all ranges in the document
      await vscode.commands.executeCommand('editor.unfoldAll');

      // Update status bar
      if (this.statusBarService) {
        this.statusBarService.updateDocumentStatus({
          docstringCount: docstrings.length,
          foldedCount: 0,
          language: languageId,
          fileName: document.fileName,
        });
      }

      vscode.window.showInformationMessage(`DocuFold: Unfolded all docstrings`);
    } catch (error) {
      console.error('Failed to unfold all docstrings:', error);
      vscode.window.showErrorMessage('Failed to unfold docstrings. Please try again.');
    }
  }

  /**
   * Fold current docstring at cursor position
   */
  private async foldCurrentDocstring(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!this.validateEditor(editor)) {
      return;
    }

    try {
      const document = editor.document;
      const position = editor.selection.active;
      const languageId = document.languageId;

      // Check if language is supported
      if (!getSupportedLanguageIds().includes(languageId)) {
        vscode.window.showWarningMessage(`DocuFold: Language '${languageId}' is not supported`);
        return;
      }

      // Detect docstrings
      const docstrings = await this.docstringDetector.detectDocstrings(document);

      // Find docstring at current position
      const currentDocstring = docstrings.find((docstring) => position.line >= docstring.startPosition.line && position.line <= docstring.endPosition.line);

      if (!currentDocstring) {
        vscode.window.showInformationMessage('DocuFold: No docstring found at cursor position');
        return;
      }

      // Check if it's a multi-line docstring
      if (currentDocstring.endPosition.line <= currentDocstring.startPosition.line) {
        vscode.window.showInformationMessage('DocuFold: Cannot fold single-line docstring');
        return;
      }

      // Create selection for the docstring and fold it
      const docstringRange = new vscode.Range(currentDocstring.startPosition, currentDocstring.endPosition);
      editor.selection = new vscode.Selection(docstringRange.start, docstringRange.end);

      await vscode.commands.executeCommand('editor.fold');

      vscode.window.showInformationMessage('DocuFold: Folded current docstring');
    } catch (error) {
      console.error('Failed to fold current docstring:', error);
      vscode.window.showErrorMessage('Failed to fold current docstring. Please try again.');
    }
  }

  /**
   * Unfold current docstring at cursor position
   */
  private async unfoldCurrentDocstring(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!this.validateEditor(editor)) {
      return;
    }

    try {
      const document = editor.document;
      const position = editor.selection.active;
      const languageId = document.languageId;

      // Check if language is supported
      if (!getSupportedLanguageIds().includes(languageId)) {
        vscode.window.showWarningMessage(`DocuFold: Language '${languageId}' is not supported`);
        return;
      }

      // Detect docstrings
      const docstrings = await this.docstringDetector.detectDocstrings(document);

      // Find docstring at current position
      const currentDocstring = docstrings.find((docstring) => position.line >= docstring.startPosition.line && position.line <= docstring.endPosition.line);

      if (!currentDocstring) {
        vscode.window.showInformationMessage('DocuFold: No docstring found at cursor position');
        return;
      }

      // Create selection for the docstring and unfold it
      const docstringRange = new vscode.Range(currentDocstring.startPosition, currentDocstring.endPosition);
      editor.selection = new vscode.Selection(docstringRange.start, docstringRange.end);

      await vscode.commands.executeCommand('editor.unfold');

      vscode.window.showInformationMessage('DocuFold: Unfolded current docstring');
    } catch (error) {
      console.error('Failed to unfold current docstring:', error);
      vscode.window.showErrorMessage('Failed to unfold current docstring. Please try again.');
    }
  }

  /**
   * Validate that we have a valid editor and document
   */
  private validateEditor(editor: vscode.TextEditor | undefined): editor is vscode.TextEditor {
    if (!editor) {
      vscode.window.showWarningMessage('DocuFold: No active editor found');
      return false;
    }

    if (!editor.document) {
      vscode.window.showWarningMessage('DocuFold: No document found in active editor');
      return false;
    }

    return true;
  }

  /**
   * Set the status bar service reference
   */
  setStatusBarService(statusBarService: StatusBarService): void {
    this.statusBarService = statusBarService;
  }
}
