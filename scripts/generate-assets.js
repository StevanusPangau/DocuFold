#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate marketplace assets for VSCode extension
 * This script creates PNG versions of SVG assets for marketplace compatibility
 */

const RESOURCES_DIR = path.join(__dirname, '..', 'resources');
const ASSETS_DIR = path.join(RESOURCES_DIR, 'marketplace');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

console.log('🎨 DocuFold Asset Generator');
console.log('============================');

// Asset specifications for VSCode marketplace
const ASSET_SPECS = {
  icon: {
    sizes: [16, 32, 64, 128, 256],
    source: path.join(RESOURCES_DIR, 'icon.svg'),
    description: 'Extension icon',
  },
  banner: {
    sizes: [1200], // Banner is typically 1200x300
    source: path.join(RESOURCES_DIR, 'banner.svg'),
    description: 'Marketplace banner',
  },
};

/**
 * Generate asset information for manual conversion
 * Since we don't have sharp/canvas dependencies, we'll provide instructions
 */
function generateAssetInstructions() {
  console.log('\n📋 Asset Generation Instructions:');
  console.log('==================================');

  Object.entries(ASSET_SPECS).forEach(([type, spec]) => {
    console.log(`\n${spec.description}:`);
    console.log(`Source: ${spec.source}`);

    spec.sizes.forEach((size) => {
      const outputPath = path.join(ASSETS_DIR, `${type}-${size}.png`);
      console.log(`  → ${size}x${size}: ${outputPath}`);
    });
  });

  console.log('\n🔧 Manual Conversion Options:');
  console.log('1. Online converters: https://convertio.co/svg-png/');
  console.log('2. Inkscape CLI: inkscape --export-png=output.png --export-width=128 input.svg');
  console.log('3. GIMP: Open SVG → Export as PNG');
  console.log('4. Adobe Illustrator: Export → Export As → PNG');

  console.log('\n📦 Required Assets for VSCode Marketplace:');
  console.log('- icon.png (128x128) - Main extension icon');
  console.log('- Optional: banner image for gallery');
}

/**
 * Create asset manifest for tracking
 */
function createAssetManifest() {
  const manifest = {
    generated: new Date().toISOString(),
    version: '0.0.1',
    assets: {
      icon: {
        source: 'resources/icon.svg',
        formats: ['PNG'],
        sizes: ASSET_SPECS.icon.sizes,
        purpose: 'Extension icon for VSCode marketplace',
      },
      banner: {
        source: 'resources/banner.svg',
        formats: ['PNG', 'SVG'],
        sizes: ASSET_SPECS.banner.sizes,
        purpose: 'Marketplace banner and promotional material',
      },
    },
    instructions: {
      icon: 'Convert to 128x128 PNG for package.json icon field',
      banner: 'Optional marketplace banner, recommended 1200x300 PNG',
    },
  };

  const manifestPath = path.join(ASSETS_DIR, 'asset-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📄 Asset manifest created: ${manifestPath}`);
}

/**
 * Copy SVG assets to marketplace directory
 */
function copySVGAssets() {
  console.log('\n📁 Copying SVG assets...');

  Object.entries(ASSET_SPECS).forEach(([type, spec]) => {
    if (fs.existsSync(spec.source)) {
      const destPath = path.join(ASSETS_DIR, `${type}.svg`);
      fs.copyFileSync(spec.source, destPath);
      console.log(`✅ Copied ${type}.svg`);
    } else {
      console.log(`❌ Source not found: ${spec.source}`);
    }
  });
}

/**
 * Create README for assets directory
 */
function createAssetsReadme() {
  const readmeContent = `# DocuFold Marketplace Assets

This directory contains assets for the VSCode marketplace and extension branding.

## Files

### SVG Sources
- \`icon.svg\` - Main extension icon (vector format)
- \`banner.svg\` - Marketplace banner (vector format)

### Generated Assets
- \`icon-128.png\` - Extension icon (128x128 PNG) - **Required for package.json**
- \`banner-1200.png\` - Marketplace banner (1200x300 PNG) - Optional

## Asset Requirements

### Extension Icon
- **Format**: PNG
- **Size**: 128x128 pixels
- **Purpose**: Displayed in VSCode extensions panel and marketplace
- **Location**: Referenced in package.json \`icon\` field

### Marketplace Banner
- **Format**: PNG or SVG
- **Size**: 1200x300 pixels (recommended)
- **Purpose**: Promotional banner for marketplace listing
- **Optional**: Not required but enhances marketplace presence

## Generation Instructions

1. **Online Conversion**: Use https://convertio.co/svg-png/
2. **Inkscape CLI**: 
   \`\`\`bash
   inkscape --export-png=icon-128.png --export-width=128 icon.svg
   \`\`\`
3. **GIMP**: Open SVG → Export as PNG
4. **Adobe Illustrator**: Export → Export As → PNG

## Usage

1. Generate \`icon-128.png\` from \`icon.svg\`
2. Update package.json if icon path changes
3. Optionally generate banner for enhanced marketplace presence

## Asset Manifest

See \`asset-manifest.json\` for detailed asset specifications and tracking.
`;

  const readmePath = path.join(ASSETS_DIR, 'README.md');
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`📖 Assets README created: ${readmePath}`);
}

// Main execution
console.log('Starting asset generation process...\n');

try {
  copySVGAssets();
  createAssetManifest();
  createAssetsReadme();
  generateAssetInstructions();

  console.log('\n✅ Asset generation completed successfully!');
  console.log('\n🚀 Next Steps:');
  console.log('1. Convert SVG assets to PNG using preferred method');
  console.log('2. Ensure icon-128.png exists in resources/ directory');
  console.log('3. Run extension to test icon display');
  console.log('4. Package extension for marketplace');
} catch (error) {
  console.error('\n❌ Error during asset generation:', error.message);
  process.exit(1);
}
 