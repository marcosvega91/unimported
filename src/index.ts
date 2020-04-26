import * as fs from './fs';

import { join } from 'path';
import ora from 'ora';
import { printResults } from './print';
import * as meta from './meta';
import { traverse } from './traverse';
import chalk from 'chalk';

export interface Context {
  cwd: string;
  entry: string[];
  aliases: { [key: string]: string[] };
  ignore: string[];
  extensions: string[];
  dependencies: { [key: string]: string };
  type: 'meteor' | 'node';
}

const spinner = ora('initializing').start();
async function main() {
  const cwd = process.cwd();

  const [aliases, dependencies, type] = await Promise.all([
    meta.getAliases(cwd),
    meta.getDependencies(cwd),
    meta.getProjectType(cwd),
  ]);

  const context: Context = {
    cwd,
    aliases,
    dependencies,
    type,
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    ignore: [],
    entry: [],
  };

  context.ignore = [
    '**/node_modules/**',
    '**/*.stories.{js,jsx,ts,tsx}',
    '**/*.tests.{js,jsx,ts,tsx}',
    '**/*.spec.{js,jsx,ts,tsx}',
    context.type === 'meteor' && 'packages/**',
  ].filter(Boolean) as string[];

  // traverse all source files and get import data
  context.entry = await meta.getEntry(cwd, context);
  spinner.text = `resolving imports`;
  const traverseResult = await traverse(context.entry, context);
  traverseResult.files = new Map([...traverseResult.files].sort());

  // traverse the file system and get system data
  spinner.text = 'traverse the file system';
  const baseUrl = (await fs.exists('src', cwd)) ? join(cwd, 'src') : cwd;
  const files = await fs.list('**/*', baseUrl, {
    extensions: context.extensions,
    ignore: context.ignore,
  });

  spinner.text = 'process results';

  spinner.stop();
  printResults(files, traverseResult, context);
}

main().catch((error) => {
  spinner.stop();
  console.error(chalk.redBright('something unexpected happened'));
  console.error(error);
  process.exit(0);
});
