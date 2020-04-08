import * as parser from 'js-yaml';
/**
 * Yamilify
 * : Converts object to YAML.
 *
 * @param obj the object to convert to yaml.
 * @param options options to use when converting to YAML.
 */
export declare function yamlify(obj: any, options?: parser.DumpOptions): string;
/**
 * Parse
 * : Parses body and YAML from string.
 *
 * @param val the value to parse YAML from.
 */
export declare function parse(val: string, options?: parser.LoadOptions): {
    data: any;
    body: string;
    yaml: string;
};
/**
 * Load
 * : Loads file them parses for YAML.
 *
 * @param path the path to load from.
 * @param content existing raw static content.
 */
export declare function load(path: string, content?: string): {
    path: string;
    data: any;
    body: string;
    yaml: string;
};
