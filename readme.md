# Impact

A new way to write server side apps in deno.

## Installation
**NOTE**: [git](https://git-scm.com) is required to clone the repository.

### Linux & MacOS
```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
git clone https://github.com/sawcce/jinxs-impact
```

### Windows (using PowerShell)
```ps
iwr https://deno.land/x/install/install.ps1 -useb | iex
git clone https://github.com/sawcce/jinxs-impact
```

## Run the test project
### Windows
```ps
deno run --allow-read --allow-env --allow-write --allow-net impact.ts dev
```
### Linux/MacOS
```bash
./impact.sh dev
```
