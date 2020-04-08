import { IMap, IIndexResult } from './interfaces';
export declare const ANSI_PATTERN: string;
export declare const ANSI_EXP: RegExp;
/**
 * Normalize
 * : Iterates content and normalizes the length of each row.
 */
export declare function normalize(content: string): string;
/**
 * Has ANSI
 * : Tests if string contains ANSI escape codes.
 *
 * @param val the value to inspect.
 */
export declare function hasAnsi(val: string): boolean;
/**
  * Index ANSI
  * : Indexes all ASNI escape codes.
  *
  * @param val the value to index.
  * @param replace when NOT false matched values are replaced.
  */
export declare function indexAnsi(val: string, replace?: boolean): IIndexResult;
/**
 * Revert ANSI
 * : Revert back to ANSI styles using indexes.
 *
 * @see https://github.com/yeoman/yosay/blob/master/index.js#L117
 *
 * @param val the value to revert.
 * @param indexes the indexes object for mapping back styles.
 */
export declare function revertAnsi(val: string | IIndexResult, indexes?: IMap<string>): string;
/**
 * To Lines
 * : Converts string to lines of strings.
 *
 * @param val the value to split into lines.
 */
export declare function toLines(val: string): string[];
/**
 * Stats
 * : Gets rows and columns for content.
 *
 * @param content optional content or stored value is used.
 */
export declare function stats(content: string): {
    columns: number;
    rows: number;
    lines: string[];
    content: string;
};
