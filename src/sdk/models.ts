export interface API {
  run: () => Promise<void>;
  format: (allEditors?: boolean) => Promise<void>;
  getShareUrl: (shortUrl?: boolean) => Promise<string>;
  getConfig: (contentOnly?: boolean) => Promise<Config>;
  setConfig: (config: Partial<Config>) => Promise<Config>;
  getCode: () => Promise<Code>;
  show: (
    panel: EditorId | Tool['name'] | 'result',
    options?: { full?: boolean; line?: number; column?: number; zoom?: Config['zoom'] },
  ) => Promise<void>;
  runTests: () => Promise<{ results: TestResult[] }>;
  /**
   * Runs a callback function when code changes.
   *
   * @deprecated Use the {@link watch} method instead.
   */
  onChange: (fn: ChangeHandler) => { remove: () => void };
  watch: WatchFn;
  exec: (command: APICommands, ...args: any[]) => Promise<{ output: any } | { error: string }>;
  destroy: () => Promise<void>;
}
/**
 * @deprecated Use the type {@link SDKCodeHandler} instead.
 */
export type ChangeHandler = SDKCodeHandler;
export type SDKReadyHandler = (data: { config: Config }) => void;
export type SDKCodeHandler = (data: { code: Code; config: Config }) => void;
export type SDKConsoleHandler = (data: { method: string; args: any[] }) => void;
export type SDKTestsHandler = (data: { results: TestResult[]; error?: string }) => void;
export type SDKGenericHandler = () => void;

export type WatchFns =
  | ((event: 'load', fn: SDKGenericHandler) => { remove: SDKGenericHandler })
  | ((event: 'ready', fn: SDKReadyHandler) => { remove: SDKGenericHandler })
  | ((event: 'code', fn: SDKCodeHandler) => { remove: SDKGenericHandler })
  | ((event: 'console', fn: SDKConsoleHandler) => { remove: SDKGenericHandler })
  | ((event: 'tests', fn: SDKTestsHandler) => { remove: SDKGenericHandler })
  | ((event: 'destroy', fn: SDKGenericHandler) => { remove: SDKGenericHandler });

export type SDKEvent = Parameters<WatchFns>[0];
export type SDKEventHandler = Parameters<WatchFns>[1];

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export type WatchFn = UnionToIntersection<WatchFns>;

export type APICommands = 'setBroadcastToken' | 'showVersion';

export interface Playground extends API {
  load: () => Promise<void>;
}

export interface EmbedOptions {
  appUrl?: string;
  params?: UrlQueryParams;
  config?: Partial<Config> | string;
  import?: string;
  lite?: boolean;
  loading?: 'lazy' | 'click' | 'eager';
  template?: TemplateName;
  view?: 'split' | 'editor' | 'result' | 'headless';
}

export interface Config extends ContentConfig, AppConfig, UserConfig {}

export interface ContentConfig {
  title: string;
  description: string;
  tags: string[];
  activeEditor: EditorId | undefined;
  languages: Array<Language | Processor> | undefined;
  markup: Editor;
  style: Editor;
  script: Editor;
  stylesheets: string[];
  scripts: string[];
  cssPreset: CssPresetId;
  processors: Processor[];
  customSettings: CustomSettings;
  imports: { [key: string]: string };
  types: Types;
  tests: Partial<Editor> | undefined;
  readonly version: string;
}

export interface AppConfig {
  readonly: boolean;
  allowLangChange: boolean;
  mode: 'full' | 'editor' | 'codeblock' | 'result';
  tools: {
    enabled: Array<Tool['name']> | 'all';
    active: Tool['name'] | '';
    status: ToolsPaneStatus;
  };
  zoom: 1 | 0.5 | 0.25;
}

export interface UserConfig extends EditorConfig, FormatterConfig {
  autoupdate: boolean;
  autosave: boolean;
  autotest: boolean;
  delay: number;
  formatOnsave: boolean;
  theme: Theme;
  recoverUnsaved: boolean;
  showSpacing: boolean;
  welcome: boolean;
}

export interface EditorConfig {
  editor: 'monaco' | 'codemirror' | 'codejar' | undefined;
  fontFamily: string | undefined;
  fontSize: number | undefined;
  useTabs: boolean;
  tabSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  closeBrackets: boolean;
  emmet: boolean;
  editorMode: 'vim' | 'emacs' | undefined;
}

export interface FormatterConfig {
  useTabs: boolean;
  tabSize: number;
  semicolons: boolean;
  singleQuote: boolean;
  trailingComma: boolean;
}

export interface UserData {
  id: string;
  data: Partial<{
    sync: {
      autosync: boolean;
      repo: string;
      lastSync: number;
    };
    deploys: {
      [key: string]: string; // projectId => repoName
    };
  }>;
}

export interface AppData {
  defaultTemplate?: string | null;
  recentTemplates?: Array<{ name: Template['name']; title: string }>;
  recentProjects?: Array<{ id: string; title: string; description: string }>;
  language?: Language;
  snippets?: {
    language: Language;
  };
  broadcast?: {
    serverUrl: string;
    userToken?: string;
  };
}

export type Language =
  | 'html'
  | 'htm'
  | 'markdown'
  | 'md'
  | 'mdown'
  | 'mkdn'
  | 'mdx'
  | 'astro'
  | 'pug'
  | 'jade'
  | 'haml'
  | 'asciidoc'
  | 'adoc'
  | 'asc'
  | 'mustache'
  | 'handlebars'
  | 'hbs'
  | 'ejs'
  | 'eta'
  | 'nunjucks'
  | 'njk'
  | 'liquid'
  | 'liquidjs'
  | 'dot'
  | 'twig'
  | 'art-template'
  | 'art'
  | 'mjml'
  | 'diagrams'
  | 'diagram'
  | 'graph'
  | 'plt'
  | 'richtext'
  | 'rte'
  | 'rich'
  | 'rte.html'
  | 'css'
  | 'scss'
  | 'sass'
  | 'less'
  | 'stylus'
  | 'styl'
  | 'stylis'
  | 'postcss'
  | 'javascript'
  | 'js'
  | 'json'
  | 'babel'
  | 'es'
  | 'sucrase'
  | 'typescript'
  | 'flow'
  | 'ts'
  | 'jsx'
  | 'tsx'
  | 'react-native'
  | 'react-native.jsx'
  | 'react-native-tsx'
  | 'react-native.tsx'
  | 'vue'
  | 'vue3'
  | 'vue2'
  | 'svelte'
  | 'stencil'
  | 'stencil.tsx'
  | 'solid'
  | 'solid.jsx'
  | 'solid.tsx'
  | 'riot'
  | 'riotjs'
  | 'malina'
  | 'malinajs'
  | 'xht'
  | 'coffeescript'
  | 'coffee'
  | 'livescript'
  | 'ls'
  | 'civet'
  | 'clio'
  | 'imba'
  | 'assemblyscript'
  | 'as'
  | 'python'
  | 'py'
  | 'pyodide'
  | 'py3'
  | 'r'
  | 'rlang'
  | 'rstats'
  | 'ruby'
  | 'rb'
  | 'ruby-wasm'
  | 'go'
  | 'wasm.rb'
  | 'rubywasm'
  | 'golang'
  | 'php'
  | 'cpp'
  | 'c'
  | 'C'
  | 'cp'
  | 'cxx'
  | 'c++'
  | 'cppm'
  | 'ixx'
  | 'ii'
  | 'hpp'
  | 'h'
  | 'clang'
  | 'clang.cpp'
  | 'perl'
  | 'pl'
  | 'pm'
  | 'lua'
  | 'teal'
  | 'tl'
  | 'fennel'
  | 'fnl'
  | 'julia'
  | 'jl'
  | 'scheme'
  | 'scm'
  | 'commonlisp'
  | 'common-lisp'
  | 'lisp'
  | 'clojurescript'
  | 'clojure'
  | 'cljs'
  | 'clj'
  | 'cljc'
  | 'edn'
  | 'rescript'
  | 'res'
  | 'resi'
  | 'reason'
  | 're'
  | 'rei'
  | 'ocaml'
  | 'ml'
  | 'mli'
  | 'tcl'
  | 'wat'
  | 'wast'
  | 'webassembly'
  | 'wasm'
  | 'Binary'
  | 'csharp'
  | 'sql'
  | 'sqlite'
  | 'sqlite3'
  | 'prolog.pl'
  | 'prolog'
  | 'blockly'
  | 'blockly.xml'
  | 'xml'
  | 'pintora';

export interface Editor {
  language: Language;
  content?: string;
  contentUrl?: string;
  selector?: string;
  position?: EditorPosition;
}

export interface EditorPosition {
  lineNumber: number;
  column?: number;
}

export type EditorId = 'markup' | 'style' | 'script';

export interface Editors {
  markup: CodeEditor;
  style: CodeEditor;
  script: CodeEditor;
}
export interface EditorLanguages {
  markup: Language;
  style: Language;
  script: Language;
}

export interface Types {
  [key: string]:
    | string
    | {
        url: string;
        declareAsModule?: boolean;
        autoload?: boolean;
      };
}

export interface LanguageSpecs {
  name: Language;
  title: string;
  longTitle?: string;
  info?: boolean;
  parser?: Parser;
  formatter?: LanguageFormatter;
  compiler: Compiler | Language;
  extensions: Language[];
  editor: EditorId;
  editorLanguage?: Language;
  preset?: CssPresetId;
  largeDownload?: boolean;
}

export interface ProcessorSpecs {
  name: Processor;
  title: string;
  longTitle?: string;
  info?: string;
  isPostcssPlugin: boolean;
  needsHTML?: boolean;
  compiler: {
    url: string;
    factory: (
      config: Config,
      baseUrl: string,
      options: CompileOptions,
    ) => CompilerFunction | CompilerFunction[];
  };
  editor: EditorId;
  hidden?: boolean;
}

export type Processor =
  | 'postcss'
  | 'postcssImportUrl'
  | 'tailwindcss'
  | 'windicss'
  | 'unocss'
  | 'tokencss'
  | 'lightningcss'
  | 'autoprefixer'
  | 'postcssPresetEnv'
  | 'cssmodules'
  | 'purgecss'
  | 'cssnano';

export type ParserName =
  | 'babel'
  | 'babel-ts'
  | 'babel-flow'
  | 'glimmer'
  | 'html'
  | 'markdown'
  | 'css'
  | 'scss'
  | 'less'
  | 'php'
  | 'pug';

export interface Parser {
  name: ParserName;
  plugins?: any[];
  pluginUrls: string[];
}
export type FormatFn = (
  value: string,
  cursorOffset: number,
  formatterConfig?: Partial<FormatterConfig>,
) => Promise<{ formatted: string; cursorOffset: number }>;

export interface LanguageFormatter {
  factory: (baseUrl: string, language: Language) => FormatFn;
}

export type CssPresetId = '' | 'normalize.css' | 'reset-css';

export interface CssPreset {
  id: CssPresetId;
  name: string;
  url: string;
}

export interface EditorLibrary {
  filename: string;
  content: string;
}

export interface CompileOptions {
  html?: string;
  blockly?: BlocklyContent;
  forceCompile?: boolean;
  compileInfo?: CompileInfo;
}

export interface CompileInfo {
  cssModules?: Record<string, string>;
  modifiedHTML?: string;
  importedContent?: string;
  imports?: Record<string, string>;
}

export interface CompileResult {
  code: string;
  info: CompileInfo;
}

export type CompilerFunction = (
  code: string,
  {
    config,
    language,
    baseUrl,
    options,
    worker,
  }: {
    config: Config;
    language: Language | Processor;
    baseUrl: string;
    options: CompileOptions;
    worker?: Worker;
  },
) => Promise<string | CompileResult>;

export interface Compiler {
  dependencies?: Language[];
  url?: string;
  fn?: CompilerFunction;
  factory: (config: Config, baseUrl: string) => CompilerFunction;
  runOutsideWorker?: CompilerFunction;
  editors?: EditorId[];
  styles?:
    | string[]
    | ((options: { compiled: string; baseUrl: string; config: Config }) => string[]);
  scripts?:
    | string[]
    | ((options: { compiled: string; baseUrl: string; config: Config }) => string[]);
  deferScripts?: boolean;
  inlineScript?: string | ((options: { baseUrl: string }) => Promise<string>);
  scriptType?:
    | 'module'
    | 'text/liquid'
    | 'text/python'
    | 'text/r'
    | 'text/ruby-wasm'
    | 'text/x-uniter-php'
    | 'text/cpp'
    | 'text/perl'
    | 'text/julia'
    | 'text/biwascheme'
    | 'text/commonlisp'
    | 'text/tcl'
    | 'text/prolog'
    | 'application/json'
    | 'application/lua'
    | 'text/fennel'
    | 'application/wasm-uint8';
  liveReload?: boolean;
  aliasTo?: Language;
  compiledCodeLanguage?: Language;
  imports?: { [key: string]: string };
  types?: Types;
}

export interface Compilers {
  [language: string]: Compiler;
}

export type Template = Pick<ContentConfig, 'title' | 'markup' | 'style' | 'script'> &
  Partial<ContentConfig> & {
    name: TemplateName;
    thumbnail: string;
    tools?: Config['tools'];
    autotest?: Config['autotest'];
  };

export type TemplateName =
  | 'blank'
  | 'javascript'
  | 'typescript'
  | 'react'
  | 'react-native'
  | 'vue2'
  | 'vue'
  | 'angular'
  | 'preact'
  | 'svelte'
  | 'stencil'
  | 'solid'
  | 'mdx'
  | 'astro'
  | 'riot'
  | 'malina'
  | 'jquery'
  | 'backbone'
  | 'knockout'
  | 'jest'
  | 'jest-react'
  | 'bootstrap'
  | 'tailwindcss'
  | 'coffeescript'
  | 'livescript'
  | 'civet'
  | 'clio'
  | 'imba'
  | 'rescript'
  | 'reason'
  | 'ocaml'
  | 'python'
  | 'pyodide'
  | 'r'
  | 'ruby'
  | 'ruby-wasm'
  | 'go'
  | 'php'
  | 'cpp'
  | 'clang'
  | 'perl'
  | 'lua'
  | 'teal'
  | 'fennel'
  | 'julia'
  | 'scheme'
  | 'commonlisp'
  | 'clojurescript'
  | 'tcl'
  | 'markdown'
  | 'assemblyscript'
  | 'wat'
  | 'sql'
  | 'prolog'
  | 'blockly'
  | 'diagrams';

export interface Tool {
  name: 'console' | 'compiled' | 'tests';
  title: 'Console' | 'Compiled' | 'Tests';
  load: () => Promise<void>;
  onActivate: () => void;
  onDeactivate: () => void;
  getEditor?: () => CodeEditor | undefined;
}

export type ToolsPaneStatus = 'closed' | 'open' | 'full' | 'none' | '';

export type ToolList = Array<{
  name: Tool['name'];
  factory: (
    config: Config,
    baseUrl: string,
    editors: Editors,
    eventsManager: EventsManager,
    isEmbed: boolean,
    runTests: () => Promise<void>,
  ) => Tool;
}>;

export interface Console extends Tool {
  title: 'Console';
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  table: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  clear: (silent?: boolean) => void;
  // filterLog: (filter: string) => void;
  evaluate: (code: string) => void;
  reloadEditor: (config: Config) => Promise<void>;
}

export interface CompiledCodeViewer extends Tool {
  title: 'Compiled';
  update: (language: Language, content: string, label?: string | undefined) => void;
  reloadEditor: (config: Config) => Promise<void>;
}

export interface TestViewer extends Tool {
  title: 'Tests';
  showResults: ({ results, error }: { results: TestResult[]; error?: string }) => void;
  resetTests: () => void;
  clearTests: () => void;
}

export interface ToolsPane {
  load: () => Promise<void>;
  open: () => void;
  close: () => void;
  maximize: () => void;
  hide: () => void;
  getStatus: () => ToolsPaneStatus;
  getActiveTool: () => Tool['name'];
  setActiveTool: (name: Tool['name']) => void;
  disableTool: (name: Tool['name']) => void;
  enableTool: (name: Tool['name']) => void;
  console?: Console;
  compiled?: CompiledCodeViewer;
  tests?: TestViewer;
}

export interface CodeEditor {
  getValue: () => string;
  setValue: (value?: string, newState?: boolean) => void;
  getLanguage: () => Language;
  setLanguage: (language: Language, value?: string) => void;
  getEditorId: () => string;
  focus: () => void;
  getPosition: () => EditorPosition;
  setPosition: (position: EditorPosition) => void;
  layout?: () => void;
  addTypes?: (lib: EditorLibrary, force?: boolean) => any;
  onContentChanged: (callback: () => void) => void;
  addKeyBinding: (label: string, keybinding: any, callback: () => void) => void;
  keyCodes: {
    CtrlEnter: any;
    ShiftEnter: any;
    Enter: any;
    UpArrow: any;
    DownArrow: any;
    ShiftAltF: any;
  };
  changeSettings: (editorSettings: EditorConfig) => void;
  registerFormatter: (formatFn: FormatFn | undefined) => void;
  format: () => Promise<void>;
  isReadonly: boolean;
  setTheme: (theme: Theme) => void;
  undo: () => void;
  redo: () => void;
  destroy: () => void;
  monaco?: any;
  codemirror?: any;
  prism?: any;
  codejar?: any;
  isFake?: boolean;
}

export interface EditorOptions extends EditorConfig {
  baseUrl: string;
  container: HTMLElement | null;
  language: Language;
  value: string;
  mode?: Config['mode'];
  readonly: boolean;
  editorId:
    | EditorId
    | 'compiled'
    | 'console'
    | 'customSettings'
    | 'editorSettings'
    | 'tests'
    | 'embed'
    | 'snippet'
    | 'add-snippet';
  theme: Theme;
  isEmbed: boolean;
  isHeadless: boolean;
  getLanguageExtension: (alias: string) => Language | undefined;
  mapLanguage: (language: Language) => Language;
  getFormatterConfig: () => Partial<FormatterConfig>;
  getFontFamily: (font: string | undefined) => string;
}

export interface CustomEditor {
  language: Language;
  show: (show: boolean, options: CustomEditorOptions) => Promise<void>;
  getContent: (options: CustomEditorOptions) => Promise<unknown>;
  setTheme: (theme: Theme) => void;
}

export interface CustomEditorOptions {
  baseUrl: string;
  editors: Editors;
  config: Config;
  html: string;
  eventsManager: EventsManager;
}

export type CustomEditors = {
  [key in Language]?: CustomEditor;
};

export interface BlocklyContent {
  xml?: string;
  js?: string;
}

export interface User {
  uid: string;
  token: string | null;
  displayName: string | null;
  username: string | null;
  email: string | null;
  photoURL: string | null;
}

export type GithubScope = 'gist' | 'repo' | 'public_repo';

export interface ShareData {
  url: string;
  title: string;
}

export interface Screen {
  screen:
    | 'login'
    | 'info'
    | 'new'
    | 'open'
    | 'assets'
    | 'add-asset'
    | 'snippets'
    | 'add-snippet'
    | 'import'
    | 'resources'
    | 'share'
    | 'embed'
    | 'deploy'
    | 'sync'
    | 'backup'
    | 'broadcast'
    | 'welcome'
    | 'about'
    | 'custom-settings'
    | 'editor-settings'
    | 'test-editor';
  show: (options?: any) => void | Promise<unknown>;
}

export type CustomSettings = Partial<
  {
    [key in Language | Processor]: any;
  } & {
    template: {
      data?: any;
      prerender?: boolean;
    };
    scriptType:
      | 'module'
      | 'application/javascript'
      | 'application/ecmascript'
      | 'text/javascript'
      | 'text/ecmascript'
      | ''
      | Compiler['scriptType'];
    mapImports: boolean;
    imports: Record<string, string>;
    convertCommonjs: boolean;
    defaultCDN: CDN;
    types: Types;
    head: string;
    htmlClasses: string;
  }
>;

export type CDN =
  | 'jspm'
  | 'skypack'
  | 'jsdelivr'
  | 'fastly.jsdelivr'
  | 'jsdelivr.gh'
  | 'fastly.jsdelivr.gh'
  | 'esm.run'
  | 'esm.sh'
  | 'esbuild'
  | 'bundle.run'
  | 'unpkg'
  | 'statically';

export type EditorCache = Editor & {
  compiled: string;
  modified?: string;
};

export type Cache = ContentConfig & {
  markup: EditorCache;
  style: EditorCache;
  script: EditorCache;
  tests?: EditorCache;
  result?: string;
  styleOnlyUpdate?: boolean;
};

export interface Code {
  markup: {
    language: Language;
    content: string;
    compiled: string;
  };
  style: {
    language: Language;
    content: string;
    compiled: string;
  };
  script: {
    language: Language;
    content: string;
    compiled: string;
  };
  result: string;
}

export type Theme = 'light' | 'dark';

export type Await<T> = T extends PromiseLike<infer U> ? U : T;

export type FileType =
  | 'image'
  | 'audio'
  | 'video'
  | 'archive'
  | 'html'
  | 'stylesheet'
  | 'script'
  | 'font'
  | 'icon'
  | 'json'
  | 'csv'
  | 'xml'
  | 'text'
  | 'other';

export interface Asset {
  id: string;
  filename: string;
  type: FileType;
  url: string;
  lastModified: number;
}

export interface Snippet {
  id: string;
  title: string;
  description: string;
  language: Language;
  code: string;
  lastModified: number;
}

export interface EventsManager {
  addEventListener: (
    element: HTMLElement | Document | Window | FileReader | null,
    eventType: string,
    fn: (event: Event | KeyboardEvent | MouseEvent | MessageEvent) => void,
    _options?: any,
  ) => void;
  removeEventListener: (
    element: HTMLElement | Document | Window | FileReader | null,
    eventType: string,
    fn: (event: Event | KeyboardEvent | MouseEvent | MessageEvent) => void,
  ) => void;
  removeEventListeners: () => void;
}

export interface TestResult {
  duration: number;
  errors: string[];
  status: 'pass' | 'fail' | 'skip';
  testPath: string[];
}

export interface Subscribable<T> {
  subscribe: (fn: (data: T) => void) => { unsubscribe: () => void };
  unsubscribeAll: () => void;
}

export type languageSelector = `${Language}-selector`;
export type ToolNames =
  | `${Tool['name']}`
  | `${Tool['name']},${Tool['name']}`
  | `${Tool['name']},${Tool['name']},${Tool['name']}`;
export type ToolsStatus = `${ToolNames}|${Config['tools']['status']}`;

export type UrlQueryParams = Partial<
  EmbedOptions &
    Omit<
      Config,
      'activeEditor' | 'languages' | 'tags' | 'processors' | 'stylesheets' | 'scripts' | 'tools'
    > &
    Pick<Screen, 'screen'> & { new: '' } & { [key in Language]: string } & {
      [key in languageSelector]: string;
    } & {
      config: string;
      embed: boolean;
      preview: boolean;
      x: string;
      raw: Language;
      language: Language;
      lang: Language;
      languages: string; // comma-separated languages
      processors: string; // comma-separated processors
      stylesheets: string; // comma-separated stylesheets
      scripts: string; // comma-separated scripts
      activeEditor: EditorId | 0 | 1 | 2;
      active: EditorId | 0 | 1 | 2;
      tags: string | string[];
      'no-defaults': boolean;
      scrollPosition: boolean;
      disableAI: boolean;
      tools: 'open' | 'full' | 'closed' | 'console' | 'compiled' | 'tests' | 'none' | ToolsStatus;
    } & {
      [key in Tool['name']]: 'open' | 'full' | 'closed' | 'none' | '' | 'true';
    }
>;

export interface CustomEvents {
  getConfig: 'livecodes-get-config';
  config: 'livecodes-config';
  load: 'livecodes-load';
  appLoaded: 'livecodes-app-loaded';
  ready: 'livecodes-ready';
  change: 'livecodes-change';
  testResults: 'livecodes-test-results';
  console: 'livecodes-console';
  destroy: 'livecodes-destroy';
  resizeEditor: 'livecodes-resize-editor';
  apiResponse: 'livecodes-api-response';
}

export interface PkgInfo {
  name: string;
  description?: string;
  version?: string;
  repository?: {
    url?: string;
  };
  repo?: string;
  homepage?: string;
}

export interface APIError {
  error: boolean;
  status?: number;
  message?: string;
}

export interface CDNService {
  search: (query: string, limit?: number) => Promise<PkgInfo[] | APIError>;
  getPkgInfo: (pkgName: string) => Promise<PkgInfo | APIError>;
  getPkgFiles: (pkgName: string) => Promise<{ default?: string; files: string[] } | APIError>;
  getPkgDefaultFiles: (pkgName: string) => Promise<{ js?: string; css?: string } | APIError>;
}

export interface WorkerMessageEvent<T, K = unknown> extends MessageEvent {
  data: {
    messageId: string;
    method: T;
    args?: any;
    data?: K;
  };
}
