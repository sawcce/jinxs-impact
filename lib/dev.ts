import { serve } from '@/http.ts';

import { METHOD } from '$/net.ts';
import { Endpoint } from '$/routing.ts';

const Endpoints: Record<METHOD, Endpoint[]> = {
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

export async function Server(file: string) {
  const module = await import(file);
  const endpoints = module.routes;

  for (const endpoint of endpoints) {
    for (const method of Object.keys(endpoint.methods)) {
      Endpoints[method as METHOD].push(endpoint);
    }
  }

  console.log(Endpoints);
  await serve(handler, { port: 8080 });
}

const handler = (request: Request): Response => {
  console.log(request.method);

  for (const endpoint of Endpoints[request.method as METHOD]) {
    if (request.url.match(endpoint.regex)?.length != 0) {
      console.log('MATCH!');
    }
  }

  let body = 'Your user-agent is:\n\n';
  body += request.headers.get('user-agent') || 'Unknown';

  return new Response(body, { status: 200 });
};
