import { uniqueString } from '@/unique-string.ts';

export class Element {
  public id: string = uniqueString(8);

  public context: Context | undefined;
  public text: string = '';
  public children: any[] = [];

  public styles: string | undefined;

  public classes: string[] = [];

  public construct(): string {
    return '';
  }

  public emit(context: Context) {
    context.addStyle(this.styles, this.id);
  }

  public addClass(name: string) {
    this.classes.push(`${this.id}_${name}`);
    return this;
  }

  public styled(styles: string) {
    this.styles = `${styles}`;
    return this;
  }
}

export class Context {
  public head = [];
  public styles: string[] = [];

  addStyle(style: string | undefined, id: string) {
    style = style?.replaceAll(/(\.|\#)(\w+)/g, `$1${id}_$2`);
    if (style != undefined && !(style.length == 0)) {
      this.styles.push(style);
    }
  }

  emit(root: Element) {
    /**
     * We have to execute it first because a lot of the magic happens in the emit funcion
     */
    const res = root.emit(this);

    return `<!DOCTYPE html>
<html>
    <head>
      ${this.head.join('\n')}
      <style>
        ${this.styles.join('\n')}
      </style>
    </head>
    <body>
      ${res}
    </body>
</html>`;
  }
}

export class Paragraph extends Element {
  private size: string | undefined;

  public constructor(text: string) {
    super();
    this.text = text;
  }

  public sized(size: string): Paragraph {
    this.size = size;

    return this;
  }

  public emit(context: Context) {
    super.emit(context);

    return `<p id=${this.id} ${
      this.size != undefined ? ` style="font-size: ${this.size}"` : ''
    }>${this.text}</p>`;
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

  public emit(context: Context) {
    return this.children
      .map((child) => this.template(child).emit(context))
      .join(' ');
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

  public emit(context: Context): string {
    super.emit(context);
    const classAttr =
      this.classes.length > 0 ? `class="${this.classes.join(' ')}"` : '';

    return `<div  id=${this.id} ${classAttr}>${this.children
      .map((child) => child.emit(context))
      .join(' ')}</div>`;
  }
}
