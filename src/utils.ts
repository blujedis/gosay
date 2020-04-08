import { keys, isPlainObject, isString } from 'chek';
import { IMap, IIndexResult } from './interfaces';


export const ANSI_PATTERN = [
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
  '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
].join('|');

export const ANSI_EXP = new RegExp(ANSI_PATTERN, 'g');

/**
 * Normalize
 * : Iterates content and normalizes the length of each row.
 */
export function normalize(content: string) {
  const _stats = stats(content);
  const rows = _stats.lines.map((s) => {
    if (s.length < _stats.columns)
      s += ' '.repeat(_stats.columns - s.length);
    return s;
  });
  return rows.join('\n');
}

/**
 * Has ANSI
 * : Tests if string contains ANSI escape codes.
 *
 * @param val the value to inspect.
 */
export function hasAnsi(val: string) {
  return ANSI_EXP.test(val);
}

/**
  * Index ANSI
  * : Indexes all ASNI escape codes.
  *
  * @param val the value to index.
  * @param replace when NOT false matched values are replaced.
  */
export function indexAnsi(val: string, replace?: boolean): IIndexResult {
  const source = val;
  const indexes: IMap<string> = {};
  val = val.replace(ANSI_EXP, (match, offset) => {
    if (!match)
      return;
    keys(indexes).forEach((key, i) => {
      offset -= indexes[key].length;
    });
    indexes[offset] = indexes[offset] ? indexes[offset] + match : match;
    if (replace !== false)
      return '';
    return match;
  });
  return {
    source,
    modified: val,
    indexes
  };
}

/**
 * Revert ANSI
 * : Revert back to ANSI styles using indexes.
 *
 * @see https://github.com/yeoman/yosay/blob/master/index.js#L117
 *
 * @param val the value to revert.
 * @param indexes the indexes object for mapping back styles.
 */
export function revertAnsi(val: string | IIndexResult, indexes?: IMap<string>) {

  if (isPlainObject(val)) {
    const obj = <IIndexResult>val;
    val = obj.modified;
    indexes = obj.indexes;
  }

  val = (val + ' ').replace(/./g, (char, idx) => {
    keys(indexes).forEach((offset) => {
      let continues = 0;
      let contiuesStyle;
      if (idx > offset) {
        continues++;
        contiuesStyle = indexes[offset];
      }
      if (continues === 1 && idx < offset)
        continues++;
      if (indexes[idx])
        char = indexes[idx] + char;
      else if (continues >= 2)
        char = contiuesStyle + char;
    });
    return char;
  }).replace(/\s$/, '');

  return val;

}

/**
 * To Lines
 * : Converts string to lines of strings.
 *
 * @param val the value to split into lines.
 */
export function toLines(val: string) {
  val = val.replace(/\r?\n/g, '\n');
  return val.split('\n');
}

/**
 * Stats
 * : Gets rows and columns for content.
 *
 * @param content optional content or stored value is used.
 */
export function stats(content: string) {
  const lines = toLines(content);
  const columns = lines.reduce(function (a, b) { return a.length > b.length ? a : b; });
  return {
    columns: columns.length,
    rows: lines.length,
    lines: lines,
    content: content
  };
}