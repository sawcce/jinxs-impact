import { join, parse } from '@/path.ts';
import { colors } from '@/cliffy.ts';

import { METHOD, Methods } from '$/net.ts';
import { Element, Paragraph } from '$/ui.ts';

/**
 * Interface that maps a route Module
 */
export interface Module {
  /**The path of the module */
  path: string;

  /**The default exported function of the module*/
  default?: (k: any) => Element;
  /**Still haven't decided between loader (like Remix.run) or get for the server side props fetching*/
  loader?: Function;
  get?: Function;

  /**The UI that should be shown to the user when an error happens on rendering / props fetching */
  error?: (k: any) => Element;

  /**Other PROPS */
  [k: string]: Function | string | undefined;
}

/**
 * The interface representing a Route from the
 * simple / route to the more complex ones with dynamic matching.
 */
export interface Route {
  /**The relative name of the route used for url matching */
  name: string;
  /**The file path of Route's root directory */
  path: string;
  /**The default page for that Route (index.*) */
  default?: Module;
  /**The subroutes to that Route (eg: / -> /info ; / contact) */
  subroutes?: Route[];
  /**The layout file for that route's default and subroutes */
  layout?: {
    type: 'nested' | 'override';
  } & Module;
  /**The error file when the Route doesn't handle the error or is missing (404) */
  error?: Module;
  isDir?: boolean;
}

export type Routes = Route[];

/**
 * Goes through all the files in a directory, recursively,
 * making a route tree.
 * @param basePath The path of the root folder
 * @param pathName The textual representation of that folder
 * @returns A route AST
 */
export async function navigateRoutes(
  basePath: string,
  pathName: string
): Promise<Route> {
  const route: Route = {
    name: pathName,
    path: basePath,
    subroutes: [],
    isDir: pathName == '/'
  };

  for await (const { name, isFile, isSymlink } of Deno.readDir(basePath)) {
    if (isFile) {
      const base:
        | 'index'
        | '__layout'
        | '__error'
        | '__layout.override'
        | string = parse(name).name;

      const resolved = join(basePath, name);
      console.log('resolved :', resolved);

      switch (base) {
        case 'index':
          route.default = {
            path: resolved
          };
          continue;

        case '__layout.override':
        case '__layout':
          route.layout = {
            type: base == '__layout' ? 'nested' : 'override',
            path: resolved
          };
          continue;

        case '__error':
          route.error = { path: resolved };
          continue;
      }

      route?.subroutes?.push({
        name: join(pathName, base),
        path: join(basePath, name)
      });
      continue;
    }

    route?.subroutes?.push({
      ...(await navigateRoutes(join(basePath, name), join(pathName, name))),
      isDir: true
    });
  }

  return route;
}

/**
 * Represents an endpoint that can be matched by url
 */
export type Endpoint = {
  regex: RegExp;
  parameters: string[];
  literal: string;
  layouts: string[];
  error: Function;
  module: string;
  methods: Record<METHOD, boolean>;
  hasDefaultExport: boolean;
};

/**
 * Transforms a page name into a matchable regex with the named parameters.
 * /[id] -> /* , ["id"]
 */
function makePageRegex(name: string): [RegExp, string[]] {
  const length = name.length;
  let matchString = '';
  let params = [];

  for (let i = 0; i < length; i++) {
    const str = name.substring(i, name.length);
    const matches = str.match(/\[\w+\]/);

    if (matches != null && matches.index != null) {
      const position = matches.index;
      params.push(
        name.substring(i + position + 1, i + position + matches[0].length - 1)
      );

      matchString += name.substring(i, i + position);
      matchString += '(\\[\\w+\\])';

      i += position + matches[0].length - 1;
    } else {
      matchString += str;
      break;
    }
  }

  return [new RegExp(matchString), params];
}

const defaultError = (error: Error) => new Paragraph(`Error: ${error.message}`);

const importMap: Record<string, string> = {};
let mapCount = 0;

function safeGetSetImport(path: string, prefix = '__'): string {
  if (importMap[path] == null) {
    const id = `${prefix}${mapCount}`;
    importMap[path] = id;

    mapCount += 1;
    return id;
  }
  return importMap[path];
}

function getExportedMethods(
  module: Record<string, Function>,
  name: string
): [Record<METHOD, boolean>, boolean] {
  const methods: Record<string, boolean> = {};
  let hasDefaultExport = false;

  for (const name of Object.keys(module)) {
    if (name == 'default') {
      hasDefaultExport = true;
      continue;
    }
    if (Methods.indexOf(name.toUpperCase()) != -1) {
      methods[name.toUpperCase()] = true;
    }
  }

  /**
   * If the route doesn't export any visible method to the server
   */
  if (Object.values(methods).length == 0 && !hasDefaultExport) {
    console.warn(
      colors.brightYellow(
        `[WARN] Expected at least one exported method for route "${name}"!`
      )
    );
  }

  return [methods, hasDefaultExport];
}

export async function MakeEndpoints(
  root: Route,
  layouts: string[] = []
): Promise<Endpoint[]> {
  let endpoints: Endpoint[] = [];

  let computedLayouts = [...layouts];

  /**
   * If there is a layout on the root, and the path of the layout isn't null.
   */
  if (root.layout != null) {
    const layoutUUID = safeGetSetImport(root.layout.path, '__LAYOUT__');
    importMap[root.layout.path] = layoutUUID;

    if (root.layout.type == 'nested') {
      computedLayouts.push(layoutUUID);
    } else {
      computedLayouts = [layoutUUID];
    }
  }

  /**
   * If the route is not a directory (route that contains subroutes)
   * we push it to the endpoints list.
   * This condition basically checks if it's a single endpoint.
   */
  if (!root.isDir && root.subroutes == null) {
    const [regex, params] = makePageRegex(root.name);
    const importId = safeGetSetImport(root.path, '__PAGE__');
    const [methods, hasDefaultExport] = getExportedMethods(
      await import('file://' + root.path),
      root.name
    );

    return [
      {
        regex: regex,
        parameters: params,
        error: root.error?.default || defaultError,
        layouts: computedLayouts,
        literal: root.name,
        module: importId,
        methods,
        hasDefaultExport
      }
    ];
  }

  if (root.default != null) {
    const [regex, params] = makePageRegex(root.name);
    const importId = safeGetSetImport(root.default.path, '__PAGE__');
    const [methods, hasDefaultExport] = getExportedMethods(
      await import('file://' + root.default.path),
      root.name
    );

    endpoints.push({
      regex: regex,
      parameters: params,
      error: (_: any) => '',
      layouts: computedLayouts,
      literal: root.name,
      module: importId,
      methods,
      hasDefaultExport
    });
  }

  for (const subRoute of root.subroutes || []) {
    endpoints = [
      ...endpoints,
      ...(await MakeEndpoints(subRoute, computedLayouts))
    ];
  }

  return endpoints;
}

export function serializeEndpoints(endpoints: Endpoint[]): string {
  const routesList =
    '[\n' +
    endpoints
      .map((endpoint) => {
        let layoutString = '  ';
        for (const layout of endpoint.layouts) {
          layoutString += `${layout}.default(`;
        }

        layoutString += 'slot' + ')'.repeat(endpoint.layouts.length);
        layoutString = layoutString.trim();

        return ` { module: ${
          endpoint.module
        }, regex: ${endpoint.regex.toString()}, parameters: [${endpoint.parameters
          .map((p) => `\"${p}\"`)
          .join(', ')}], methods: ${JSON.stringify(
          endpoint.methods
        )}, hasDefault: ${
          endpoint.hasDefaultExport
        }, layout: (slot) => ${layoutString}, error: ${
          endpoint.error
        }, literal: "${endpoint.literal}", }`;
      })
      .join(',\n') +
    '\n]';

  const imports = Object.entries(importMap)
    .map(([key, value]) => `import * as ${value} from "${key}";`)
    .join('\n');

  return `${imports}

export const routes = ${routesList};`;
}
