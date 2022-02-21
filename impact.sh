#!/bin/bash
deno run --allow-read --allow-env --allow-write --allow-net --import-map=import_map.json cli.ts "$@"