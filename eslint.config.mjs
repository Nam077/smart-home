// eslint.config.mjs
import globals from 'globals';
import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import lodashPlugin from 'eslint-plugin-lodash';
import promisePlugin from 'eslint-plugin-promise';
import sortClassMembers from 'eslint-plugin-sort-class-members';

export default [
    eslint.configs.recommended,
    {
        ignores: ['dist/**', 'node_modules/**', 'eslint.config.*', 'src/modules/i18n/i18n.generated.ts'],
    },

    // TypeScript configurations
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: process.cwd(),
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                ...globals.node,
                ...globals.browser,
                module: 'readonly',
                require: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...tsPlugin.configs.strict.rules,
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-extraneous-class': 'off',
            '@typescript-eslint/method-signature-style': ['error', 'property'],
            //

            // TypeScript Naming Conventions
            '@typescript-eslint/naming-convention': [
                'error',
                // 1. Interface: Must start with 'I' and be PascalCase
                {
                    selector: 'interface',
                    format: ['PascalCase'],
                    custom: {
                        regex: '^I[A-Z]',
                        match: true,
                    },
                },
                // 2. Type Alias: Ends with 'Type' and be PascalCase
                {
                    selector: 'typeAlias',
                    format: ['PascalCase'],
                    custom: {
                        regex: 'Type$',
                        match: true,
                    },
                },
                // 3. Enum: Ends with 'Enum' and be PascalCase
                {
                    selector: 'enum',
                    format: ['PascalCase'],
                    custom: {
                        regex: 'Enum$',
                        match: true,
                    },
                },
                // 4. Enum Members: PascalCase
                {
                    selector: 'enumMember',
                    format: ['PascalCase', 'UPPER_CASE'],
                },
                // 5. Classes: PascalCase
                {
                    selector: 'class',
                    format: ['PascalCase'],
                },
                // 6. Functions and Methods: camelCase
                {
                    selector: 'function',
                    format: ['camelCase'],
                },
                {
                    selector: 'method',
                    format: ['camelCase'],
                },
                // 7. Variables (const): UPPER_CASE or camelCase or PascalCase
                {
                    selector: 'variable',
                    modifiers: ['const'],
                    format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
                    leadingUnderscore: 'allow',
                },
                // 8. Parameters: camelCase, allow leading underscore
                {
                    selector: 'parameter',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                // 9. Class Members (public): camelCase
                {
                    selector: 'memberLike',
                    modifiers: ['public'],
                    format: ['camelCase'],
                    leadingUnderscore: 'forbid',
                },
                // 10. Class Members (private): camelCase, allow leading underscore
                {
                    selector: 'memberLike',
                    modifiers: ['private'],
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                // 11. Properties: camelCase or UPPER_CASE
                {
                    selector: 'property',
                    format: ['camelCase', 'UPPER_CASE'],
                },
                // 12. Accessors: camelCase starting with 'get' or 'set'
                {
                    selector: 'accessor',
                    format: ['camelCase'],
                    custom: {
                        regex: '^(get|set)[A-Z]',
                        match: true,
                    },
                },
                // 13. Booleans: Start with 'is', 'has', or 'should'
                {
                    selector: 'variable',
                    types: ['boolean'],
                    format: ['camelCase'],
                    custom: {
                        regex: '^(is|has|should)[A-Z]',
                        match: true,
                    },
                },
                {
                    selector: 'typeParameter',
                    format: ['PascalCase'],
                    custom: {
                        regex: '^[A-Z][A-Za-z0-9]*$',
                        match: true,
                    },
                },
            ],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    disallowTypeAnnotations: false,
                },
            ],

            '@typescript-eslint/consistent-type-exports': [
                'error',
                {
                    fixMixedExportsWithInlineTypeSpecifier: true, // Tự động sửa lỗi khi có mixed exports
                },
            ],
        },
    },

    // Plugins and additional rules
    {
        plugins: {
            import: importPlugin,
            'unused-imports': unusedImportsPlugin,
            security: securityPlugin,
            sonarjs: sonarjsPlugin,
            jsdoc: jsdocPlugin,
            lodash: lodashPlugin,
            promise: promisePlugin,
            prettier: prettierPlugin,
            'sort-class-members': sortClassMembers,
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
            },
        },
        rules: {
            // Prettier Integration
            'prettier/prettier': 'error',
            //
            'sort-class-members/sort-class-members': [
                2,
                {
                    order: [
                        '[static-properties]',
                        '[static-methods]',
                        '[properties]',
                        '[conventional-private-properties]',
                        'constructor',
                        '[methods]',
                        '[conventional-private-methods]',
                    ],
                    accessorPairPositioning: 'getThenSet',
                },
            ],
            // Import Rules
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object'],
                    pathGroups: [
                        {
                            pattern: '@/**',
                            group: 'internal',
                            position: 'before',
                        },
                    ],
                    pathGroupsExcludedImportTypes: ['builtin'],
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                    'newlines-between': 'always',
                },
            ],
            'import/no-unresolved': 'error',
            'import/newline-after-import': 'error',

            // Unused Imports
            'no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            // Security Plugin Rules
            'security/detect-object-injection': 'off',
            'security/detect-non-literal-fs-filename': 'warn',
            'security/detect-eval-with-expression': 'error',
            'security/detect-unsafe-regex': 'warn',

            // SonarJS Plugin Rules
            'sonarjs/no-duplicate-string': 'warn',
            'sonarjs/cognitive-complexity': ['warn', 15],
            'sonarjs/no-identical-functions': 'warn',
            'sonarjs/no-redundant-jump': 'error',

            // Lodash Plugin Rules
            'lodash/prefer-lodash-method': 'warn',
            'lodash/prop-shorthand': 'warn',
            'lodash/prefer-compact': 'warn',
            'lodash/prefer-is-nil': 'warn',

            // JSDoc Plugin Rules
            'jsdoc/check-access': 'warn', // Recommended
            'jsdoc/check-alignment': 'warn', // Recommended
            'jsdoc/check-param-names': 'warn', // Recommended
            'jsdoc/check-property-names': 'warn', // Recommended
            'jsdoc/check-tag-names': 'warn', // Recommended
            'jsdoc/check-types': 'warn', // Recommended
            'jsdoc/check-values': 'warn', // Recommended
            'jsdoc/empty-tags': 'warn', // Recommended
            'jsdoc/implements-on-classes': 'warn', // Recommended
            'jsdoc/multiline-blocks': 'warn', // Recommended
            'jsdoc/no-multi-asterisks': 'warn', // Recommended
            'jsdoc/no-undefined-types': 'warn', // Recommended
            'jsdoc/require-jsdoc': 'warn', // Recommended
            'jsdoc/require-param': 'warn', // Recommended
            'jsdoc/require-param-description': 'warn', // Recommended
            'jsdoc/require-param-name': 'warn', // Recommended
            'jsdoc/require-param-type': 'warn', // Enforce types in @param
            'jsdoc/require-property': 'warn', // Recommended
            'jsdoc/require-property-description': 'warn', // Recommended
            'jsdoc/require-property-name': 'warn', // Recommended
            'jsdoc/require-property-type': 'warn', // Enforce types in @property
            'jsdoc/require-returns': 'warn', // Recommended
            'jsdoc/require-returns-check': 'warn', // Recommended
            'jsdoc/require-returns-description': 'warn', // Recommended
            'jsdoc/require-returns-type': 'warn', // Enforce types in @returns
            'jsdoc/require-yields': 'warn', // Recommended
            'jsdoc/require-yields-check': 'warn', // Recommended
            'jsdoc/tag-lines': [
                'error',
                'any',
                {
                    startLines: 1,
                },
            ],
            'jsdoc/valid-types': 'warn', // Recommended

            // Additional rules adjusted for TypeScript
            'jsdoc/check-examples': 'off', // Disable if not using @example tags
            'jsdoc/check-indentation': 'warn',
            'jsdoc/check-line-alignment':  1,
            'jsdoc/check-template-names': 'warn',
            'jsdoc/check-syntax': 'warn',
            'jsdoc/informative-docs': 'off',
            'jsdoc/match-description': 'off',
            'jsdoc/no-bad-blocks': 'warn',
            'jsdoc/no-blank-block-descriptions': 'warn',
            'jsdoc/no-defaults': 'warn',
            'jsdoc/no-missing-syntax': 'off',
            'jsdoc/no-restricted-syntax': 'off',
            'jsdoc/no-types': 'off', // Ensure types are allowed
            'jsdoc/require-asterisk-prefix': 'warn',
            'jsdoc/require-description': 'warn',
            'jsdoc/require-description-complete-sentence': 'warn',
            'jsdoc/require-example': 'off',
            'jsdoc/require-file-overview': 'off',
            'jsdoc/require-hyphen-before-param-description': ['warn', 'always'],
            'jsdoc/require-template': 'warn',
            'jsdoc/require-throws': 'warn',
            'jsdoc/sort-tags': 'off',
            "jsdoc/text-escaping": ["error", { "escapeMarkdown": true }],
            // Promise Plugin Rules
            'promise/always-return': 'error',
            'promise/no-return-wrap': 'error',
            'promise/param-names': 'error',
            'promise/catch-or-return': 'error',
            'promise/no-native': 'off',
            'promise/no-nesting': 'warn',
            'promise/no-promise-in-callback': 'warn',
            'promise/no-callback-in-promise': 'warn',
            'promise/avoid-new': 'warn',
            'promise/no-new-statics': 'error',
            'promise/no-return-in-finally': 'warn',
            'promise/valid-params': 'warn',
            'promise/no-multiple-resolved': 'error',

            // Formatting and Spacing
            'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
            'padding-line-between-statements': [
                'error',
                { blankLine: 'any', prev: 'export', next: 'export' },
                { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
                { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
                { blankLine: 'always', prev: '*', next: ['function', 'multiline-const', 'multiline-block-like'] },
                { blankLine: 'always', prev: ['function', 'multiline-const', 'multiline-block-like'], next: '*' },
                { blankLine: 'always', prev: '*', next: 'function' },
                { blankLine: 'always', prev: 'function', next: '*' },
                { blankLine: 'always', prev: '*', next: 'class' },
                { blankLine: 'always', prev: 'block', next: '*' },
                { blankLine: 'always', prev: '*', next: 'return' },
            ],
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            'object-curly-spacing': ['error', 'always'],
            'no-trailing-spaces': 'error',
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
        },
    },

    // Test files configuration
    {
        files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
            },
        },
    },
];
