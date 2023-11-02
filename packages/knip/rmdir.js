#!/usr/bin/env node
import { rmSync } from 'node:fs';
rmSync(process.argv[2], { force: true, recursive: true });
