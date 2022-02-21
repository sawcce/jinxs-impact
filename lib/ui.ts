export class Element {
  public text: string = "";
  public children: any[] = [];
  public construct(): string {
    return "";
  }
  public emit(): string {
    return "";
  }
}

export class Paragraph extends Element {
  public constructor(text: string) {
    super();
    this.text = text;
  }

  public construct() {
    return `<p>${this.text}</p>`;
  }

  public emit() {
    return `<p>${this.text}</p>`;
  }
}

type Template<K> = (child: K) => Element;

export class List<K> extends Element {
  public children: K[];
  public template: Template<K>;

  constructor(template: Template<K>, ...children: K[]) {
    super();
    this.children = children;
    this.template = template;
  }

  public emit() {
    return this.children.map((child) => this.template(child).emit()).join(" ");
  }
}

class Decorator {
  constructor() {}
}

export class Container extends Element {
  public children: Element[];
  constructor(...children: Element[]) {
    super();
    this.children = children;
  }

  public emit(): string {
    return `<div>${this.children.map((child) => child.emit()).join(" ")}</div>`;
  }
}
