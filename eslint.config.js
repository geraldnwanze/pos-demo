import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // React Compiler is not enabled in this project; these are advisory hints.
      // Resetting local state when a dialog opens is an intentional, safe pattern here.
      'react-hooks/set-state-in-effect': 'warn',
      // shadcn/ui components export variant helpers (cva) alongside the component,
      // which only affects Fast Refresh granularity, not correctness.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // React Hook Form's watch()/register() are intentionally used; this rule only
      // matters when the (not-enabled) React Compiler is in play.
      'react-hooks/incompatible-library': 'off',
    },
  },
])
