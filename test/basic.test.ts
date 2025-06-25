import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Basic Extension Test', () => {
  test('VSCode API is available', () => {
    assert.ok(vscode);
    assert.ok(vscode.window);
    assert.ok(vscode.commands);
  });

  test('Extension can be found', () => {
    const extension = vscode.extensions.getExtension('docufold.docufold');
    assert.ok(extension, 'Extension should be found');
  });

  test('Extension can be activated', async () => {
    const extension = vscode.extensions.getExtension('docufold.docufold');
    if (extension && !extension.isActive) {
      await extension.activate();
    }
    assert.ok(extension?.isActive, 'Extension should be active');
  });

  test('Commands are registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    const docufoldCommands = commands.filter(cmd => cmd.startsWith('docufold.'));

    assert.ok(docufoldCommands.length > 0, 'Should have DocuFold commands registered');

    const expectedCommands = [
      'docufold.toggleAutoFold',
      'docufold.foldAllDocstrings',
      'docufold.unfoldAllDocstrings',
      'docufold.foldCurrentDocstring',
      'docufold.unfoldCurrentDocstring',
    ];

    expectedCommands.forEach(cmd => {
      assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
    });
  });
});
