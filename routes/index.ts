import { RequestHandler } from "../impact.d.ts";

export const get: RequestHandler = () => {
  return {
    status: 200,
    body: "Hello world!",
  };
};

export default function test() {}
