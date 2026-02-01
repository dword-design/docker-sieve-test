import { expect, test } from '@playwright/test';
import endent from 'endent';
import { execa, execaCommand } from 'execa';
import outputFiles from 'output-files';

/**
 * Otherwise error in GitHub Actions:
 * sieve-test: Error: sieve: file storage: Failed to stat sieve storage path: stat(test.sieve) in directory /test failed: Permission denied (euid=1000(testuser) egid=1000(testuser) missing +x perm: /test, dir owned by 1001:118 mode=0700)
 */
const fixGitHubActionsPermissions = ({ cwd = '.' }: { cwd: string }) =>
  execaCommand('chmod +x .', { cwd });

test('keep @usesdocker', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'test.eml': endent`
      From: Foo <foo@bar.de>
      Subject: Test PR Run

      This is a test email body.\n
    `,
    'test.sieve': endent`
      if address :is "From" "test@bar.de" {
        discard;
      }\n
    `,
  });

  await fixGitHubActionsPermissions({ cwd });

  const { stdout } = await execa(
    'docker',
    ['run', '--rm', '-v', `${cwd}:/test`, 'self', 'test.sieve', 'test.eml'],
    { cwd },
  );

  expect(stdout).toEqual(endent`
    \nPerformed actions:

      (none)

    Implicit keep:

     * store message in folder: INBOX\n
  `);
});

test('discard @usesdocker', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'test.eml': endent`
      From: Foo <foo@bar.de>
      Subject: Test PR Run

      This is a test email body.\n
    `,
    'test.sieve': endent`
      if address :is "From" "foo@bar.de" {
        discard;
      }\n
    `,
  });

  await fixGitHubActionsPermissions({ cwd });

  const { stdout } = await execa(
    'docker',
    ['run', '--rm', '-v', `${cwd}:/test`, 'self', 'test.sieve', 'test.eml'],
    { cwd },
  );

  expect(stdout).toEqual(endent`
    \nPerformed actions:

     * discard

    Implicit keep:

      (none)\n
  `);
});

test('spamtest @usesdocker', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'test.eml': endent`
      From: Foo <foo@bar.de>
      Subject: Test

      This is a test email body.\n
    `,
    'test.sieve': 'require ["spamtest"];\n',
  });

  await fixGitHubActionsPermissions({ cwd });

  await execa(
    'docker',
    ['run', '--rm', '-v', `${cwd}:/test`, 'self', 'test.sieve', 'test.eml'],
    { cwd },
  );
});
