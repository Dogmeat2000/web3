import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'
import { defineConfig, globalIgnores } from 'eslint/config'

// Based on the ESLint setup of the client in https://github.com/olehougaard/yahtzee-functional
export default defineConfig([
  globalIgnores(['**/dist/**', '**/coverage/**']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },

  // Turns off the rules oxlint already checks, as the lint script runs oxlint first:
  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  // Leaves formatting to Prettier:
  skipFormatting,
])
