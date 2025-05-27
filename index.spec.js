import { expect } from '@playwright/test';
import dedent from 'dedent';
import { execa, execaCommand } from 'execa';
import outputFiles from 'output-files';
import { test } from 'playwright-local-tmp-dir';

test.beforeAll(() =>
  execaCommand('docker build --file index.dockerfile --tag self .'),
);

test('keep @usesdocker', async () => {
  await outputFiles({
    'test.eml': dedent`
      From: Foo <foo@bar.de>
      Subject: Test PR Run

      This is a test email body.\n
    `,
    'test.sieve': dedent`
      require ["fileinto"];

      if address :is "from" "test" {
        discard;
      }\n
    `,
  });

  const { stdout } = await execa('docker', [
    'run',
    '--rm',
    '-v',
    `${process.cwd()}:/test`,
    'self',
    'test.sieve',
    'test.eml',
  ]);

  expect(stdout).toEqual(dedent`
    \nPerformed actions:

      (none)

    Implicit keep:

     * store message in folder: INBOX\n
  `);
});

test('discard @usesdocker', async () => {
  await outputFiles({
    'test.eml': dedent`
      From: Renovate Bot <renovate[bot]@users.noreply.github.com>
      Subject: Test PR Run

      This is a test email body.\n
    `,
    'test.sieve': dedent`
      require ["fileinto"];

      if address :is "from" "Renovate Bot <renovate[bot]@users.noreply.github.com>" {
        discard;
      }\n
    `,
  });

  const { stdout } = await execa('docker', [
    'run',
    '--rm',
    '-v',
    `${process.cwd()}:/test`,
    'self',
    'test.sieve',
    'test.eml',
  ]);

  expect(stdout).toEqual(dedent`
    \nPerformed actions:

     * discard

    Implicit keep:

      (none)\n
  `);
});
