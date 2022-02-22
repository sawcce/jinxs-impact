import { resolve, join } from "@/path.ts";
import { Confirm, Input, prompt } from "@/cliffy.ts";
import { ensureDir } from "@/fs.ts";

export default async function Init(this: any) {
  let name = "";

  const config = await prompt([
    {
      type: Input,
      name: "projectName",
      message: "Choose a name for the project",
      default: "sample-app",
      after: async function ({ projectName }, next) {
        name = projectName || "";
        await next();
      },
    },
    {
      type: Input,
      name: "projectDir",
      message: "Choose a root directory (empty for cwd)",
      default: `/${name}`,
      suggestions: [".", "./" + name],
      hint: "$name = project name ; . for current directory",
      before: async function (this: { default: string }, _, next) {
        this.default = `./${name}`;
        await next();
      },
      transform: (value: string) => {
        return value.replaceAll("$name", name);
      },
    },
    {
      type: Input,
      name: "routesDir",
      message: "Choose a routes directory",
      default: "routes",
      suggestions: ["routes", "pages", "endpoints"],
    },
    {
      type: Input,
      name: "outputDir",
      message: "Choose a build directory",
      default: "build",
      suggestions: ["build", "public"],
    },
    {
      type: Confirm,
      name: "ok",
      message: "Does this look good to you ?",
      after: async ({ ok }, next) => {
        if (ok) {
          await next();
        } else {
          await next("projectName");
        }
      },
    },
  ]);

  const folder = resolve(Deno.cwd(), config.projectDir || "");
  await ensureDir(folder);

  delete config.ok;
  delete config.projectDir;

  await Deno.writeTextFile(
    join(folder, "/impact.config.ts"),
    `export default ${JSON.stringify(config, null, "\t")}`
  );
}
