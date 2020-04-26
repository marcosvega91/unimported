import fs from 'fs';
import { join } from 'path';
import glob, { IOptions as GlobOptions } from 'glob';
import util from 'util';

const globAsync = util.promisify(glob);
const readFileAsync = util.promisify(fs.readFile);
const existsAsync = util.promisify(fs.exists);

export async function exists(path: string, cwd = ''): Promise<boolean> {
  return existsAsync(join(cwd, path));
}

export async function readText(path: string, cwd = ''): Promise<string> {
  try {
    return readFileAsync(join(cwd, path), { encoding: 'utf8' });
  } catch (e) {
    return '';
  }
}

export async function readJson<T extends any>(
  path: string,
  cwd = '.',
): Promise<T | null> {
  try {
    return JSON.parse(await readText(path, cwd));
  } catch (e) {
    return null;
  }
}

type ListOptions = GlobOptions & {
  extensions?: string[];
};

export async function list(
  pattern = '**/*',
  cwd = '.',
  options: ListOptions = {},
): Promise<string[]> {
  const { extensions, ...globOptions } = options;

  // transform ['.js', '.tsx'] to **/*.{js,tsx}
  const fullPattern = Array.isArray(extensions)
    ? `${pattern}.{${extensions.map((x) => x.replace(/^\./, '')).join(',')}}`
    : pattern;

  return globAsync(fullPattern, {
    ...globOptions,
    cwd,
    realpath: true,
  });

  // new Promise((resolve, reject) => glob(fullPattern, {
  //   ...globOptions,
  //   cwd,
  //   realpath: true
  // }, (error, result) => error ? reject(error) : resolve(result)));
}
