// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: [
      'app/(main)/admin/**/*.{ts,tsx}',
      'src/features/*/admin/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/src/features/*/user/**'],
              message:
                'Nhánh admin không được import trực tiếp từ nhánh user; hãy chuyển phần dùng chung vào shared.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'app/(main)/user/**/*.{ts,tsx}',
      'src/features/*/user/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/src/features/*/admin/**'],
              message:
                'Nhánh user không được import trực tiếp từ nhánh admin; hãy chuyển phần dùng chung vào shared.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/*/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/src/features/*/admin/**',
                '@/src/features/*/user/**',
              ],
              message:
                'Nhánh shared không được phụ thuộc vào admin hoặc user.',
            },
          ],
        },
      ],
    },
  },
]);
