import yargs from "https://cdn.deno.land/yargs/versions/yargs-v16.2.1-deno/raw/deno.ts";

interface Arguments {
  output: string = "/build";
}

const inputArgs: Arguments = yargs(Deno.args).alias("o", "output").argv;

console.log(inputArgs);
