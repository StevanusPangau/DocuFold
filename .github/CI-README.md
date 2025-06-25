# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated CI/CD pipeline of the DocuFold extension.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch
- Release events

**Jobs:**
- **Test**: Runs on multiple OS (Ubuntu, Windows, macOS) with Node.js 18.x & 20.x
- **Lint and Format**: Code quality checks with ESLint and Prettier
- **Security Audit**: Dependency vulnerability scanning
- **Build**: Extension packaging and artifact creation
- **Publish Dev**: Auto-publish pre-releases from `develop` branch
- **Publish Prod**: Auto-publish releases from GitHub releases
- **Notify**: Status notifications

**Features:**
- Cross-platform testing (Linux, Windows, macOS)
- Multiple Node.js versions (18.x, 20.x)
- Multiple VSCode versions (1.74.0, stable)
- Automated marketplace publishing
- Test result uploads and coverage reports

### 2. Release Automation (`release.yml`)

**Triggers:**
- Manual workflow dispatch with version type selection

**Jobs:**
- **Prepare Release**: Version bumping and changelog generation
- **Build and Test**: Full CI pipeline execution
- **Create Release**: GitHub release creation with assets
- **Publish Marketplace**: VSCode Marketplace and Open VSX publishing
- **Notify Completion**: Release status notifications

**Features:**
- Semantic version bumping (patch, minor, major)
- Automatic changelog generation
- GitHub release creation with VSIX assets
- Dual marketplace publishing (VSCode + Open VSX)
- Pre-release support

## Setup Requirements

### GitHub Secrets

The following secrets must be configured in your GitHub repository:

1. **VSCE_PAT**: Personal Access Token for VSCode Marketplace
   - Create at: https://dev.azure.com/
   - Scope: Marketplace (manage)
   - Used for: Publishing to VSCode Marketplace

2. **OVSX_PAT**: Personal Access Token for Open VSX Registry
   - Create at: https://open-vsx.org/
   - Used for: Publishing to Open VSX Registry

### Repository Settings

1. **Branch Protection**: Configure branch protection rules for `main`
2. **Actions Permissions**: Enable GitHub Actions for the repository
3. **Secrets Management**: Add required PAT tokens to repository secrets

## Usage

### Automated CI/CD

1. **Development**: Push to `develop` branch triggers CI and pre-release
2. **Production**: Create GitHub release triggers full CI/CD and marketplace publishing
3. **Pull Requests**: Automatic testing and quality checks

### Manual Release

1. Go to **Actions** tab in GitHub repository
2. Select **Release Automation** workflow
3. Click **Run workflow**
4. Choose version type (patch/minor/major)
5. Optionally create pre-release
6. Click **Run workflow**

## Workflow Details

### Test Matrix

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [18.x, 20.x]
    vscode-version: [1.74.0, stable]
```

### Build Process

1. **Dependencies**: `npm ci` for consistent installs
2. **Linting**: ESLint with TypeScript support
3. **Type Checking**: TypeScript compiler validation
4. **Testing**: VSCode extension test runner with Xvfb
5. **Building**: esbuild compilation and bundling
6. **Packaging**: VSCE package creation

### Security Measures

- **Dependency Audit**: `npm audit` and `audit-ci`
- **Vulnerability Scanning**: Automated security checks
- **Token Security**: Secure secret management
- **Branch Protection**: Protected main branch

## Troubleshooting

### Common Issues

1. **Test Failures**: Check Xvfb setup for Linux environments
2. **Build Errors**: Verify TypeScript compilation
3. **Publishing Errors**: Validate PAT tokens and permissions
4. **Version Conflicts**: Ensure semantic versioning compliance

### Debug Steps

1. Check workflow logs in Actions tab
2. Verify dependencies and package.json scripts
3. Test locally with `npm run test` and `npm run build`
4. Validate extension packaging with `npm run package`

## Monitoring

### Artifacts

- **Test Results**: Uploaded for each test run
- **Coverage Reports**: HTML and LCOV formats
- **Extension Packages**: VSIX files for releases
- **Build Logs**: Detailed execution logs

### Notifications

- **Success**: Confirmation messages for successful deployments
- **Failures**: Detailed error information and failed job identification
- **Status**: Real-time workflow status in GitHub UI

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep GitHub Actions and npm packages current
2. **Review Security**: Monitor vulnerability reports and audit results
3. **Performance**: Optimize workflow execution times
4. **Documentation**: Keep workflow documentation updated

### Version Updates

- **GitHub Actions**: Update action versions in workflows
- **Node.js**: Update Node.js versions in test matrix
- **VSCode**: Update minimum VSCode version requirements
- **Dependencies**: Regular dependency updates and security patches 