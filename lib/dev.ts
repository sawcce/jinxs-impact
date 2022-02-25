import { serve } from '@/http.ts';
import { colors } from '@/cliffy.ts';

import { METHOD } from '$/net.ts';
import { Endpoint } from '$/routing.ts';

/**
 * Default value for the content-type header.
 * Used to identify if this is a raw request handler or if it is a ui(handler()) / ui() combination.
 */
type ContentType = 'text/html' | 'application/json';
type FunctionByUrl = [
  RegExp,
  /**Single handler */
  (
    | Function
    /**Handler that requires two steps (only used when there's a get handler and then the ui handler chained) */
    | Function[]
  ),
  string[],
  ContentType
];

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
  handler: Function | Function[],
  parameters: string[],
  type: ContentType = 'application/json'
) {
  Endpoints[method].push([regex, handler, parameters, type]);
}

export async function Server(file: string) {
  const module = await import(file);
  const endpoints: any[] = module.routes;

  for (const endpoint of endpoints) {
    if (endpoint.hasDefault && endpoint.methods['GET']) {
      const handler = [
        (params: any) => endpoint.module.get(params),
        (params: any) => endpoint.layout(endpoint.module.default(params)).emit()
      ];

      pushRoute(
        'GET',
        endpoint.regex,
        handler,
        endpoint.parameters,
        'text/html'
      );
    } else if (endpoint.hasDefault) {
      const handler = (params: any) => endpoint.module.default().emit();
      pushRoute(
        'GET',
        endpoint.regex,
        handler,
        endpoint.parameters,
        'text/html'
      );
    } else {
      const handler = (params: any) => endpoint.module.get(params);
      pushRoute(
        'GET',
        endpoint.regex,
        handler,
        endpoint.parameters,
        'application/json'
      );
    }

    for (const method of Object.keys(endpoint.methods)) {
      const regex = endpoint.regex;

      if (method == 'GET') {
        continue;
      }

      pushRoute(
        method as METHOD,
        regex,
        (params: any) => endpoint.module[method.toLowerCase()](params),
        endpoint.parameters
      );
    }
  }

  await serve(handler, { port: 8080 });
}

const Encoder = new TextEncoder();

function colorByCategory(category: string): any {
  switch (category) {
    case '1':
      return colors.yellow;
    case '2':
      return colors.green;
    case '3':
      return colors.magenta;
    case '4':
      return colors.red;
    case '5':
      return colors.red;
  }
}

function endRequest(status: Number) {
  const firstDigit = status.toString()[0];
  const color = colorByCategory(firstDigit);

  Deno.stdout.writeSync(Encoder.encode(color(` ${status}\n`)));
}

const handler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  Deno.stdout.writeSync(
    Encoder.encode(colors.gray(`[REQUEST] (${request.method}) - ${pathname}`))
  );

  for (const endpoint of Endpoints[request.method as METHOD]) {
    const match = endpoint[0].exec(pathname);

    if (match == null || match.length == 0) continue;

    const routeParams: Record<string, string> = {};

    for (let i = 0; i < endpoint[2].length; i++) {
      routeParams[endpoint[2][i]] = match[i + 1];
    }

    const headers = new Headers();
    headers.set('Content-Type', endpoint[3]);

    if (endpoint[1] instanceof Function) {
      endRequest(200);
      return new Response(endpoint[1](), {
        status: 200,
        headers
      });
    }

    const passedParams = {
      headers: Object.fromEntries(request.headers.entries()),
      url,
      ...routeParams
    };

    const result = await endpoint[1][0](passedParams);
    const status = result?.status || 200;

    for (const [name, value] of result?.headers || []) {
      headers.append(name, value);
    }

    endRequest(status);
    return new Response(endpoint[1][1](result?.props || {}), {
      status,
      headers
    });
  }

  endRequest(404);
  return new Response('404 not found', { status: 404 });
};
