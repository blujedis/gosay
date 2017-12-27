import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import * as parser from 'js-yaml';
import { isArray, extend } from 'chek';

const BOM = '\\ufeff?';
const SPLIT_EXP = /(\r?\n)/;
const YAML_EXP_STR = '^(' +
  BOM +
  '(= yaml =|---)' +
  '$([\\s\\S]*?)' +
  '^(?:\\2|\\.\\.\\.)' +
  '$' +
  (process.platform === 'win32' ? '\\r?' : '') +
  '(?:\\n)?)';

const YAML_EXP = new RegExp(YAML_EXP_STR, 'm');
const TRIM_EXP = /^\s+|\s+$/g;
const LOAD_OPTIONS = {};
const DUMP_OPTIONS = {
  skipInvalid: true
};

/**
 * Yamilify
 * : Converts object to YAML.
 *
 * @param obj the object to convert to yaml.
 * @param options options to use when converting to YAML.
 */
export function yamlify(obj: any, options?: parser.DumpOptions) {
  return parser.safeDump(obj, extend(DUMP_OPTIONS, options));
}

/**
 * Parse
 * : Parses body and YAML from string.
 *
 * @param val the value to parse YAML from.
 */
export function parse(val: string, options?: parser.LoadOptions) {

  val = val || '';
  const hasYaml = /^= yaml =|---/.test(val);

  if (!hasYaml)
    return { data: {}, body: val, yaml: null };

  const matches = YAML_EXP.exec(val);

  if (!matches)
    return {
      data: {},
      body: val,
      yaml: null
    };

  const yaml = matches[matches.length - 1].replace(TRIM_EXP, '');
  const body = val.replace(matches[0], '');
  const data = parser.safeLoad(yaml, extend(LOAD_OPTIONS, options));

  return {
    data: data,
    body: body,
    yaml: yaml
  };

}

/**
 * Load
 * : Loads file them parses for YAML.
 *
 * @param path the path to load from.
 * @param content existing raw static content.
 */
export function load(path: string, content?: string) {

  if (!path)
    throw new Error('Cannot read using path of undefined.');

  path = resolve(path);

  if (!content && existsSync(path))
    content = readFileSync(path).toString();

  content = content || '';

  const parsed = parse(content);

  return {
    path: path,
    data: parsed.data,
    body: parsed.body,
    yaml: parsed.yaml
  };

}