import yargs from '@/yargs.ts';
import { ensureDir } from '@/fs.ts';
import { resolve, parse } from '@/path.ts';

interface Arguments {
  _: Array<'dev' | 'build' | 'run' | 'init'>;
  output: string;
  input: string;
}

const defaultArgs = {
  output: './build',
  input: './routes'
};

const inputArgs: Arguments = {
  ...defaultArgs,
  ...yargs(Deno.args)
    .scriptName('impact')
    .command('dev', 'Builds the project and runs a dev server')
    .command('build', 'Builds the project for production')
    .command('run', 'Runs the built files from the build/dev command')
    .command('init')
    .alias('o', 'output')
    .alias('i', 'input')
    .strictCommands()
    .demandCommand(1, 1)
    .version('0.0.1')
    .parse()
};

const command = inputArgs._[0];

const output = resolve(Deno.cwd(), inputArgs.output);
const input = resolve(Deno.cwd(), inputArgs.input);

await ensureDir(output);
await ensureDir(input);

import {
  Routes,
  Route,
  navigateRoutes,
  MakeEndpoints,
  serializeEndpoints
} from '$/routing.ts';
import { Element, Paragraph } from '$/ui.ts';

import Build from '$/build.ts';
import { Server } from '$/dev.ts';

import Init from '$/init.ts';

switch (command) {
  case 'build':
    await Build(input, output);
    break;

  case 'init':
    await Init();
    break;

  case 'dev': {
    const [routes, endpoints] = await Build(input, output);
    await Server(resolve(Deno.cwd(), output, 'endpoints.js'));
    break;
  }
}
