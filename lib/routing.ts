import { parse, resolve } from '@/path.ts';
import { uniqueString } from '@/unique-string.ts';

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
    console.log(name);
    if (isFile) {
      const base:
        | 'index'
        | '__layout'
        | '__error'
        | '__layout.override'
        | string = parse(name).name;

      const resolved = resolve(basePath, name);

      switch (base) {
        case 'index':
          route.default = {
            path: resolved,
            ...(await import(resolved))
          };
          continue;

        case '__layout.override':
        case '__layout':
          route.layout = {
            type: base == '__layout' ? 'nested' : 'override',
            path: resolved,
            ...(await import(resolved))
          };
          continue;

        case '__error':
          route.error = { path: resolved };
          continue;
      }

      route?.subroutes?.push({
        name: resolve(pathName, base),
        path: resolve(basePath, name)
      });
      continue;
    }

    route?.subroutes?.push({
      ...(await navigateRoutes(
        resolve(basePath, name),
        resolve(pathName, name)
      )),
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
      matchString += '\\[\\w+\\]';

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

function safeGetSetImport(path: string, prefix: string = '__'): string {
  if (importMap[path] == null) {
    return `${prefix}${uniqueString(20)}`;
  }
  return importMap[path];
}

export function MakeEndpoints(root: Route, layouts: string[] = []): Endpoint[] {
  let endpoints: Endpoint[] = [];

  let computedLayouts = [...layouts];
  console.log(root);

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
    return [
      {
        regex: regex,
        parameters: params,
        error: root.error?.default || defaultError,
        layouts: computedLayouts,
        literal: root.name
      }
    ];
  }

  if (root.default != null) {
    const [regex, params] = makePageRegex(root.name);

    endpoints.push({
      regex: regex,
      parameters: params,
      error: root.error?.default || ((_: any) => ''),
      layouts: computedLayouts,
      literal: root.name
    });
  }

  for (const subRoute of root.subroutes || []) {
    endpoints = [...endpoints, ...MakeEndpoints(subRoute, computedLayouts)];
  }

  return endpoints;
}

export function serializeEndpoints(endpoints: Endpoint[]): string {
  const routesList =
    '[\n' +
    endpoints
      .map(
        (endpoint) =>
          ` { regex: ${endpoint.regex.toString()}, parameters: [${endpoint.parameters
            .map((p) => `\"${p}\"`)
            .join(', ')}], layouts: [ ${endpoint.layouts
            .map((layout) => layout.toString())
            .join(',')} ], error: ${endpoint.error}, literal: "${
            endpoint.literal
          }", }`
      )
      .join(',\n') +
    '\n]';

  const imports = Object.entries(importMap)
    .map(([key, value]) => `import ${value} from "${key}";`)
    .join('\n');

  return `${imports}

export const routes = ${routesList};`;
}
