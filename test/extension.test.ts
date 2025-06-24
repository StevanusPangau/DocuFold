import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '@/extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('docufold.docufold'));
  });

  test('Should activate', async () => {
    const extension = vscode.extensions.getExtension('docufold.docufold');
    assert.ok(extension);

    await extension!.activate();
    assert.strictEqual(extension!.isActive, true);
  });

  test('Should register all commands', async () => {
    const commands = await vscode.commands.getCommands(true);

    const expectedCommands = ['docufold.toggleAutoFold', 'docufold.foldAllDocstrings', 'docufold.unfoldAllDocstrings', 'docufold.foldCurrentDocstring', 'docufold.unfoldCurrentDocstring'];

    expectedCommands.forEach((cmd) => {
      assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
    });
  });

  test('Extension activation function exists', () => {
    assert.ok(typeof myExtension.activate === 'function');
  });

  test('Extension deactivation function exists', () => {
    assert.ok(typeof myExtension.deactivate === 'function');
  });
});
