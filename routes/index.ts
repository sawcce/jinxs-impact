import { RequestHandler } from "../impact.d.ts";

import { Container, Element, List, Paragraph } from "../ui.ts";

type Fact = {
  text: string;
};

type Body = {
  serverTime: Date;
  facts: Fact[];
};

export const get: RequestHandler<Body> = async () => {
  let facts = await (
    await fetch("https://cat-fact.herokuapp.com/facts", {
      method: "GET",
    })
  ).json();

  return {
    status: 200,
    body: {
      serverTime: Date.now(),
      facts,
    },
  };
};

export default function index({ serverTime, facts }: Body): Element {
  return new Container(
    new Paragraph(`Server time: ${serverTime}`),
    new List<Fact>(
      ({ text }) => new Paragraph(`Did you know that ${text}`),
      ...facts
    )
  );
}

export function error() {
  return new Paragraph("Error!");
}
