// @ts-check
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow all standard types + project-specific ones
    'type-enum': [
      2,
      'always',
      [
        'feat', 'fix', 'docs', 'style', 'refactor',
        'perf', 'test', 'build', 'ci', 'chore', 'revert',
        'merge', 'review', 'data', 'pipeline', 'deploy',
      ],
    ],
    // Subject can use Portuguese characters and dashes
    'subject-case': [0],
    // No trailing period in subject line
    'subject-full-stop': [2, 'never', '.'],
    // Body and footer can be long (data pipelines have verbose provenance)
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
    // No blank line required before footer (signature goes at end)
    'footer-leading-blank': [0],
  },
};
