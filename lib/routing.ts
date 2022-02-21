import { parse, resolve } from "@/path.ts";
import { Element, Paragraph } from "$/ui.ts";

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
  subroutes: Routes;
  /**The layout file for that route's default and subroutes */
  layout?: {
    type: "nested" | "override";
  } & Module;
  /**The error file when the Route doesn't handle the error or is missing (404) */
  error?: Module;
}

/**Dictionnary of Routes */
export type Routes = Record<string, Route>;

export async function navigateRoutes(
  basePath: string,
  pathName: string
): Promise<Route> {
  let route: Route = {
    name: pathName,
    path: basePath,
    subroutes: {},
  };

  for await (const { name, isFile, isSymlink } of Deno.readDir(basePath)) {
    if (isFile) {
      const base:
        | "index"
        | "__layout"
        | "__error"
        | "__layout.override"
        | string = parse(name).name;

      const resolved = resolve(basePath, name);

      switch (base) {
        case "index":
          route.default = {
            path: resolved,
            ...(await import(resolved)),
          };
          continue;

        case "__layout.override":
        case "__layout":
          route.layout = {
            type: base == "__layout" ? "nested" : "override",
            path: resolved,
          };
          continue;

        case "__error":
          route.error = { path: resolved };
          continue;
      }

      route.subroutes[base] = route.subroutes[base] || {
        name: resolve(pathName, base),
        path: resolve(basePath, name),
      };
      continue;
    }

    route.subroutes[name] = await navigateRoutes(
      resolve(basePath, name),
      resolve(pathName, name)
    );
  }

  return route;
}
