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
    if (endpoint.hasDefault && endpoint.methods['GET']) {
      const handler = (params: any) =>
        endpoint
          .layout(endpoint.module.default(endpoint.module.get(params)))
          .emit();

      pushRoute('GET', endpoint.regex, handler, 'text/html');
    } else if (endpoint.hasDefault) {
      const handler = (params: any) => endpoint.module.default().emit();
      pushRoute('GET', endpoint.regex, handler, 'text/html');
    } else {
      const handler = (params: any) => endpoint.module.get(params);
      pushRoute('GET', endpoint.regex, handler, 'application/json');
    }

    for (const method of Object.keys(endpoint.methods)) {
      const regex = endpoint.regex;

      if (method == 'GET') {
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
    const url = new URL(request.url);
    const pathname = url.pathname;
    const match = pathname.match(endpoint[0]);

    if (match != null && match.length != 0) {
      const headers = new Headers();
      headers.set('Content-Type', endpoint[2]);

      const passedParams = {
        headers: Object.fromEntries(request.headers.entries()),
        url
      };

      return new Response(endpoint[1](passedParams), { status: 200, headers });
    }
  }

  const body = '404 not found';

  return new Response(body, { status: 404 });
};
