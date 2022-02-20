import yargs from "https://cdn.deno.land/yargs/versions/yargs-v16.2.1-deno/raw/deno.ts";

interface Arguments {
  _: Array<"dev" | "build" | "run">;
  output: string;
}

const defaultArgs = {
  output: "./build",
};

const inputArgs: Arguments = {
  ...defaultArgs,
  ...yargs(Deno.args)
    .command("dev")
    .command("build")
    .command("run")
    .alias("o", "output").argv,
};

console.log(inputArgs);
const commands = inputArgs._;
const output = inputArgs.output;

//import { parse, print, transform } from "https://x.nest.land/swc@0.1.2/mod.ts";

interface Module {
  path: string;
  default?: Function;
  loader?: Function;
  get?: Function;
  [k: string]: Function | string | undefined;
}

interface Route {
  name: string;
  path: string;
  default?: Module;
  subroutes: Routes;
  layout?: {
    type: "nested" | "override";
  } & Module;
  error?: Module;
}

type Routes = Record<string, Route>;

import { parse, resolve } from "https://deno.land/std@0.126.0/path/mod.ts";

async function navigateRoutes(
  basePath: string,
  pathName: string
): Promise<Route> {
  let route: Route = {
    name: pathName,
    path: basePath,
    subroutes: {},
  };

  for await (const { name, isDirectory, isFile, isSymlink } of Deno.readDir(
    basePath
  )) {
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
        name: base,
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

const routes = await navigateRoutes("./routes", "/");
const strRep = JSON.stringify(routes, null, "\t");

Deno.writeTextFileSync("./build/routes.json", strRep);

import { serve } from "https://deno.land/std@0.126.0/http/server.ts";
import { EndpointResponse } from "./impact.d.ts";

import {
  Document,
  HTMLDocument,
} from "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm-noinit.ts";

if (commands.indexOf("dev") != -1) {
  const port = 8080;

  let endpoint: Function = () => {};
  if (routes.default?.get != null) endpoint = routes.default.get;

  let body: Function = () => {};
  if (routes.default?.default != null) body = routes.default.default;

  const handler = (request: Request): Response => {
    let headers = Object.fromEntries(request.headers.entries());
    let params = {
      headers,
    };
    const response: EndpointResponse = endpoint(params);

    const doc = new Document();

    return new Response(body({ document: doc, ...response.body }) || "", {
      status: response.status || 200,
    });
  };

  console.log(`Dev JINXS app running at: http://localhost:8080/`);
  await serve(handler, { port });
}
