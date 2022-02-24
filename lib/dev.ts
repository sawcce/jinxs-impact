import { serve } from '@/http.ts';

import { METHOD } from '$/net.ts';
import { Endpoint } from '$/routing.ts';

type ContentType = 'text/html' | 'application/json';
type FunctionByUrl = [RegExp, Function, ContentType];

const Endpoints: Record<METHOD, FunctionByUrl[]> = {
  GET: [],
  HEAD: [],
  POST: [],
  PUT: [],
  DELETE: [],
  CONNECT: [],
  OPTIONS: [],
  TRACE: [],
  PATCH: []
};

function pushRoute(
  method: METHOD,
  regex: RegExp,
  handler: Function,
  type: ContentType = 'application/json'
) {
  Endpoints[method].push([regex, handler, type]);
}

export async function Server(file: string) {
  const module = await import(file);
  const endpoints: any[] = module.routes;

  for (const endpoint of endpoints) {
    for (const method of Object.keys(endpoint.methods)) {
      const regex = endpoint.regex;

      if (method == 'GET') {
        let handler = (params: any) => endpoint.module.get(params);

        if (endpoint.hasDefault == true) {
          handler = (params: any) =>
            endpoint.layout(endpoint.module.default(params)).emit();

          pushRoute(method, regex, handler, 'text/html');
          continue;
        }

        pushRoute(method, regex, handler);
        continue;
      }

      pushRoute(method as METHOD, regex, (params: any) =>
        endpoint.module[method.toLowerCase()](params)
      );
    }
  }

  await serve(handler, { port: 8080 });
}

const handler = (request: Request): Response => {
  for (const endpoint of Endpoints[request.method as METHOD]) {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(endpoint[0]);

    if (match != null && match.length != 0) {
      const headers = new Headers();
      headers.set('Content-Type', endpoint[2]);

      return new Response(endpoint[1](), { status: 200, headers });
    }
  }

  const body = '404 not found';

  return new Response(body, { status: 404 });
};
