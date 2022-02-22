import { resolve } from "@/path.ts";

import {
  navigateRoutes,
  MakeEndpoints,
  serializeEndpoints,
  Route,
  Endpoint,
} from "$/routing.ts";

export default async function Build(
  input: string,
  output: string
): Promise<[Route, Endpoint[]]> {
  const routes = await navigateRoutes(resolve(Deno.cwd(), input), "/");
  const strRep = JSON.stringify(routes, null, "\t");

  const endpoints = MakeEndpoints(routes);
  console.log(endpoints);

  Deno.writeTextFileSync(resolve(output, "./routes.json"), strRep);
  Deno.writeTextFileSync(
    resolve(output, "./endpoints.ts"),
    serializeEndpoints(endpoints)
  );

  return [routes, endpoints];
}
