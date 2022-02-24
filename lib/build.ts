import { join, resolve } from '@/path.ts';
import { clearScreen, colors, cursorTo } from '@/cliffy.ts';

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
  const start = Date.now();

  console.log(clearScreen);
  console.log(colors.blue('[TASK] Started build process'));

  console.log('root :', join(Deno.cwd(), input));

  const routes = await navigateRoutes(join(Deno.cwd(), input), '/');
  const strRep = JSON.stringify(routes, null, '\t');

  const endpoints = await MakeEndpoints(routes);

  Deno.writeTextFileSync(resolve(output, './routes.json'), strRep);
  Deno.writeTextFileSync(
    resolve(output, './endpoints.js'),
    serializeEndpoints(endpoints)
  );

  const duration = Date.now() - start;
  console.log(
    colors.green(`[SUCCESS] Build done.`),
    colors.gray(`(Took ${duration}ms)`)
  );
  return [routes, endpoints];
}
