# DocuFold Marketplace Assets

This directory contains assets for the VSCode marketplace and extension branding.

## Files

### SVG Sources
- `icon.svg` - Main extension icon (vector format)
- `banner.svg` - Marketplace banner (vector format)

### Generated Assets
- `icon-128.png` - Extension icon (128x128 PNG) - **Required for package.json**
- `banner-1200.png` - Marketplace banner (1200x300 PNG) - Optional

## Asset Requirements

### Extension Icon
- **Format**: PNG
- **Size**: 128x128 pixels
- **Purpose**: Displayed in VSCode extensions panel and marketplace
- **Location**: Referenced in package.json `icon` field

### Marketplace Banner
- **Format**: PNG or SVG
- **Size**: 1200x300 pixels (recommended)
- **Purpose**: Promotional banner for marketplace listing
- **Optional**: Not required but enhances marketplace presence

## Generation Instructions

1. **Online Conversion**: Use https://convertio.co/svg-png/
2. **Inkscape CLI**: 
   ```bash
   inkscape --export-png=icon-128.png --export-width=128 icon.svg
   ```
3. **GIMP**: Open SVG → Export as PNG
4. **Adobe Illustrator**: Export → Export As → PNG

## Usage

1. Generate `icon-128.png` from `icon.svg`
2. Update package.json if icon path changes
3. Optionally generate banner for enhanced marketplace presence

## Asset Manifest

See `asset-manifest.json` for detailed asset specifications and tracking.
