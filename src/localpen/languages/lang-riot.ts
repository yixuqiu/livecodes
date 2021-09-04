import { LanguageSpecs } from '../models';
import { parserPlugins } from './prettier';
import { getLanguageCustomSettings } from './utils';

const compilerCdnUrl = 'https://cdn.jsdelivr.net/npm/riot@6.0.3/riot+compiler.min.js';
const cdnUrl = 'https://cdn.jsdelivr.net/npm/riot@6.0.3/riot.min.js';

export const riot: LanguageSpecs = {
  name: 'riot',
  title: 'Riot.js',
  info: `
  <h3>Riot.js</h3>
  <div>Simple and elegant component-based UI library.</div>
  <ul>
    <li><a href="https://riot.js.org/" target="_blank" rel="noopener">Riot.js official website</a></li>
    <li><a href="https://riot.js.org/documentation/" target="_blank" rel="noopener">Riot.js documentation</a></li>
    <!-- <li><a href="#">Riot.js usage in LocalPen</a></li> -->
    <li><a href="?template=riot" target="_parent" data-template="riot">Load starter template</a></li>
  </ul>
  `,
  parser: {
    name: 'html',
    pluginUrls: [parserPlugins.babel, parserPlugins.html],
  },
  compiler: {
    url: compilerCdnUrl,
    factory: () => async (code, { config }) => {
      if (!code) return '';
      const result = await (window as any).riot.compileFromString(code, {
        ...getLanguageCustomSettings('riot', config),
      });
      const compiled: string = result.code;
      const tagName = /^(?: *'name': (\S+))/gm.exec(compiled)?.[1] || "'app'";
      return `var Component = ${compiled.replace('export default ', '')}
riot.register(${tagName}, Component);
riot.mount(${tagName});
`;
    },
    scripts: [cdnUrl],
    scriptType: 'module',
  },
  extensions: ['riot'],
  editor: 'script',
  editorLanguage: 'html',
};
