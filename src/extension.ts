/**
 * @fileoverview Main extension entry point for DocuFold VSCode extension.
 *
 * This module handles the activation and deactivation of the DocuFold extension,
 * initializes all services and providers, and registers commands and language support.
 *
 * @author DocuFold Team
 * @version 0.0.1
 * @since 2024-06-25
 */

import * as vscode from 'vscode';
import { DocstringDetector } from './detectors/docstringDetector';
import { DocuFoldRangeProvider } from './providers/foldingRangeProvider';
import { DocuFoldHoverProvider } from './providers/hoverProvider';
import { ConfigurationService } from './services/configurationService';
import { StatusBarService } from './services/statusBarService';
import { FoldingCommands } from './commands/foldingCommands';
import { getSupportedLanguageIds } from './utils/languageUtils';

/**
 * Global reference to the status bar service for cleanup purposes.
 * This is kept at module level to ensure proper disposal during deactivation.
 */
let statusBarService: StatusBarService | undefined;

/**
 * Activates the DocuFold extension.
 *
 * This function is called when the extension is first activated by VSCode.
 * It initializes all core services, registers providers for supported languages,
 * sets up command handlers, and configures the status bar integration.
 *
 * The activation process includes:
 * - Initializing configuration service and docstring detector
 * - Setting up folding range and hover providers
 * - Registering command palette commands
 * - Configuring status bar integration
 * - Setting up configuration change listeners
 *
 * @param context - The VSCode extension context containing subscriptions and state
 * @throws {Error} If any critical service fails to initialize
 *
 * @example
 * ```typescript
 * // This function is automatically called by VSCode when the extension activates
 * // No manual invocation is required
 * ```
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
    const foldingCommands = new FoldingCommands(
      context,
      docstringDetector,
      configurationService,
      statusBarService
    );

    // Register commands
    foldingCommands.registerCommands();

    // Register providers for supported languages
    const supportedLanguages = getSupportedLanguageIds();
    supportedLanguages.forEach(languageId => {
      // Register folding range provider
      const foldingProvider = vscode.languages.registerFoldingRangeProvider(
        { language: languageId },
        foldingRangeProvider
      );
      context.subscriptions.push(foldingProvider);

      // Register hover provider
      const hoverProviderRegistration = vscode.languages.registerHoverProvider(
        { language: languageId },
        hoverProvider
      );
      context.subscriptions.push(hoverProviderRegistration);
    });

    // Setup status bar integration
    const config = configurationService.getConfiguration();
    if (config.enableStatusBar) {
      statusBarService.show();
    }

    // Listen for configuration changes
    const configChangeListener = configurationService.onConfigurationChanged(newConfig => {
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
    vscode.window.showErrorMessage(
      'Failed to activate DocuFold extension. Please check the console for details.'
    );
  }
}

/**
 * Deactivates the DocuFold extension.
 *
 * This function is called when the extension is being deactivated by VSCode.
 * It performs cleanup operations to ensure proper resource disposal and
 * prevent memory leaks.
 *
 * The deactivation process includes:
 * - Disposing of the status bar service
 * - Clearing global references
 * - Automatic cleanup of registered providers and commands via context.subscriptions
 *
 * @remarks
 * Most cleanup is handled automatically by VSCode through the extension context's
 * subscription mechanism. This function only handles explicit cleanup of module-level
 * resources that require manual disposal.
 *
 * @example
 * ```typescript
 * // This function is automatically called by VSCode when the extension deactivates
 * // No manual invocation is required
 * ```
 */
export function deactivate() {
  console.log('DocuFold extension is now deactivated!');

  // Cleanup is handled automatically by VSCode through context.subscriptions
  if (statusBarService) {
    statusBarService.dispose();
    statusBarService = undefined;
  }
}
