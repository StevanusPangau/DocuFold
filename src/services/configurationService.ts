import * as vscode from 'vscode';
import { DocuFoldConfiguration, LanguageConfiguration, PerformanceSettings, AdvancedSettings, ConfigurationValidationResult } from '../types';
import { getSupportedLanguageIds } from '../utils/languageUtils';

/**
 * Configuration service for DocuFold extension
 * Handles reading, validation, and monitoring of user/workspace settings
 */
export class ConfigurationService {
  private static readonly CONFIGURATION_SECTION = 'docufold';
  private readonly configurationCache = new Map<string, DocuFoldConfiguration>();
  private readonly changeListeners = new Set<(config: DocuFoldConfiguration) => void>();
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.setupConfigurationWatcher();
  }

  /**
   * Get current configuration with workspace vs user precedence
   * @param resource - Optional workspace resource for context
   * @returns Current DocuFold configuration
   */
  getConfiguration(resource?: vscode.Uri): DocuFoldConfiguration {
    const cacheKey = resource?.toString() || 'global';

    // Check cache first
    if (this.configurationCache.has(cacheKey)) {
      return this.configurationCache.get(cacheKey)!;
    }

    const config = vscode.workspace.getConfiguration(ConfigurationService.CONFIGURATION_SECTION, resource);

    // Build configuration with proper defaults and validation
    const docuFoldConfig: DocuFoldConfiguration = {
      autoFoldEnabled: this.getConfigValue(config, 'autoFoldEnabled', true),
      previewLength: this.getConfigValue(config, 'previewLength', 60),
      includePatterns: this.getConfigValue(config, 'includePatterns', this.getDefaultIncludePatterns()),
      excludePatterns: this.getConfigValue(config, 'excludePatterns', this.getDefaultExcludePatterns()),
      enableStatusBar: this.getConfigValue(config, 'enableStatusBar', true),
      foldOnOpen: this.getConfigValue(config, 'foldOnOpen', true),
      enableHoverPreview: this.getConfigValue(config, 'enableHoverPreview', true),
      languageSettings: this.getLanguageSettings(config),
      performanceSettings: this.getPerformanceSettings(config),
      advancedSettings: this.getAdvancedSettings(config),
    };

    // Validate and sanitize configuration
    const validationResult = this.validateConfiguration(docuFoldConfig);
    if (!validationResult.isValid) {
      console.warn('DocuFold: Configuration validation failed:', validationResult.errors);
      // Use sanitized config if available, otherwise use defaults
      const finalConfig = validationResult.sanitizedConfig || this.getDefaultConfiguration();
      this.configurationCache.set(cacheKey, finalConfig);
      return finalConfig;
    }

    // Cache valid configuration
    this.configurationCache.set(cacheKey, docuFoldConfig);
    return docuFoldConfig;
  }

  /**
   * Get configuration value with proper type checking and defaults
   */
  private getConfigValue<T>(config: vscode.WorkspaceConfiguration, key: string, defaultValue: T): T {
    const value = config.get<T>(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get language-specific settings with validation
   */
  private getLanguageSettings(config: vscode.WorkspaceConfiguration): Record<string, LanguageConfiguration> {
    const defaultLanguageSettings = this.getDefaultLanguageSettings();
    const userLanguageSettings = config.get<Record<string, LanguageConfiguration>>('languageSettings', {});

    // Merge user settings with defaults
    const mergedSettings: Record<string, LanguageConfiguration> = { ...defaultLanguageSettings };

    for (const [language, settings] of Object.entries(userLanguageSettings)) {
      if (getSupportedLanguageIds().includes(language)) {
        mergedSettings[language] = {
          enabled: settings.enabled !== undefined ? settings.enabled : defaultLanguageSettings[language]?.enabled || true,
          foldSingleLine: settings.foldSingleLine !== undefined ? settings.foldSingleLine : false,
          customPatterns: Array.isArray(settings.customPatterns) ? settings.customPatterns : [],
        };
      }
    }

    return mergedSettings;
  }

  /**
   * Get performance settings with validation
   */
  private getPerformanceSettings(config: vscode.WorkspaceConfiguration): PerformanceSettings {
    const defaultSettings = this.getDefaultPerformanceSettings();
    const userSettings = config.get<Partial<PerformanceSettings>>('performanceSettings', {});

    return {
      maxFileSize: this.validateNumberInRange(userSettings.maxFileSize, defaultSettings.maxFileSize, 10240, 10485760),
      cacheTimeout: this.validateNumberInRange(userSettings.cacheTimeout, defaultSettings.cacheTimeout, 30000, 3600000),
      debounceDelay: this.validateNumberInRange(userSettings.debounceDelay, defaultSettings.debounceDelay, 50, 2000),
      enablePerformanceLogging: userSettings.enablePerformanceLogging !== undefined ? userSettings.enablePerformanceLogging : defaultSettings.enablePerformanceLogging,
    };
  }

  /**
   * Get advanced settings with validation
   */
  private getAdvancedSettings(config: vscode.WorkspaceConfiguration): AdvancedSettings {
    const defaultSettings = this.getDefaultAdvancedSettings();
    const userSettings = config.get<Partial<AdvancedSettings>>('advancedSettings', {});

    return {
      respectUserFolding: userSettings.respectUserFolding !== undefined ? userSettings.respectUserFolding : defaultSettings.respectUserFolding,
      preserveFoldingOnSave: userSettings.preserveFoldingOnSave !== undefined ? userSettings.preserveFoldingOnSave : defaultSettings.preserveFoldingOnSave,
      autoFoldDelay: this.validateNumberInRange(userSettings.autoFoldDelay, defaultSettings.autoFoldDelay, 0, 5000),
      enableContextualFolding: userSettings.enableContextualFolding !== undefined ? userSettings.enableContextualFolding : defaultSettings.enableContextualFolding,
    };
  }

  /**
   * Validate number is within specified range
   */
  private validateNumberInRange(value: number | undefined, defaultValue: number, min: number, max: number): number {
    if (typeof value !== 'number' || isNaN(value)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Validate entire configuration
   */
  validateConfiguration(config: DocuFoldConfiguration): ConfigurationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedConfig: DocuFoldConfiguration | undefined;

    try {
      // Validate basic settings
      if (typeof config.autoFoldEnabled !== 'boolean') {
        errors.push('autoFoldEnabled must be a boolean');
      }

      if (typeof config.previewLength !== 'number' || config.previewLength < 20 || config.previewLength > 200) {
        errors.push('previewLength must be a number between 20 and 200');
      }

      if (!Array.isArray(config.includePatterns)) {
        errors.push('includePatterns must be an array');
      }

      if (!Array.isArray(config.excludePatterns)) {
        errors.push('excludePatterns must be an array');
      }

      // Validate language settings
      if (typeof config.languageSettings !== 'object') {
        errors.push('languageSettings must be an object');
      } else {
        for (const [language, settings] of Object.entries(config.languageSettings)) {
          if (!getSupportedLanguageIds().includes(language)) {
            warnings.push(`Unsupported language in languageSettings: ${language}`);
          }
          if (typeof settings.enabled !== 'boolean') {
            errors.push(`languageSettings.${language}.enabled must be a boolean`);
          }
          if (!Array.isArray(settings.customPatterns)) {
            errors.push(`languageSettings.${language}.customPatterns must be an array`);
          }
        }
      }

      // Validate performance settings
      const perfSettings = config.performanceSettings;
      if (typeof perfSettings.maxFileSize !== 'number' || perfSettings.maxFileSize < 10240) {
        errors.push('performanceSettings.maxFileSize must be a number >= 10240');
      }

      // If there are errors, create sanitized config
      if (errors.length > 0) {
        sanitizedConfig = this.createSanitizedConfiguration(config);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedConfig,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Configuration validation failed: ${error}`],
        warnings: [],
        sanitizedConfig: this.getDefaultConfiguration(),
      };
    }
  }

  /**
   * Create sanitized configuration from invalid config
   */
  private createSanitizedConfiguration(config: DocuFoldConfiguration): DocuFoldConfiguration {
    const defaultConfig = this.getDefaultConfiguration();

    return {
      autoFoldEnabled: typeof config.autoFoldEnabled === 'boolean' ? config.autoFoldEnabled : defaultConfig.autoFoldEnabled,
      previewLength: typeof config.previewLength === 'number' && config.previewLength >= 20 && config.previewLength <= 200 ? config.previewLength : defaultConfig.previewLength,
      includePatterns: Array.isArray(config.includePatterns) ? config.includePatterns : defaultConfig.includePatterns,
      excludePatterns: Array.isArray(config.excludePatterns) ? config.excludePatterns : defaultConfig.excludePatterns,
      enableStatusBar: typeof config.enableStatusBar === 'boolean' ? config.enableStatusBar : defaultConfig.enableStatusBar,
      foldOnOpen: typeof config.foldOnOpen === 'boolean' ? config.foldOnOpen : defaultConfig.foldOnOpen,
      enableHoverPreview: typeof config.enableHoverPreview === 'boolean' ? config.enableHoverPreview : defaultConfig.enableHoverPreview,
      languageSettings: this.sanitizeLanguageSettings(config.languageSettings, defaultConfig.languageSettings),
      performanceSettings: this.sanitizePerformanceSettings(config.performanceSettings, defaultConfig.performanceSettings),
      advancedSettings: this.sanitizeAdvancedSettings(config.advancedSettings, defaultConfig.advancedSettings),
    };
  }

  /**
   * Sanitize language settings
   */
  private sanitizeLanguageSettings(settings: any, defaultSettings: Record<string, LanguageConfiguration>): Record<string, LanguageConfiguration> {
    if (typeof settings !== 'object') {
      return defaultSettings;
    }

    const sanitized: Record<string, LanguageConfiguration> = { ...defaultSettings };

    for (const [language, config] of Object.entries(settings)) {
      if (getSupportedLanguageIds().includes(language) && typeof config === 'object' && config !== null) {
        const langConfig = config as any;
        sanitized[language] = {
          enabled: typeof langConfig.enabled === 'boolean' ? langConfig.enabled : defaultSettings[language]?.enabled || true,
          foldSingleLine: typeof langConfig.foldSingleLine === 'boolean' ? langConfig.foldSingleLine : false,
          customPatterns: Array.isArray(langConfig.customPatterns) ? langConfig.customPatterns : [],
        };
      }
    }

    return sanitized;
  }

  /**
   * Sanitize performance settings
   */
  private sanitizePerformanceSettings(settings: any, defaultSettings: PerformanceSettings): PerformanceSettings {
    if (typeof settings !== 'object') {
      return defaultSettings;
    }

    return {
      maxFileSize: this.validateNumberInRange(settings.maxFileSize, defaultSettings.maxFileSize, 10240, 10485760),
      cacheTimeout: this.validateNumberInRange(settings.cacheTimeout, defaultSettings.cacheTimeout, 30000, 3600000),
      debounceDelay: this.validateNumberInRange(settings.debounceDelay, defaultSettings.debounceDelay, 50, 2000),
      enablePerformanceLogging: typeof settings.enablePerformanceLogging === 'boolean' ? settings.enablePerformanceLogging : defaultSettings.enablePerformanceLogging,
    };
  }

  /**
   * Sanitize advanced settings
   */
  private sanitizeAdvancedSettings(settings: any, defaultSettings: AdvancedSettings): AdvancedSettings {
    if (typeof settings !== 'object') {
      return defaultSettings;
    }

    return {
      respectUserFolding: typeof settings.respectUserFolding === 'boolean' ? settings.respectUserFolding : defaultSettings.respectUserFolding,
      preserveFoldingOnSave: typeof settings.preserveFoldingOnSave === 'boolean' ? settings.preserveFoldingOnSave : defaultSettings.preserveFoldingOnSave,
      autoFoldDelay: this.validateNumberInRange(settings.autoFoldDelay, defaultSettings.autoFoldDelay, 0, 5000),
      enableContextualFolding: typeof settings.enableContextualFolding === 'boolean' ? settings.enableContextualFolding : defaultSettings.enableContextualFolding,
    };
  }

  /**
   * Register configuration change listener
   * @param callback - Callback function for configuration changes
   * @returns Disposable for the listener
   */
  onConfigurationChanged(callback: (config: DocuFoldConfiguration) => void): vscode.Disposable {
    this.changeListeners.add(callback);

    return {
      dispose: () => {
        this.changeListeners.delete(callback);
      },
    };
  }

  /**
   * Setup configuration change watcher
   */
  private setupConfigurationWatcher(): void {
    const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(ConfigurationService.CONFIGURATION_SECTION)) {
        // Clear cache to force reload
        this.configurationCache.clear();

        // Notify listeners
        const newConfig = this.getConfiguration();
        this.changeListeners.forEach((callback) => {
          try {
            callback(newConfig);
          } catch (error) {
            console.error('DocuFold: Error in configuration change callback:', error);
          }
        });
      }
    });

    this.disposables.push(disposable);
  }

  /**
   * Update configuration value
   */
  async updateConfiguration<K extends keyof DocuFoldConfiguration>(key: K, value: DocuFoldConfiguration[K], target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global, resource?: vscode.Uri): Promise<void> {
    const config = vscode.workspace.getConfiguration(ConfigurationService.CONFIGURATION_SECTION, resource);
    await config.update(key, value, target);
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfiguration(target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Promise<void> {
    const config = vscode.workspace.getConfiguration(ConfigurationService.CONFIGURATION_SECTION);
    const defaultConfig = this.getDefaultConfiguration();

    for (const key of Object.keys(defaultConfig)) {
      await config.update(key, undefined, target);
    }
  }

  /**
   * Get configuration for specific language
   */
  getLanguageConfiguration(languageId: string, resource?: vscode.Uri): LanguageConfiguration | undefined {
    const config = this.getConfiguration(resource);
    return config.languageSettings[languageId];
  }

  /**
   * Check if language is enabled
   */
  isLanguageEnabled(languageId: string, resource?: vscode.Uri): boolean {
    const langConfig = this.getLanguageConfiguration(languageId, resource);
    return langConfig?.enabled ?? true;
  }

  /**
   * Get workspace vs user setting precedence info
   */
  getConfigurationSource(key: keyof DocuFoldConfiguration, resource?: vscode.Uri): 'default' | 'user' | 'workspace' | 'folder' {
    const config = vscode.workspace.getConfiguration(ConfigurationService.CONFIGURATION_SECTION, resource);
    const inspect = config.inspect(key as string);

    if (!inspect) {
      return 'default';
    }

    if (inspect.workspaceFolderValue !== undefined) {
      return 'folder';
    }
    if (inspect.workspaceValue !== undefined) {
      return 'workspace';
    }
    if (inspect.globalValue !== undefined) {
      return 'user';
    }
    return 'default';
  }

  /**
   * Get default configuration
   */
  private getDefaultConfiguration(): DocuFoldConfiguration {
    return {
      autoFoldEnabled: true,
      previewLength: 60,
      includePatterns: this.getDefaultIncludePatterns(),
      excludePatterns: this.getDefaultExcludePatterns(),
      enableStatusBar: true,
      foldOnOpen: true,
      enableHoverPreview: true,
      languageSettings: this.getDefaultLanguageSettings(),
      performanceSettings: this.getDefaultPerformanceSettings(),
      advancedSettings: this.getDefaultAdvancedSettings(),
    };
  }

  /**
   * Get default include patterns
   */
  private getDefaultIncludePatterns(): string[] {
    return ['**/*.py', '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.java', '**/*.cs', '**/*.php'];
  }

  /**
   * Get default exclude patterns
   */
  private getDefaultExcludePatterns(): string[] {
    return ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.min.*'];
  }

  /**
   * Get default language settings
   */
  private getDefaultLanguageSettings(): Record<string, LanguageConfiguration> {
    const settings: Record<string, LanguageConfiguration> = {};

    for (const languageId of getSupportedLanguageIds()) {
      settings[languageId] = {
        enabled: true,
        foldSingleLine: false,
        customPatterns: [],
      };
    }

    return settings;
  }

  /**
   * Get default performance settings
   */
  private getDefaultPerformanceSettings(): PerformanceSettings {
    return {
      maxFileSize: 1048576, // 1MB
      cacheTimeout: 300000, // 5 minutes
      debounceDelay: 250,
      enablePerformanceLogging: false,
    };
  }

  /**
   * Get default advanced settings
   */
  private getDefaultAdvancedSettings(): AdvancedSettings {
    return {
      respectUserFolding: true,
      preserveFoldingOnSave: true,
      autoFoldDelay: 500,
      enableContextualFolding: true,
    };
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configurationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.configurationCache.size,
      keys: Array.from(this.configurationCache.keys()),
    };
  }

  /**
   * Dispose of the configuration service
   */
  dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
    this.configurationCache.clear();
    this.changeListeners.clear();
  }
}
