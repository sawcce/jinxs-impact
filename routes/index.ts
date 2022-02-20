import { RequestHandler } from "../impact.d.ts";
import { Document } from "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm-noinit.ts";

const document = new Document();

type Body = {
  serverTime: Date;
};

export const get: RequestHandler<Body> = () => {
  return {
    status: 200,
    body: {
      serverTime: Date.now(),
    },
  };
};

export default function index({ serverTime }: Body) {
  let node = document.createElement("h1");
  node.innerText = `Time on server is: ${serverTime}`;

  return node.innerHTML;
}
