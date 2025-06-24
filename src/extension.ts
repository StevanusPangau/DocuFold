import * as vscode from 'vscode';
import { DocstringDetector } from '@/detectors/docstringDetector';
import { DocuFoldRangeProvider } from '@/providers/foldingRangeProvider';
import { DocuFoldHoverProvider } from '@/providers/hoverProvider';
import { ConfigurationService } from '@/services/configurationService';
import { StatusBarService } from '@/services/statusBarService';
import { FoldingCommands } from '@/commands/foldingCommands';
import { getSupportedLanguageIds } from '@/utils/languageUtils';

let statusBarService: StatusBarService | undefined;

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('DocuFold extension is now active!');

  try {
    // Initialize services
    const configurationService = new ConfigurationService();
    const docstringDetector = new DocstringDetector();
    const foldingRangeProvider = new DocuFoldRangeProvider(docstringDetector);
    const hoverProvider = new DocuFoldHoverProvider(docstringDetector, configurationService);
    statusBarService = new StatusBarService();
    const foldingCommands = new FoldingCommands(context, docstringDetector, configurationService, statusBarService);

    // Register commands
    foldingCommands.registerCommands();

    // Register providers for supported languages
    const supportedLanguages = getSupportedLanguageIds();
    supportedLanguages.forEach((languageId) => {
      // Register folding range provider
      const foldingProvider = vscode.languages.registerFoldingRangeProvider({ language: languageId }, foldingRangeProvider);
      context.subscriptions.push(foldingProvider);

      // Register hover provider
      const hoverProviderRegistration = vscode.languages.registerHoverProvider({ language: languageId }, hoverProvider);
      context.subscriptions.push(hoverProviderRegistration);
    });

    // Setup status bar integration
    const config = configurationService.getConfiguration();
    if (config.enableStatusBar) {
      statusBarService.show();
    }

    // Listen for configuration changes
    const configChangeListener = configurationService.onConfigurationChanged((newConfig) => {
      if (statusBarService) {
        if (newConfig.enableStatusBar) {
          statusBarService.show();
        } else {
          statusBarService.hide();
        }
      }
    });
    context.subscriptions.push(configChangeListener);

    // Add status bar service to subscriptions for cleanup
    context.subscriptions.push(statusBarService);

    console.log('DocuFold extension initialized successfully!');
  } catch (error) {
    console.error('Failed to activate DocuFold extension:', error);
    vscode.window.showErrorMessage('Failed to activate DocuFold extension. Please check the console for details.');
  }
}

/**
 * This method is called when your extension is deactivated
 */
export function deactivate() {
  console.log('DocuFold extension is now deactivated!');

  // Cleanup is handled automatically by VSCode through context.subscriptions
  if (statusBarService) {
    statusBarService.dispose();
    statusBarService = undefined;
  }
}
