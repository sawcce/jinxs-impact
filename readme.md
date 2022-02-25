# Impact
A new way to write server side apps in deno.

## Installation
### Requirements
#### Linux/MacOS/BSD
```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

#### Windows
```ps
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

#### Other
To install on other platforms see the [official deno
guide](https://deno.land/manual@v1.19.0/getting_started/installation).

**NOTE**: If the deno installation fails try to read the [official deno
guide](https://deno.land/manual@v1.19.0/getting_started/installation) or if the
impact installation fails open an
[issue](https://github.com/sawcce/jinxs-impact/issues).

## Getting started
To getting started you can initialize a new empty project with impact:
```bash
impact init
impact dev
```
impact init creates a new project and impact dev starts the application.

## Contributing

To contribute to the impact developement process clone locally the impact official repository:
```bash
git clone https://github.com/sawcce/jinxs-impact
```

and start contributing, before committing format your files with the prettier formatter.

=======
## Install the cli

Run this command with the deno cli installed:
`deno --unstable install --allow-read --allow-env --allow-write --allow-net --import-map=https://raw.githubusercontent.com/sawcce/jinxs-impact/master/import_map.json --name impact https://raw.githubusercontent.com/sawcce/jinxs-impact/master/cli.ts`

If you get an error stating that you already have an installation of the module, you can add the `-f` flag after `install` on the run command.

which is equivalent to

`deno --unstable install -f --allow-read --allow-env --allow-write --allow-net --import-map=https://raw.githubusercontent.com/sawcce/jinxs-impact/master/import_map.json --name impact https://raw.githubusercontent.com/sawcce/jinxs-impact/master/cli.ts`

You might also want to add the `-r` flag if the updates aren't being downloaded.

### Initialize a new project
After installing the cli, simply run `impact init` to create a new project.

## Routes

Impact uses a file-based router similar to svelte and nextjs.