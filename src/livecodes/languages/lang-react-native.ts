import { LanguageSpecs } from '../models';
import { vendorsBaseUrl } from '../vendors';
import { typescriptOptions } from './lang-typescript';
import { parserPlugins } from './prettier';
import { getLanguageCustomSettings } from './utils';

export const reactNativeWebUrl = vendorsBaseUrl + 'react-native-web/react-native-web.js';

export const reactNative: LanguageSpecs = {
  name: 'react-native',
  title: 'RN',
  longTitle: 'React Native',
  parser: {
    name: 'babel',
    pluginUrls: [parserPlugins.babel, parserPlugins.html],
  },
  compiler: {
    dependencies: ['typescript'],
    factory: () => async (code, { config, language }) =>
      (window as any).ts.transpile(code, {
        ...typescriptOptions,
        ...getLanguageCustomSettings('typescript', config),
        ...getLanguageCustomSettings(language, config),
      }),
    imports: {
      react: reactNativeWebUrl,
      'react-native': reactNativeWebUrl,
    },
  },
  extensions: ['react-native.jsx'],
  editor: 'script',
  editorLanguage: 'javascript',
};
