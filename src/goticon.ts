import { isString, isPlainObject, toArray, keys, isBoolean, isArray, isValue, isWindows, isEmpty, orderBy, flatten, clone, last } from 'chek';
import * as table from 'text-table';
import { Colurs, IColurs } from 'colurs';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { extname, resolve, join, parse, dirname } from 'path';
import { EOL } from 'os';
import { inspect } from 'util';
import { IMap, AnsiStyles, IElement, ITheme, IRange, IThemeElement, Points, IPoint, RestParam } from './interfaces';
import * as yaml from './yaml';
import * as utils from './utils';

const ANSI_PATTERN = [
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
  '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
].join('|');

const ANSI_EXP = new RegExp(ANSI_PATTERN, 'g');

const LOG_TYPES = {
  error: 'red',
  warn: 'yellow',
  notice: 'green'
};

const YAML_TEMPLATE =
  '---' + EOL + EOL +
  '# YAML CONFIGURATION: This section contains element and theme ' + EOL +
  '# settings for rendering this Goticon. If you DO NOT wish to ' + EOL +
  '# store configuration settings use .save(false).' + EOL + EOL +
  '{{YAML}}' + EOL +
  '---' + EOL;

let colurs: IColurs = new Colurs();

export class Goticon {
  name: string;
  path: string;
  content: string;
  yaml: string;
  rendered: string;
  elements: IMap<IElement> = {};
  themes: IMap<ITheme> = {};

  constructor(name: string, path: string, content: string) {
    this.name = name;
    this.load(path, content);
    this.theme('default'); // create default theme.
  }

  /**
   * To Point Sets
   * : Converts x and y points to PointSets.
   *
   * @param x the x point(s) or array of PointSets.
   * @param y the y point(s).
   */
  private toPointSets(x?: Points | IPoint[], y?: Points): IPoint[] {
    if (!x && !y) return [];
    if (isArray(x) && isPlainObject(x[0]))
      // is a point set
      return x as IPoint[];
    return [{ x: toArray(x), y: toArray(y) }] as IPoint[];
  }

  /**
   * Unique Points
   * : Ensures points are unique.
   *
   * @param element the element to compare points against.
   * @param points points to compare returning unique points.
   */
  private uniquePoints(element: IElement, points: IPoint[]) {
    const exists = val => {
      return element.points.some(p => {
        return JSON.stringify(p) === JSON.stringify(val);
      });
    };

    points = points.filter(p => {
      return !exists(p);
    });

    return points;
  }

  /**
   * To YAML
   * : Converts Goticon to YAML.
   */
  private toYAML() {
    const clone: any = {};
    clone.name = this.name;
    clone.elements = this.elements;
    clone.themes = this.themes;
    for (const k in clone.elements) {
      const elem = clone.elements[k];
      delete elem.ranges;
    }
    return yaml.yamlify(clone);
  }

  /**
   * Map To Array
   * : Parses a string converting to element array using ranges.
   * Assumes you are passing the entire string element including ignored points.
   * The valid points are then parsed based on the element's ranges.
   *
   * @param ranges the ranges used to parse value with.
   * @param val the string value to parse.
   */
  private mapToArray(name: string | IElement, val: string) {
    if (!isString(name))
      name = (name as IElement).name;
    let lines = utils.toLines(val);
    let linesContent = utils.toLines(this.content);
    // All rows were passed just return the string.
    if (lines.length === linesContent.length)
      return lines;
    const result = [];
    const element = this.element(<string>name);
    const ranges = this.toRanges(element.points);
    const offset = ranges[0].row; // the starting row.
    const pad = ranges.reduce((prev, cur) => { // offset padding.
      return prev.start < cur.start ? prev : cur;
    }).start;
    lines.forEach((line, i) => {
      i += offset;
      line = '-'.repeat(pad) + line;
      ranges.forEach((r) => {
        if (i === r.row) {
          let tmp = line.slice(r.start, r.end + 1);
          result.push(tmp);
        }
      });
    });
    return result;
  }

  /**
   * Fill Range
   * : Fills a range of numbers.
   *
   * @param start the starting value.
   * @param end the ending value.
   */
  private fillRange(start: number, end: number) {
    const arr = [];
    while (start <= end)
      arr.push(start++);
    return arr;
  }

  /**
   * Has Elements
   * : Checks if Goticon has any elements.
   */
  hasElements() {
    return keys(this.elements).length;
  }

  /**
   * To Range
   * : Converts x and y arrays of points to ranges.
   *
   * @example
   * x coordinate examples:
   * [0, 3] - skip inner points use static pts 0 and 3 only (default behavior).
   * [0, 3, 'range'] - range of 0, 1, 2, 3
   * [0, 3, 'skip'] - skip inner points use static pts 0 and 3 only.
   * [3, 6, 7] - static points
   * [7, '*'] - from point 7 to end of row.
   * ['*', 8] - from begining of row to defined point.
   *
   * @param x the x points(s).
   * @param y the y points(s).
   */
  toRange(x: Points, y: Points): IRange[] {

    const ranges = [];
    const _stats = utils.stats(this.content);

    if (!isValue(x)) return ranges;

    x = toArray<number>(x).slice(0);
    y = toArray<number>(y).slice(0);

    if (x[1] === '*') x[1] = _stats.columns;
    if (x[1] && x[0] === '*') x[0] = 0;

    if (y[1] === '*') {
      y[1] = _stats.lines.length - 1;
      y.push('range');
    }
    if (y[1] && y[0] === '*') {
      y[0] = 0;
      y.push('range');
    }

    const rangeX = /r(ange)?/.test(last<any>(x) || '');
    const rangeY = /r(ange)?/.test(last<any>(y) || '');

    // If last is x or y is range remove.
    if (rangeX) x.pop();
    if (rangeY) y.pop();

    // Feel the range of rows.
    if (rangeY)
      y = this.fillRange(<number>y[0], <number>y[1]);

    y.forEach(r => {
      if ((x as number[]).length > 2 || !rangeX) {
        (x as number[]).forEach(p => {
          ranges.push({
            row: r,
            start: p,
            end: p
          });
        });
      } else {
        ranges.push({
          row: r,
          start: x[0],
          end: x[1] || x[0]
        });
      }
    });

    return ranges;
  }

  /**
   * To Ranges
   * : Converts x and y arrays of points or PointSets to ranges.
   *
   * @param x the x points(s) or PointSets.
   * @param y the y points(s).
   */
  toRanges(points: IPoint[]) {
    let ranges: IRange[] = [];
    points.forEach(p => {
      ranges = ranges.concat(this.toRange(p.x, p.y));
    });

    orderBy(ranges, 'row', 'start');

    return ranges;
  }

  /**
   * Parse
   * : Parses raw content for YAML.
   *
   * @param pathOrContent the file path to be parsed for YAML.
   * @param content optional raw static content to parse for YAML.
   */
  parse(pathOrContent?: string, content?: string) {

    if (!/\.goticon$/.test(pathOrContent)) {
      content = pathOrContent;
      pathOrContent = undefined;
    }

    pathOrContent = pathOrContent || this.path;

    const ext = extname(pathOrContent || '');

    if (!/\.?goticon/.test(ext))
      throw new Error(`the extension ${ext} is NOT supported.`);

    return yaml.load(pathOrContent, content);

  }

  /**
   * Load
   * : Loads content from file or static value.
   *
   * @param pathOrContent the path or content to load from.
   * @param content optional content to override from disk.
   */
  load(pathOrContent?: string, content?: string) {

    const parsed = this.parse(pathOrContent, content);
    parsed.body = utils.normalize(parsed.body);

    this.path = parsed.path;
    this.content = parsed.body;
    this.yaml = parsed.yaml;
    const config: any = parsed.data;

    // If config is not empty configure the elements.
    if (!isEmpty(config)) {
      this.name = config.name || this.name;
      if (config.elements) {
        for (const k in config.elements) {
          const element = this.element(k);
          element.add(config.elements[k].points);
          // element.hidden = config.elements[k].hidden;
          this.elements[k] = element;
        }
      }
      if (config.themes) {
        for (const k in config.themes) {
          const theme = this.theme(k);
          theme.elements = config.themes[k].elements;
        }
      }
    }

    return this;
  }

  /**
   * Replace Element
   * : When replacing ensure characters match points generated from "toRanges" or provide a single string INCLUDING characters which may be ignored. The replace method will filter or ignore characters NOT maching your defined points/element.
   *
   * @param name the name of the element to replace content for.
   * @param val the value(s) for replacement or complete Goticon containing changes.
   * @param repeat when true a string val is repeated for each character.
   */
  replace(name: string | IElement, val: string | string[], repeat?: boolean);

  /**
    * Replace Element
    * : When replacing ensure characters match points generated from "toRanges" or provide a single string INCLUDING characters which may be ignored. The replace method will filter or ignore characters NOT maching your defined points/element.
    *
    * @param name the name of the element to replace content for.
    * @param val the value(s) for replacement or complete Goticon containing changes.
    * @param content optional main content string.
    * @param repeat when true a string val is repeated for each character.
    */
  replace(name: string | IElement, val: string | string[], content?: string, repeat?: boolean);

  replace(name: string | IElement, val: string | string[], content?: string | boolean, repeat?: boolean) {

    if (isBoolean(content)) {
      repeat = <boolean>content;
      content = undefined;
    }

    content = content || this.content;

    let element = <IElement>name;

    if (isString(name))
      element = this.element(<string>name);

    if (!element)
      throw new Error('cannot replace using element of undefined.');

    if (repeat && !isString(val))
      throw new Error(`Cannot replace using type ${typeof val}, a string is required.`);

    let arr = <string[]>val;

    if (!repeat || (isArray(arr) && arr.length === 1))
      arr = this.mapToArray(element, <string>val[0]);

    if (!repeat) {
      if (element.points.length > arr.length)
        throw new Error(
          `replace failed, requires ${
          element.points.length
          } values but got only ${arr.length}.`
        );
    }

    const ranges = this.toRanges(element.points);
    const lines = utils.toLines(<string>content);

    ranges.forEach((range: IRange, i) => {
      const line = lines[range.row];
      const head = line.slice(0, range.start);
      const tail = line.slice(range.end + 1, line.length);
      let replaced;
      if (repeat)
        replaced = val;
      else
        replaced = arr[i];
      lines[range.row] = head + replaced + tail;
    });

    return lines.join('\n');

  }

  /**
   * Find
   * : Finds an elements by coordinate(s).
   *
   * @param x the x coordinate to find by.
   * @param y the y coordinate to find by.
   */
  find(x?: number, y?: number): IElement[] {
    let elements = [];
    for (const k in this.elements) {
      const ranges = this.toRanges(this.elements[k].points);
      const found = ranges.some((r) => {
        if (isValue(x) && isValue(y))
          return r.row === y && (x >= r.start && x <= r.end);
        if (isValue(y))
          return r.row === y
        if (isValue(x))
          return (x >= r.start && x <= r.end);
      });
      if (found) elements.push(this.elements[k]);
    }
    return elements;
  }

  /**
   * Element
   * : Gets or sets a new element.
   *
   * @param name the name of the element to get or set.
   * @param x the x point(s).
   * @param y the y point(s).
   */
  element(name: string, x?: Points | IPoint[], y?: Points, ): IElement {

    if (!x && this.elements[name])
      return this.elements[name];

    let element: IElement = {
      name: name
    };

    element.points = this.toPointSets(x, y);

    const toggleHidden = (theme: (string | ITheme)[], visible: true | false) => {

      if (!theme.length)
        theme.push('default');

      theme = toArray<string | ITheme>(theme);

      theme.forEach((k) => {
        const _theme = isString(k) ? this.theme(<string>k) : k as ITheme;

        _theme.elements[element.name].hidden = visible;
      });

      return element;

    };

    element.add = (x: Points | IPoint[], y?: Points): IElement => {
      let pointSets = this.toPointSets(x, y);
      pointSets = this.uniquePoints(element, pointSets);
      element.points = element.points.concat(pointSets);
      return element;
    };

    element.styles = (styles: AnsiStyles | AnsiStyles[], theme?: string | ITheme): IElement => {

      theme = theme || 'default';

      if (isString(theme))
        theme = this.theme(<string>theme) as ITheme;

      (theme as ITheme).styles(element, toArray<AnsiStyles>(styles));

      return element;

    };

    element.replace = (val: string | string[], theme?: string | ITheme) => {

      theme = theme || 'default';

      if (isString(theme))
        theme = <ITheme>this.theme(<string>theme);

      (theme as ITheme).replace(element, toArray<string>(val));

      return element;

    };

    element.show = (...theme: (string | ITheme)[]) => {
      return toggleHidden(theme, false);
    };

    element.hide = (...theme: (string | ITheme)[]) => {
      return toggleHidden(theme, true);
    };

    element.remove = () => {
      for (const k in this.themes) {
        const theme: ITheme = this.themes[k];
        delete theme.elements[name];
      }
      delete this.elements[name];
    };

    element.element = this.element; // for chaining.

    this.elements[element.name] = element;

    return element;

  }

  /**
   * Theme
   * : Gets or creates a theme.
   *
   * @param name the name of the theme to get or create.
   * @param elements
   * @param styles
   */
  theme(name: string): ITheme {

    if (this.themes[name])
      return this.themes[name];

    const theme: ITheme = {
      name: name,
      elements: {}
    };

    const ensureThemeElement = (element: string | IElement) => {

      if (isString(element))
        element = this.element(<string>element);

      const name = (element as IElement).name;

      if (!theme.elements[name])
        theme.elements[name] = {
          element: name
        };

      return theme.elements[name];

    };

    const toggleHidden = (element: (string | IElement)[] = null, visible: true | false) => {

      let elements = toArray<string | IElement>(element);

      // If not specific elements to show toggle all to show.
      if (!elements.length)
        elements = keys(theme.elements);

      elements.forEach((el) => {
        if (!isString(el))
          el = (el as IElement).name;
        theme.elements[<string>el].hidden = false;
      });

      return theme;

    };

    theme.styles = (element: string | IElement, ...styles: RestParam<AnsiStyles>) => {
      const themeElem = ensureThemeElement(element);
      themeElem.styles = flatten<AnsiStyles>(styles);
      return theme;
    };

    theme.replace = (element: string | IElement, ...val: RestParam<string>) => {
      const themeElem = ensureThemeElement(element);
      themeElem.replace = flatten<string>(val);
      return theme;
    };

    theme.show = (...element: (string | IElement)[]) => {
      return toggleHidden(element, false);
    };

    theme.hide = (...element: (string | IElement)[]) => {
      return toggleHidden(element, true);
    };

    theme.inherit = (...themes: (string | ITheme)[]) => {

      let _themes = themes.filter((t) => {
        return t !== 'default' && (t as ITheme).name !== 'default';
      }).map<ITheme>((t) => {
        return isString(t) ? this.theme(<string>t) : t as ITheme;
      });

      _themes.unshift(this.theme('default'));

      _themes.forEach((t) => {

        for (const k in t.elements) {
          if (!theme.elements[k])
            theme.elements[k] = clone<IThemeElement>(t.elements[k]);
        }

      });

      return theme;

    };

    theme.remove = () => {
      delete this.themes[name];
    };

    this.themes[name] = theme;

    return theme;

  }

  /**
   * Remove Element
   * : Removes an element from the collection.
   *
   * @param name the name of the element to be removed.
   */
  removeElement(name: string) {
    delete this.elements[name];
    return this;
  }

  /**
   * Remove Theme
   * : Removes a theme from the collection.
   *
   * @param name the name of the theme to be removed.
   */
  removeTheme(name: string) {
    // Don't remove default theme.
    if (name === 'default') return this;
    delete this.themes[name];
    return this;
  }

  /**
   * Grid
   * : Displays Goticon as grid for defining points for colorization.
   *
   * @param themeOrContent optional theme to apply to plot or custom content.
   * @param content optional content or uses stored value.
   */
  plot(themeOrContent?: string | ITheme, content?: string) {

    if (isString(themeOrContent) && !this.themes[<string>themeOrContent]) {
      content = <string>themeOrContent;
      themeOrContent = undefined;
    }

    content = content || this.content;
    themeOrContent = themeOrContent || 'default';

    const tmpPath = resolve(content);

    if (existsSync(tmpPath)) {
      const parsed = yaml.load(tmpPath);
      content = parsed.body;
    }

    if (!content.length)
      throw new Error('Whoops cannot plot Goticon using content of undefined.');

    if (utils.ANSI_EXP.test(content))
      content = colurs.strip(content);

    if (isString(themeOrContent))
      themeOrContent = this.theme(<string>themeOrContent);

    if (!themeOrContent)
      throw new Error('Cannot plot using missing or theme of undefined.');

    let rows = [];
    let maxLen = 0;

    const isOdd = n => {
      return n % 2;
    };

    const padLeft = (s, n) => {
      s = s + '';
      if (s.length < n) s = new Array(n).join('0') + s;
      return s;
    };

    // Hide elements and replace content for theme.
    keys((themeOrContent as ITheme).elements).forEach((key) => {
      const themeElem = (themeOrContent as ITheme).elements[key];
      if (themeElem.replace && !themeElem.hidden)
        content = this.replace(themeElem.element, themeElem.replace);
      if (themeElem.hidden)
        content = this.replace(themeElem.element, ' ', content, true);
    });

    content = utils.normalize(content);
    const lines = utils.toLines(content);

    // Iterate and split into single columns.
    lines.forEach((r, i) => {
      if (r.length > maxLen)
        maxLen = r.length;
      let row = r.split('');
      row.unshift(padLeft(i, (lines.length + '').length));
      rows.push(row);
    });

    const padLen = (maxLen + '').length;
    const dash = colurs.gray.dim('--');
    const sep = colurs.gray.dim('|');

    const grid = [];
    const hdr = [' '];
    const align = ['l'];
    const btm: any = [' '];
    let ctr = 0;

    // build the header row and
    // build bottom fill rows.
    while (ctr < maxLen) {
      hdr.push(padLeft(ctr, padLen));
      align.push('c');
      btm.push(dash);
      ctr++;
    }

    rows.unshift(hdr);
    rows.forEach((r, i) => {
      if (i)
        grid.push(btm);
      grid.push(r);
    });

    const _table = table(grid, {
      hsep: sep,
      align: align,
      stringLength: s => colurs.strip(s).length
    });

    return _table;
  }

  /**
   * Render
   * : Renders the content with optional theme.
   *
   * @param theme the theme to use to colorize the content.
   */
  render(theme?: string | false | ITheme) {

    if (theme === false)
      return this.content;

    let content = this.content;
    theme = theme || 'default';

    if (!this.content.length)
      throw new Error('Whoops cannot render Goticon using content of undefined.');

    if (isString(theme))
      theme = this.theme(theme as string);

    if (!theme)
      throw new Error(`failed to load theme ${theme}.`);

    let _theme: ITheme = <ITheme>theme;

    let elements = keys(_theme.elements);

    if (!elements.length)
      return content;

    // Replace any needed elements for the theme.
    elements.forEach((k, i) => {
      const themeElem = _theme.elements[k];
      if (themeElem.replace) {
        content = this.replace(k, themeElem.replace, content);
      }
    });

    // Convert to lines.
    let lines = utils.toLines(content);

    const indexes: any = {};
    const lastIndexes: any = {};
    const usedRanges = [];

    const validRange = (current: IRange) => {
      return usedRanges.filter((range: IRange) => {
        const isRow = current.row === range.row;
        if (isRow && (current.start >= range.start && current.end <= range.end))
          return true;
        return false;
      })[0];
    };

    // Iterate elements build style indexes for ranges.
    elements.forEach(k => {

      const element = this.element(k);
      const themeElem = _theme.elements[k];
      const ranges = this.toRanges(element.points);

      ranges.forEach(range => {

        if (!lines[range.row])
          return;

        const invalidRange = validRange(range);

        if (invalidRange)
          throw new Error(
            `render failed for element '${
            element.name
            }'.\n  range:    '${inspect(
              range,
              null,
              null,
              true
            )}\n  conflict: ${inspect(invalidRange, null, null, true)}\n`
          );

        let line = lines[range.row];
        line = colurs.strip(line);

        let orig, styled;
        const head = line.slice(0, range.start);
        const tail = line.slice(range.end + 1, line.length);

        // If not hidden stylize and then index line.
        if (!themeElem.hidden) {

          styled = (orig = line.slice(range.start, range.end + 1));
          if (themeElem.styles && themeElem.styles.length)
            styled = colurs.applyAnsi(styled, themeElem.styles) as string;
          line = head + styled + tail;
          const obj = (indexes[range.row] = indexes[range.row] || {});
          const lastIdx = (lastIndexes[range.row] = lastIndexes[range.row] || {});
          const indexedLine = utils.indexAnsi(line).indexes;

          for (const k in indexedLine) {
            if (obj[k]) {
              if ((lastIdx[k] || 0) > range.end) obj[k] = indexedLine[k] + obj[k];
              else obj[k] = obj[k] + indexedLine[k];
            } else {
              obj[k] = indexedLine[k];
            }
            lastIdx[k] = range.end;
          }

          usedRanges.push(range);

        }

        // For hidden elemnts just replace range with spaces update line.
        else {
          styled = ' '.repeat((range.end - range.start) + 1);
          lines[range.row] = head + styled + tail;
        }

      });

    });

    keys(indexes).forEach(i => {
      lines[i] = utils.revertAnsi(lines[i], indexes[i]);
    });

    return lines.join('\n');
  }

  /**
   * Render To
   * : Outputs rendered content to path.
   *
   * @param path the output path to render to.
   * @param theme the theme to use to colorize the content.
   */
  renderTo(path: string, theme?: string | false | ITheme) {
    if (!path) throw new Error(`cannot render using path of undefined.`);
    const content = this.render(theme);
    writeFileSync(resolve(path), content);
    return this;
  }

  /**
   * Reset
   * : Clears elements and themes.
   *
   * @param elements optional object containing elements to reset with.
   */
  reset(elements?: IMap<IElement>) {
    this.elements = elements || {};
    this.themes = {};
    this.theme('default');
    return this;
  }

  /**
   * Duplicate
   * : Duplicate the current Goticon.
   *
   * @param name the name of the duplicate Goticon.
   * @param path optional path that defaults to current using name above.
   */
  duplicate(name: string, path?: string) {
    if (!path) {
      const parsed = parse(this.path);
      path = join(parsed.dir, name + parsed.ext);
    } else {
      path = resolve(path);
    }

    // Define new Goticon.
    const goticon = new Goticon(name, path, this.content);

    // Duplicate elements.
    for (const k in this.elements) {
      const element = goticon.element(k);
      element.add(this.elements[k].points);
      goticon.elements[k] = element;
    }

    // Duplicate themes.
    for (const k in this.themes) {
      const theme = goticon.theme(k);
      theme.elements = this.themes[k].elements;
    }

    // Return the duplicated Goticon.
    return goticon;
  }

  /**
   * Save
   * : Persists Goticon to file sysem.
   *
   * @param config whether to include config as front matter.
   * @param content optional content instead of using internal this.content
   */
  save(config: boolean, content?: string): Goticon;

  /**
   * Save
   * : Persists Goticon to file sysem.
   *
   * @param path the path to output the current content to.
   * @param content optional content instead of using internal this.content
   */
  save(path: string, content?: string): Goticon;

  /**
   * Save
   * : Persists Goticon to file sysem.
   *
   * @param path the path to output the current content to.
   * @param config whether to include config as front matter.
   * @param content optional content instead of using internal this.content
   */
  save(path?: string, config?: boolean, content?: string): Goticon;
  save(path?: string | boolean, config?: boolean | string, content?: string): Goticon {

    if (isString(config)) {
      content = <string>config;
      config = undefined;
    }

    if (isBoolean(path)) {
      content = <string>config;
      config = <boolean>path;
      path = undefined;
    }

    path = path || this.path;
    config = !isValue(config) ? true : config;
    content = content || this.content;

    if (!path)
      path = this.path = resolve(join('./goticons', this.name + '.goticon'));

    if (isWindows()) content = content.replace(/(\r?\n)/, EOL);

    if (config) {
      const matter = this.toYAML();
      content = YAML_TEMPLATE.replace('{{YAML}}', matter) + content;
    }

    const dir = dirname(<string>path);

    if (!existsSync(dir)) mkdirSync(dir);

    writeFileSync(<string>path, content, 'utf8');

    return this;
  }

  /**
   * Save Render
   * : Like save but saves rendered content.
   *
   * @param theme the theme to be applied.
   * @param config whether to include element/theme config or not.
   */
  saveRendered(theme?: string | false | ITheme, config?: boolean): Goticon;

  /**
   * Save Render
   * : Like save but saves rendered content.
   *
   * @param theme the theme to be applied.
   * @param path optional path to save to.
   * @param config whether to include element/theme config or not.
   */
  saveRendered(theme?: string | false | ITheme, path?: string | boolean, config?: boolean
  ): Goticon;

  saveRendered(theme?: string | false | ITheme, path?: string | boolean, config?: boolean
  ): Goticon {
    const content = this.render(theme);
    return this.save(path, config, content);
  }
}
