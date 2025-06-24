const { build } = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').BuildOptions}
 */
/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

const esbuildConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: 'node',
  outfile: 'out/extension.js',
  external: ['vscode'],
  logLevel: 'silent',
  plugins: [esbuildProblemMatcherPlugin],
};

async function main() {
  if (watch) {
    const ctx = await build({
      ...esbuildConfig,
      watch: {
        onRebuild(error, result) {
          if (error) console.error('watch build failed:', error);
          else console.log('watch build succeeded');
        },
      },
    });
    console.log('[watch] build started');
  } else {
    await build(esbuildConfig);
    console.log('[build] build finished');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
