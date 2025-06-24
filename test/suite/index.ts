import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 20000,
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    const testFiles = new glob.Glob('**/**.test.js', { cwd: testsRoot });
    const testFileStream = testFiles.stream();

    testFileStream.on('data', (file) => {
      mocha.addFile(path.resolve(testsRoot, file));
    });

    testFileStream.on('error', (err) => {
      reject(err);
    });

    testFileStream.on('end', () => {
      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  });
}
