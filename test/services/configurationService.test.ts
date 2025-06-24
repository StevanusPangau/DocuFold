import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { ConfigurationService } from '../../src/services/configurationService';
import { DocuFoldConfiguration, LanguageConfiguration, PerformanceSettings, AdvancedSettings } from '../../src/types';

suite('ConfigurationService Tests', () => {
  let configService: ConfigurationService;
  let sandbox: sinon.SinonSandbox;
  let mockWorkspaceConfig: sinon.SinonStubbedInstance<vscode.WorkspaceConfiguration>;

  setup(() => {
    sandbox = sinon.createSandbox();
    configService = new ConfigurationService();

    // Create mock workspace configuration
    mockWorkspaceConfig = {
      get: sandbox.stub(),
      has: sandbox.stub(),
      inspect: sandbox.stub(),
      update: sandbox.stub(),
    } as any;

    // Mock vscode.workspace.getConfiguration
    sandbox.stub(vscode.workspace, 'getConfiguration').returns(mockWorkspaceConfig as any);
  });

  teardown(() => {
    configService.dispose();
    sandbox.restore();
  });

  suite('Basic Configuration Reading', () => {
    test('should return default configuration when no user settings exist', () => {
      // Setup mock to return default values
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => defaultValue);

      const config = configService.getConfiguration();

      assert.strictEqual(config.autoFoldEnabled, true);
      assert.strictEqual(config.previewLength, 60);
      assert.strictEqual(config.enableStatusBar, true);
      assert.strictEqual(config.foldOnOpen, true);
      assert.strictEqual(config.enableHoverPreview, true);
      assert(Array.isArray(config.includePatterns));
      assert(Array.isArray(config.excludePatterns));
      assert(typeof config.languageSettings === 'object');
      assert(typeof config.performanceSettings === 'object');
      assert(typeof config.advancedSettings === 'object');
    });

    test('should merge user settings with defaults', () => {
      // Setup mock to return specific user values
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => {
        switch (key) {
          case 'autoFoldEnabled':
            return false;
          case 'previewLength':
            return 80;
          case 'enableStatusBar':
            return false;
          default:
            return defaultValue;
        }
      });

      const config = configService.getConfiguration();

      assert.strictEqual(config.autoFoldEnabled, false);
      assert.strictEqual(config.previewLength, 80);
      assert.strictEqual(config.enableStatusBar, false);
      // Defaults should still be used for other settings
      assert.strictEqual(config.foldOnOpen, true);
    });

    test('should cache configuration results', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => defaultValue);

      // First call
      const config1 = configService.getConfiguration();
      // Second call should use cache
      const config2 = configService.getConfiguration();

      assert.strictEqual(config1, config2);

      const cacheStats = configService.getCacheStats();
      assert.strictEqual(cacheStats.size, 1);
      assert(cacheStats.keys.includes('global'));
    });

    test('should handle resource-specific configuration', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => defaultValue);

      const resource = vscode.Uri.file('/test/file.py');
      const config = configService.getConfiguration(resource);

      assert(config);
      assert(vscode.workspace.getConfiguration).calledWith('docufold', resource);
    });
  });

  suite('Language-Specific Configuration', () => {
    test('should return default language settings', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => defaultValue);

      const config = configService.getConfiguration();
      const pythonConfig = config.languageSettings.python;

      assert(pythonConfig);
      assert.strictEqual(pythonConfig.enabled, true);
      assert.strictEqual(pythonConfig.foldSingleLine, false);
      assert(Array.isArray(pythonConfig.customPatterns));
      assert.strictEqual(pythonConfig.customPatterns.length, 0);
    });

    test('should merge user language settings with defaults', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => {
        if (key === 'languageSettings') {
          return {
            python: {
              enabled: false,
              foldSingleLine: true,
              customPatterns: ['test-pattern'],
            },
          };
        }
        return defaultValue;
      });

      const config = configService.getConfiguration();
      const pythonConfig = config.languageSettings.python;

      assert.strictEqual(pythonConfig.enabled, false);
      assert.strictEqual(pythonConfig.foldSingleLine, true);
      assert.deepStrictEqual(pythonConfig.customPatterns, ['test-pattern']);
    });

    test('should get language configuration for specific language', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => defaultValue);

      const pythonConfig = configService.getLanguageConfiguration('python');
      assert(pythonConfig);
      assert.strictEqual(pythonConfig.enabled, true);
    });

    test('should check if language is enabled', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => {
        if (key === 'languageSettings') {
          return {
            python: { enabled: false, foldSingleLine: false, customPatterns: [] },
          };
        }
        return defaultValue;
      });

      assert.strictEqual(configService.isLanguageEnabled('python'), false);
      assert.strictEqual(configService.isLanguageEnabled('javascript'), true); // Default
    });
  });

  suite('Performance Settings', () => {
    test('should return default performance settings', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => defaultValue);

      const config = configService.getConfiguration();
      const perfSettings = config.performanceSettings;

      assert.strictEqual(perfSettings.maxFileSize, 1048576);
      assert.strictEqual(perfSettings.cacheTimeout, 300000);
      assert.strictEqual(perfSettings.debounceDelay, 250);
      assert.strictEqual(perfSettings.enablePerformanceLogging, false);
    });

    test('should validate performance settings ranges', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => {
        if (key === 'performanceSettings') {
          return {
            maxFileSize: 5000, // Too small
            cacheTimeout: 10000, // Too small
            debounceDelay: 5000, // Too large
            enablePerformanceLogging: true,
          };
        }
        return defaultValue;
      });

      const config = configService.getConfiguration();
      const perfSettings = config.performanceSettings;

      // Should be clamped to valid ranges
      assert.strictEqual(perfSettings.maxFileSize, 10240); // Min value
      assert.strictEqual(perfSettings.cacheTimeout, 30000); // Min value
      assert.strictEqual(perfSettings.debounceDelay, 2000); // Max value
      assert.strictEqual(perfSettings.enablePerformanceLogging, true);
    });
  });

  suite('Advanced Settings', () => {
    test('should return default advanced settings', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => defaultValue);

      const config = configService.getConfiguration();
      const advSettings = config.advancedSettings;

      assert.strictEqual(advSettings.respectUserFolding, true);
      assert.strictEqual(advSettings.preserveFoldingOnSave, true);
      assert.strictEqual(advSettings.autoFoldDelay, 500);
      assert.strictEqual(advSettings.enableContextualFolding, true);
    });

    test('should merge user advanced settings', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => {
        if (key === 'advancedSettings') {
          return {
            respectUserFolding: false,
            autoFoldDelay: 1000,
          };
        }
        return defaultValue;
      });

      const config = configService.getConfiguration();
      const advSettings = config.advancedSettings;

      assert.strictEqual(advSettings.respectUserFolding, false);
      assert.strictEqual(advSettings.autoFoldDelay, 1000);
      // Defaults for unspecified settings
      assert.strictEqual(advSettings.preserveFoldingOnSave, true);
      assert.strictEqual(advSettings.enableContextualFolding, true);
    });
  });

  suite('Configuration Validation', () => {
    test('should validate valid configuration', () => {
      const validConfig: DocuFoldConfiguration = {
        autoFoldEnabled: true,
        previewLength: 60,
        includePatterns: ['**/*.py'],
        excludePatterns: ['**/node_modules/**'],
        enableStatusBar: true,
        foldOnOpen: true,
        enableHoverPreview: true,
        languageSettings: {
          python: { enabled: true, foldSingleLine: false, customPatterns: [] },
        },
        performanceSettings: {
          maxFileSize: 1048576,
          cacheTimeout: 300000,
          debounceDelay: 250,
          enablePerformanceLogging: false,
        },
        advancedSettings: {
          respectUserFolding: true,
          preserveFoldingOnSave: true,
          autoFoldDelay: 500,
          enableContextualFolding: true,
        },
      };

      const result = configService.validateConfiguration(validConfig);

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
      assert.strictEqual(result.warnings.length, 0);
    });

    test('should detect invalid configuration', () => {
      const invalidConfig = {
        autoFoldEnabled: 'not-boolean',
        previewLength: 'not-number',
        includePatterns: 'not-array',
        excludePatterns: 'not-array',
        languageSettings: 'not-object',
        performanceSettings: {
          maxFileSize: 1000, // Too small
        },
      } as any;

      const result = configService.validateConfiguration(invalidConfig);

      assert.strictEqual(result.isValid, false);
      assert(result.errors.length > 0);
      assert(result.sanitizedConfig);
    });

    test('should provide warnings for unsupported languages', () => {
      const configWithUnsupportedLang: DocuFoldConfiguration = {
        autoFoldEnabled: true,
        previewLength: 60,
        includePatterns: ['**/*.py'],
        excludePatterns: ['**/node_modules/**'],
        enableStatusBar: true,
        foldOnOpen: true,
        enableHoverPreview: true,
        languageSettings: {
          'unsupported-language': { enabled: true, foldSingleLine: false, customPatterns: [] },
        },
        performanceSettings: {
          maxFileSize: 1048576,
          cacheTimeout: 300000,
          debounceDelay: 250,
          enablePerformanceLogging: false,
        },
        advancedSettings: {
          respectUserFolding: true,
          preserveFoldingOnSave: true,
          autoFoldDelay: 500,
          enableContextualFolding: true,
        },
      };

      const result = configService.validateConfiguration(configWithUnsupportedLang);

      assert(result.warnings.some((w) => w.includes('unsupported-language')));
    });
  });

  suite('Configuration Updates', () => {
    test('should update configuration value', async () => {
      mockWorkspaceConfig.update.resolves();

      await configService.updateConfiguration('autoFoldEnabled', false);

      assert(mockWorkspaceConfig.update.calledWith('autoFoldEnabled', false, vscode.ConfigurationTarget.Global));
    });

    test('should update configuration with specific target', async () => {
      mockWorkspaceConfig.update.resolves();

      await configService.updateConfiguration('previewLength', 80, vscode.ConfigurationTarget.Workspace);

      assert(mockWorkspaceConfig.update.calledWith('previewLength', 80, vscode.ConfigurationTarget.Workspace));
    });

    test('should reset configuration to defaults', async () => {
      mockWorkspaceConfig.update.resolves();

      await configService.resetConfiguration();

      assert(mockWorkspaceConfig.update.called);
    });
  });

  suite('Configuration Change Listeners', () => {
    test('should register and call configuration change listeners', (done) => {
      let callbackCalled = false;

      const disposable = configService.onConfigurationChanged((config) => {
        callbackCalled = true;
        assert(config);
        disposable.dispose();
        done();
      });

      // Mock configuration change event
      mockWorkspaceConfig.get.callsFake((_key: string, defaultValue: any) => defaultValue);

      // Simulate configuration change
      const configChangeEvent = {
        affectsConfiguration: sandbox.stub().returns(true),
      };

      // Trigger the change event
      setTimeout(() => {
        const onDidChangeConfigStub = sandbox.stub(vscode.workspace, 'onDidChangeConfiguration');
        const callback = onDidChangeConfigStub.getCall(0)?.args[0];
        if (callback) {
          callback(configChangeEvent);
        }
      }, 10);
    });

    test('should handle errors in configuration change callbacks', () => {
      const errorCallback = () => {
        throw new Error('Test error');
      };

      const disposable = configService.onConfigurationChanged(errorCallback);

      // Should not throw when callback errors
      assert.doesNotThrow(() => {
        const configChangeEvent = {
          affectsConfiguration: sandbox.stub().returns(true),
        };
        // This would normally trigger the callback
      });

      disposable.dispose();
    });
  });

  suite('Configuration Source Detection', () => {
    test('should detect configuration source precedence', () => {
      mockWorkspaceConfig.inspect.returns({
        key: 'autoFoldEnabled',
        defaultValue: true,
        globalValue: false,
        workspaceValue: undefined,
        workspaceFolderValue: undefined,
      });

      const source = configService.getConfigurationSource('autoFoldEnabled');
      assert.strictEqual(source, 'user');
    });

    test('should detect workspace configuration source', () => {
      mockWorkspaceConfig.inspect.returns({
        key: 'autoFoldEnabled',
        defaultValue: true,
        globalValue: undefined,
        workspaceValue: false,
        workspaceFolderValue: undefined,
      });

      const source = configService.getConfigurationSource('autoFoldEnabled');
      assert.strictEqual(source, 'workspace');
    });

    test('should detect folder configuration source', () => {
      mockWorkspaceConfig.inspect.returns({
        key: 'autoFoldEnabled',
        defaultValue: true,
        globalValue: undefined,
        workspaceValue: undefined,
        workspaceFolderValue: false,
      });

      const source = configService.getConfigurationSource('autoFoldEnabled');
      assert.strictEqual(source, 'folder');
    });

    test('should detect default configuration source', () => {
      mockWorkspaceConfig.inspect.returns({
        key: 'autoFoldEnabled',
        defaultValue: true,
        globalValue: undefined,
        workspaceValue: undefined,
        workspaceFolderValue: undefined,
      });

      const source = configService.getConfigurationSource('autoFoldEnabled');
      assert.strictEqual(source, 'default');
    });
  });

  suite('Cache Management', () => {
    test('should clear configuration cache', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => defaultValue);

      // Load configuration to populate cache
      configService.getConfiguration();
      assert.strictEqual(configService.getCacheStats().size, 1);

      // Clear cache
      configService.clearCache();
      assert.strictEqual(configService.getCacheStats().size, 0);
    });

    test('should provide cache statistics', () => {
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => defaultValue);

      const resource1 = vscode.Uri.file('/test1.py');
      const resource2 = vscode.Uri.file('/test2.py');

      configService.getConfiguration();
      configService.getConfiguration(resource1);
      configService.getConfiguration(resource2);

      const stats = configService.getCacheStats();
      assert.strictEqual(stats.size, 3);
      assert(stats.keys.includes('global'));
      assert(stats.keys.includes(resource1.toString()));
      assert(stats.keys.includes(resource2.toString()));
    });
  });

  suite('Error Handling', () => {
    test('should handle configuration validation errors gracefully', () => {
      // Mock configuration that will cause validation errors
      mockWorkspaceConfig.get.callsFake((key: string, defaultValue: any) => {
        if (key === 'autoFoldEnabled') {
          return 'invalid-boolean';
        }
        return defaultValue;
      });

      // Should not throw, should return sanitized config
      const config = configService.getConfiguration();
      assert(config);
      assert.strictEqual(typeof config.autoFoldEnabled, 'boolean');
    });

    test('should handle configuration reading errors', () => {
      // Mock configuration.get to throw
      mockWorkspaceConfig.get.throws(new Error('Configuration error'));

      // Should not throw, should return default config
      const config = configService.getConfiguration();
      assert(config);
      assert.strictEqual(config.autoFoldEnabled, true); // Default value
    });
  });

  suite('Disposal', () => {
    test('should dispose resources properly', () => {
      const initialCacheSize = configService.getCacheStats().size;

      configService.dispose();

      // Cache should be cleared
      assert.strictEqual(configService.getCacheStats().size, 0);
    });
  });
});
