import * as vscode from 'vscode';
import { DocuFoldConfiguration } from '@/types';

/**
 * Configuration service for DocuFold
 * TODO: Implement in Task 5.0 - Configuration & Settings Management
 */
export class ConfigurationService {
  private static readonly CONFIGURATION_SECTION = 'docufold';

  /**
   * Get current configuration
   * @returns Current DocuFold configuration
   */
  getConfiguration(): DocuFoldConfiguration {
    const config = vscode.workspace.getConfiguration(ConfigurationService.CONFIGURATION_SECTION);

    // TODO: Implement configuration reading logic
    return {
      autoFoldEnabled: config.get('autoFoldEnabled', true),
      previewLength: config.get('previewLength', 60),
      includePatterns: config.get('includePatterns', []),
      excludePatterns: config.get('excludePatterns', []),
      enableStatusBar: config.get('enableStatusBar', true),
      foldOnOpen: config.get('foldOnOpen', true),
      enableHoverPreview: config.get('enableHoverPreview', true),
    };
  }

  /**
   * Register configuration change listener
   * @param callback - Callback function for configuration changes
   * @returns Disposable for the listener
   */
  onConfigurationChanged(callback: (config: DocuFoldConfiguration) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(ConfigurationService.CONFIGURATION_SECTION)) {
        callback(this.getConfiguration());
      }
    });
  }
}
