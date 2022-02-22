import yargs from "@/yargs.ts";
import { ensureDir } from "@/fs.ts";
import { resolve, parse } from "@/path.ts";

interface Arguments {
  _: Array<"dev" | "build" | "run" | "init">;
  output: string;
  input: string;
}

const defaultArgs = {
  output: "./build",
  input: "./routes",
};

const inputArgs: Arguments = {
  ...defaultArgs,
  ...yargs(Deno.args)
    .scriptName("impact")
    .command("dev", "Builds the project and runs a dev server")
    .command("build", "Builds the project for production")
    .command("run", "Runs the built files from the build/dev command")
    .command("init")
    .alias("o", "output")
    .alias("i", "input")
    .strictCommands()
    .demandCommand(1, 1)
    .version("0.0.1")
    .parse(),
};

const command = inputArgs._[0];

const output = resolve(Deno.cwd(), inputArgs.output);
const input = resolve(Deno.cwd(), inputArgs.input);

await ensureDir(output);
await ensureDir(input);

import {
  Routes,
  Route,
  navigateRoutes,
  MakeEndpoints,
  serializeEndpoints,
} from "$/routing.ts";
import { Element, Paragraph } from "$/ui.ts";

const routes = await navigateRoutes("./routes", "/");
const strRep = JSON.stringify(routes, null, "\t");

const endpoints = MakeEndpoints(routes);
console.log(endpoints);

Deno.writeTextFileSync(resolve(output, "./routes.json"), strRep);
Deno.writeTextFileSync(
  resolve(output, "./endpoints.ts"),
  serializeEndpoints(endpoints)
);

import { serve } from "https://deno.land/std@0.126.0/http/server.ts";
import { EndpointResponse } from "./impact.d.ts";

if (command == "dev") {
  const port = 8080;

  let endpoint: Function = () => {};
  if (routes.default?.get != null) endpoint = routes.default.get;

  let body: (k: any) => Element;
  if (routes.default?.default != null) body = routes.default.default;

  const handler = async (request: Request): Promise<Response> => {
    let headers = Object.fromEntries(request.headers.entries());
    let params = {
      headers,
    };

    const res_headers = new Headers();
    res_headers.set("Content-Type", "text/html");

    try {
      const response: EndpointResponse = await endpoint(params);

      return new Response(body({ ...response.body }).emit() || "", {
        status: response.status || 200,
        headers: res_headers,
      });
    } catch (e) {
      return new Response(
        (
          routes.default?.error?.call(this, e) || new Paragraph("Server error!")
        ).emit(),
        {
          status: 400,
          headers: res_headers,
        }
      );
    }
  };

  console.log(`Dev JINXS app running at: http://localhost:8080/`);
  await serve(handler, { port });
}
