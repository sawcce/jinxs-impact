import { resolve } from '@/path.ts';

import {
  navigateRoutes,
  MakeEndpoints,
  serializeEndpoints,
  Route,
  Endpoint
} from '$/routing.ts';

export default async function Build(
  input: string,
  output: string
): Promise<[Route, Endpoint[]]> {
  console.time('Build');

  const routes = await navigateRoutes(resolve(Deno.cwd(), input), '/');
  const strRep = JSON.stringify(routes, null, '\t');

  const endpoints = MakeEndpoints(routes);
  console.log(endpoints);

  Deno.writeTextFileSync(resolve(output, './routes.json'), strRep);
  Deno.writeTextFileSync(
    resolve(output, './endpoints.js'),
    serializeEndpoints(endpoints)
  );

  console.timeEnd('Build');
  return [routes, endpoints];
}
