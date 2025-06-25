import * as vscode from 'vscode';
import { DocumentStatus } from '../types';

/**
 * Status bar service for DocuFold extension
 * Manages status bar display for folding status and document information
 */
export class StatusBarService {
  private statusBarItem: vscode.StatusBarItem;
  private autoFoldEnabled: boolean = true;
  private currentDocumentStatus: DocumentStatus | null = null;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'docufold.toggleAutoFold';
    this.initialize();
  }

  /**
   * Initialize the status bar item with default state
   */
  private initialize(): void {
    this.updateDisplay();
  }

  /**
   * Update status bar with document information
   * @param status - Document status information
   */
  updateDocumentStatus(status: DocumentStatus | null): void {
    this.currentDocumentStatus = status;
    this.updateDisplay();
  }

  /**
   * Update auto-fold status
   * @param enabled - Whether auto-fold is enabled
   */
  updateAutoFoldStatus(enabled: boolean): void {
    this.autoFoldEnabled = enabled;
    this.updateDisplay();
  }

  /**
   * Update the status bar display
   */
  private updateDisplay(): void {
    if (!this.currentDocumentStatus) {
      // Show basic auto-fold status when no document info is available
      const autoFoldIcon = this.autoFoldEnabled ? '$(fold)' : '$(unfold)';
      const autoFoldText = this.autoFoldEnabled ? 'ON' : 'OFF';
      this.statusBarItem.text = `${autoFoldIcon} DocuFold: ${autoFoldText}`;
      this.statusBarItem.tooltip = this.createTooltip();
    } else {
      // Show detailed document status
      const { docstringCount, foldedCount, language } = this.currentDocumentStatus;
      const autoFoldIcon = this.autoFoldEnabled ? '$(fold)' : '$(unfold)';

      if (docstringCount === 0) {
        this.statusBarItem.text = `${autoFoldIcon} DocuFold: No docstrings`;
      } else {
        this.statusBarItem.text = `${autoFoldIcon} DocuFold: ${foldedCount}/${docstringCount}`;
      }

      this.statusBarItem.tooltip = this.createTooltip(language, docstringCount, foldedCount);
    }
  }

  /**
   * Create tooltip text for the status bar item
   */
  private createTooltip(language?: string, docstringCount?: number, foldedCount?: number): string {
    const autoFoldStatus = this.autoFoldEnabled ? 'enabled' : 'disabled';
    let tooltip = `DocuFold Extension\nAuto-fold: ${autoFoldStatus}`;

    if (language && docstringCount !== undefined && foldedCount !== undefined) {
      tooltip += `\n\nCurrent file (${language}):`;
      tooltip += `\n• Total docstrings: ${docstringCount}`;
      tooltip += `\n• Currently folded: ${foldedCount}`;

      if (docstringCount > 0) {
        const percentage = Math.round((foldedCount / docstringCount) * 100);
        tooltip += `\n• Folded: ${percentage}%`;
      }
    }

    tooltip += '\n\nClick to toggle auto-fold';
    return tooltip;
  }

  /**
   * Show the status bar item
   */
  show(): void {
    this.statusBarItem.show();
  }

  /**
   * Hide the status bar item
   */
  hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * Clear current document status
   */
  clearDocumentStatus(): void {
    this.currentDocumentStatus = null;
    this.updateDisplay();
  }

  /**
   * Get current auto-fold status
   */
  getAutoFoldStatus(): boolean {
    return this.autoFoldEnabled;
  }

  /**
   * Get current document status
   */
  getDocumentStatus(): DocumentStatus | null {
    return this.currentDocumentStatus;
  }

  /**
   * Update status bar with language-specific information
   */
  updateLanguageStatus(languageId: string, isSupported: boolean): void {
    if (!isSupported) {
      const autoFoldIcon = this.autoFoldEnabled ? '$(fold)' : '$(unfold)';
      this.statusBarItem.text = `${autoFoldIcon} DocuFold: Not supported`;
      this.statusBarItem.tooltip = `DocuFold Extension\nLanguage '${languageId}' is not supported\n\nClick to toggle auto-fold`;
    }
  }

  /**
   * Dispose of the status bar item
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
