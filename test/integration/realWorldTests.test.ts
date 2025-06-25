import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DocstringDetector } from '../../src/detectors/docstringDetector';
import { DocuFoldRangeProvider } from '../../src/providers/foldingRangeProvider';
import { ConfigurationService } from '../../src/services/configurationService';
import { StatusBarService } from '../../src/services/statusBarService';

suite('Real-World User Acceptance Tests', () => {
  let detector: DocstringDetector;
  let provider: DocuFoldRangeProvider;
  let configService: ConfigurationService;
  let statusBarService: StatusBarService;

  setup(() => {
    detector = new DocstringDetector();
    provider = new DocuFoldRangeProvider(detector);
    configService = new ConfigurationService();
    statusBarService = new StatusBarService();
  });

  teardown(() => {
    detector.clearCache();
    provider.clearCache();
    statusBarService.dispose();
  });

  suite('Python Development Workflow', () => {
    test('should handle typical Python module with classes and functions', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Simulate opening a Python file in a real project
      const docstrings = await detector.detectDocstrings(document);
      const ranges = await provider.provideFoldingRanges(
        document,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      // Real-world expectations
      assert.ok(docstrings.length > 0, 'Should detect docstrings in typical Python module');
      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges');

      console.log(`Python module: ${docstrings.length} docstrings, ${ranges.length} ranges`);
    });

    test('should handle Python data science workflow', async () => {
      // Simulate a typical data science Python file
      const mockDataScienceContent = `"""
Data analysis module for customer segmentation.

This module provides functions for analyzing customer data and
performing market segmentation using machine learning techniques.
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans

def load_customer_data(file_path: str) -> pd.DataFrame:
    """
    Load customer data from CSV file.
    
    Args:
        file_path (str): Path to the CSV file
        
    Returns:
        pd.DataFrame: Customer data with cleaned columns
        
    Raises:
        FileNotFoundError: If the file doesn't exist
        ValueError: If the data format is invalid
    """
    df = pd.read_csv(file_path)
    return df.dropna()

class CustomerSegmentation:
    """
    Customer segmentation using K-means clustering.
    
    This class implements customer segmentation algorithms to identify
    distinct customer groups based on purchasing behavior and demographics.
    """
    
    def __init__(self, n_clusters: int = 5):
        """
        Initialize the segmentation model.
        
        Args:
            n_clusters (int): Number of customer segments to create
        """
        self.n_clusters = n_clusters
        self.model = KMeans(n_clusters=n_clusters)
    
    def fit_predict(self, data: pd.DataFrame) -> np.ndarray:
        """
        Fit the model and predict customer segments.
        
        Args:
            data (pd.DataFrame): Customer feature data
            
        Returns:
            np.ndarray: Cluster labels for each customer
        """
        return self.model.fit_predict(data)
`;

      const mockDocument = {
        languageId: 'python',
        getText: () => mockDataScienceContent,
        lineCount: mockDataScienceContent.split('\n').length,
        uri: vscode.Uri.file('customer_analysis.py'),
        version: 1,
      } as vscode.TextDocument;

      const docstrings = await detector.detectDocstrings(mockDocument);
      const ranges = await provider.provideFoldingRanges(
        mockDocument,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      // Data science files typically have comprehensive documentation
      assert.ok(docstrings.length >= 4, 'Should detect multiple docstrings in data science code');
      assert.ok(ranges && ranges.length >= 4, 'Should provide multiple folding ranges');

      console.log(`Data science Python: ${docstrings.length} docstrings detected`);
    });
  });

  suite('JavaScript/TypeScript Development Workflow', () => {
    test('should handle React component with JSDoc', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-typescript.ts');
      const document = await vscode.workspace.openTextDocument(filePath);

      const docstrings = await detector.detectDocstrings(document);
      const ranges = await provider.provideFoldingRanges(
        document,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      // TypeScript/React projects should have JSDoc comments
      assert.ok(docstrings.length > 0, 'Should detect JSDoc in TypeScript');
      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges for JSDoc');

      console.log(`TypeScript: ${docstrings.length} JSDoc comments`);
    });

    test('should handle Node.js Express API', async () => {
      const mockExpressContent = `/**
 * Express.js API routes for e-commerce platform.
 * 
 * This module defines RESTful API endpoints for product management,
 * user authentication, and order processing.
 * 
 * @author Development Team
 * @version 2.1.0
 */

const express = require('express');
const router = express.Router();

/**
 * Get all products with pagination and filtering.
 * 
 * @route GET /api/products
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.page - Page number for pagination
 * @param {number} req.query.limit - Items per page
 * @param {string} req.query.category - Filter by category
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with product list
 * @throws {Error} Database connection error
 * 
 * @example
 * // GET /api/products?page=1&limit=10&category=electronics
 * // Response: { products: [...], pagination: { page: 1, total: 50 } }
 */
async function getProducts(req, res) {
    const { page = 1, limit = 10, category } = req.query;
    // Implementation here
}

/**
 * Create a new product in the catalog.
 * 
 * @route POST /api/products
 * @param {Object} req - Express request object
 * @param {Object} req.body - Product data
 * @param {string} req.body.name - Product name
 * @param {number} req.body.price - Product price
 * @param {string} req.body.description - Product description
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with created product
 * @throws {ValidationError} Invalid product data
 */
async function createProduct(req, res) {
    const productData = req.body;
    // Implementation here
}`;

      const mockDocument = {
        languageId: 'javascript',
        getText: () => mockExpressContent,
        lineCount: mockExpressContent.split('\n').length,
        uri: vscode.Uri.file('routes.js'),
        version: 1,
      } as vscode.TextDocument;

      const docstrings = await detector.detectDocstrings(mockDocument);
      const ranges = await provider.provideFoldingRanges(
        mockDocument,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      // Express APIs have detailed JSDoc with routes and examples
      assert.ok(docstrings.length >= 3, 'Should detect multiple JSDoc blocks in Express API');
      assert.ok(
        ranges && ranges.length >= 3,
        'Should provide folding ranges for API documentation'
      );

      console.log(`Express API: ${docstrings.length} JSDoc blocks detected`);
    });
  });

  suite('Multi-File Project Workflow', () => {
    test('should maintain consistent behavior across multiple files', async () => {
      const testFiles = [
        { path: '../../test-workspace/test-python.py', language: 'python' },
        { path: '../../test-workspace/test-typescript.ts', language: 'typescript' },
        { path: '../../test-workspace/test-java.java', language: 'java' },
      ];

      const results = [];

      for (const testFile of testFiles) {
        const filePath = path.join(__dirname, testFile.path);
        const document = await vscode.workspace.openTextDocument(filePath);

        const startTime = Date.now();
        const docstrings = await detector.detectDocstrings(document);
        const ranges = await provider.provideFoldingRanges(
          document,
          {} as vscode.FoldingContext,
          new vscode.CancellationTokenSource().token
        );
        const endTime = Date.now();

        results.push({
          language: testFile.language,
          docstrings: docstrings.length,
          ranges: ranges?.length || 0,
          processingTime: endTime - startTime,
        });
      }

      // Verify consistent behavior across languages
      results.forEach(result => {
        assert.ok(
          result.processingTime < 100,
          `${result.language} should process quickly (${result.processingTime}ms)`
        );
        if (result.docstrings > 0) {
          assert.ok(
            result.ranges > 0,
            `${result.language} should provide folding ranges when docstrings exist`
          );
        }
      });

      console.log('Multi-file consistency results:');
      results.forEach(result => {
        console.log(
          `  ${result.language}: ${result.docstrings} docstrings, ${result.ranges} ranges, ${result.processingTime}ms`
        );
      });
    });
  });

  suite('Developer Workflow Scenarios', () => {
    test('should handle file opening workflow', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      // Simulate typical file opening workflow
      const startTime = Date.now();

      // 1. Document opens, extension detects language
      assert.ok(
        detector.isLanguageSupported(document.languageId as any),
        'Should support document language'
      );

      // 2. Extension detects docstrings
      const docstrings = await detector.detectDocstrings(document);

      // 3. Extension provides folding ranges
      const ranges = await provider.provideFoldingRanges(
        document,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      // 4. Status bar updates
      statusBarService.updateDocumentStatus({
        docstringCount: docstrings.length,
        foldedCount: ranges?.length || 0,
        language: document.languageId,
        fileName: path.basename(document.fileName),
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete file opening workflow quickly
      assert.ok(totalTime < 200, `File opening workflow should be fast (${totalTime}ms)`);
      assert.ok(docstrings.length > 0, 'Should detect docstrings on file open');
      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges on file open');

      console.log(
        `File opening workflow: ${totalTime}ms, ${docstrings.length} docstrings, ${ranges.length} ranges`
      );
    });

    test('should handle auto-fold state management', async () => {
      // Test auto-fold state management
      const initialAutoFoldState = provider.isAutoFoldEnabled();

      // Test enabling/disabling auto-fold
      provider.setAutoFoldEnabled(false);
      assert.strictEqual(provider.isAutoFoldEnabled(), false, 'Should disable auto-fold');

      provider.setAutoFoldEnabled(true);
      assert.strictEqual(provider.isAutoFoldEnabled(), true, 'Should enable auto-fold');

      // Restore original state
      provider.setAutoFoldEnabled(initialAutoFoldState);

      console.log('Auto-fold state management test completed');
    });
  });

  suite('Edge Cases and Error Handling', () => {
    test('should handle empty files gracefully', async () => {
      const mockEmptyDocument = {
        languageId: 'python',
        getText: () => '',
        lineCount: 0,
        uri: vscode.Uri.file('empty.py'),
        version: 1,
      } as vscode.TextDocument;

      const docstrings = await detector.detectDocstrings(mockEmptyDocument);
      const ranges = await provider.provideFoldingRanges(
        mockEmptyDocument,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      assert.strictEqual(docstrings.length, 0, 'Should return empty array for empty file');
      assert.ok(ranges && ranges.length === 0, 'Should return empty folding ranges for empty file');

      console.log('Empty file handling: OK');
    });

    test('should handle very large files without hanging', async () => {
      const filePath = path.join(__dirname, '../../test-workspace/test-large-python.py');
      const document = await vscode.workspace.openTextDocument(filePath);

      const startTime = Date.now();
      const docstrings = await detector.detectDocstrings(document);
      const ranges = await provider.provideFoldingRanges(
        document,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      // Should handle large files within reasonable time
      assert.ok(
        processingTime < 2000,
        `Large file should process within 2 seconds (${processingTime}ms)`
      );
      assert.ok(docstrings.length > 0, 'Should detect docstrings in large file');
      assert.ok(ranges && ranges.length > 0, 'Should provide folding ranges for large file');

      console.log(
        `Large file (${document.lineCount} lines): ${processingTime}ms, ${docstrings.length} docstrings, ${ranges.length} ranges`
      );
    });

    test('should handle files with mixed content', async () => {
      const mockMixedContent = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mixed content Python file with various elements.

This file contains a mix of code, comments, docstrings,
and different coding patterns to test robustness.
"""

import os
import sys

# Regular comment
def function_with_docstring():
    """This function has a proper docstring."""
    pass

def function_without_docstring():
    # Just a comment, not a docstring
    return "no docstring"

class MyClass:
    """Class with docstring."""
    
    def method1(self):
        """Method with docstring."""
        pass
    
    def method2(self):
        # Method without docstring
        pass

# More comments
# Multiple line comments
# That are not docstrings

if __name__ == "__main__":
    """This is not a proper docstring location."""
    print("Hello world")
`;

      const mockDocument = {
        languageId: 'python',
        getText: () => mockMixedContent,
        lineCount: mockMixedContent.split('\n').length,
        uri: vscode.Uri.file('mixed_content.py'),
        version: 1,
      } as vscode.TextDocument;

      const docstrings = await detector.detectDocstrings(mockDocument);
      const ranges = await provider.provideFoldingRanges(
        mockDocument,
        {} as vscode.FoldingContext,
        new vscode.CancellationTokenSource().token
      );

      // Should correctly identify only actual docstrings
      assert.ok(docstrings.length >= 3, 'Should detect proper docstrings in mixed content');
      assert.ok(
        ranges && ranges.length >= 3,
        'Should provide folding ranges for proper docstrings'
      );

      // Verify it doesn't pick up regular comments
      const hasRegularComments = docstrings.some(d => d.content.includes('# Regular comment'));
      assert.ok(!hasRegularComments, 'Should not detect regular comments as docstrings');

      console.log(`Mixed content: ${docstrings.length} docstrings detected`);
    });
  });

  suite('Configuration Integration', () => {
    test('should respect user configuration settings', async () => {
      // Test with different configuration settings
      const originalConfig = await configService.getConfiguration();

      // Test with auto-fold disabled
      await configService.updateConfiguration('autoFoldEnabled', false);
      const updatedConfig = await configService.getConfiguration();
      assert.strictEqual(
        updatedConfig.autoFoldEnabled,
        false,
        'Should respect auto-fold disabled setting'
      );

      // Restore original configuration
      await configService.updateConfiguration('autoFoldEnabled', originalConfig.autoFoldEnabled);

      console.log('Configuration integration test completed');
    });

    test('should handle configuration validation', async () => {
      // Test configuration validation
      const testConfig = {
        autoFoldEnabled: true,
        previewLength: 50,
        includePatterns: ['**/*.py', '**/*.js'],
        excludePatterns: ['**/node_modules/**'],
        enableStatusBar: true,
        foldOnOpen: true,
        enableHoverPreview: true,
        languageSettings: {},
        performanceSettings: {
          maxFileSize: 1000000,
          cacheTimeout: 300000,
          debounceDelay: 500,
          enablePerformanceLogging: false,
        },
        advancedSettings: {
          respectUserFolding: true,
          preserveFoldingOnSave: false,
          autoFoldDelay: 1000,
          enableContextualFolding: false,
        },
      };

      const validation = configService.validateConfiguration(testConfig);
      assert.ok(validation.isValid, 'Should validate correct configuration');
      assert.strictEqual(validation.errors.length, 0, 'Should have no validation errors');

      console.log('Configuration validation test completed');
    });
  });
});
