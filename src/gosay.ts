import { EOL } from 'os';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, extname, basename } from 'path';
import { Colurs, IColurs } from 'colurs';
import { extend, isString, isRegExp, isNumber, split, contains, toArray, isPlainObject, keys, isArray, isObject, isEmpty } from 'chek';
import { Goticon } from './goticon';
import { IMap, IBox, IOptions } from './interfaces';

// WARNING: this suits the need here
// but not remotely complete.
const PATH_LIKE = /^\.?(\\|\/)?.*\.[a-z]+$/;

/**
 * @see https://github.com/sindresorhus/cli-boxes/blob/master/boxes.json
 */
const BOXES = {
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomRight: '┘',
    bottomLeft: '└',
    vertical: '│',
    horizontal: '─'
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomRight: '╝',
    bottomLeft: '╚',
    vertical: '║',
    horizontal: '═'
  },
  round: {
    topLeft: '╭',
    topRight: '╮',
    bottomRight: '╯',
    bottomLeft: '╰',
    vertical: '│',
    horizontal: '─'
  },
  'single-double': {
    topLeft: '╓',
    topRight: '╖',
    bottomRight: '╜',
    bottomLeft: '╙',
    vertical: '║',
    horizontal: '─'
  },
  'double-single': {
    topLeft: '╒',
    topRight: '╕',
    bottomRight: '╛',
    bottomLeft: '╘',
    vertical: '│',
    horizontal: '═'
  },
  classic: {
    topLeft: '+',
    topRight: '+',
    bottomRight: '+',
    bottomLeft: '+',
    vertical: '|',
    horizontal: '-'
  }
};

const DEFAULTS: IOptions = {
  goticon: undefined,         // the ansi artwork to be used.
  directory: './goticons',    // directory for predefined goticons.
  width: 36,                  // the max width of the message box.
  padding: 2,                 // the left/right box padding.
  align: 'center',            // the alignment of the text.
  positionX: 'right',         // the position horizontally (left/right of goticon).
  positionY: 'middle',        // the position veritically relative to the goticon.
  gutter: 2,                  // the gutter spaces between goticon and message box.
  border: 'round',            // the layout of message box.
  borderStyle: null,          // ansi color style to be applied to the border.
  wrapper: EOL,               // string to append to say. (default empty line)
  colorize: true              // enables/disables colorization.
};

export class Gosay {

  private _colurs: IColurs;

  options: IOptions;

  constructor(options?: IOptions) {

    options = options || {};
    this.options = extend({}, DEFAULTS, options);

    this._colurs = new Colurs({ enabled: this.options.colorize });

  }

  /**
   * Equal Parts
   * : Gets equal parts using divisor adds remainder if any.
   *
   * @param value the value to be divided.
   * @param divisor the value to divide by.
   */
  private equalParts(value: number, divisor?: number) {
    divisor = divisor || 2;
    const start = ~~(value / divisor);
    const remainder = value % divisor;
    const end = start + remainder;
    return {
      start,
      end,
      remainder
    };
  }

  /**
    * Parse Goticon
    * : Parses the ansi artwork counting lines, finding longest line.
    *
    * @param goticon the ansi artwork to parse.
    */
  private parseGoticon(goticon: string) {

    const rows = goticon.split(/\r?\n/);
    const longest = rows.reduce((a, b) => {
      a = this._colurs.strip(a);
      b = this._colurs.strip(b);
      return a.length > b.length ? a : b;
    });
    const width = longest.length;
    return {
      goticon,
      rows,
      width
    };
  }

  /**
   * Compile
   * : Compiles the row spacing and padding.
   *
   * @param row the row to be spaced, padded and compiled.
   * @param len the length of the row.
   * @param max the max length allowable for the row.
   */
  private normalizeRow(row: string, len: number, max: number) {

    const options = this.options;

    const layout = BOXES[options.border];
    const spacing = this.equalParts(max - len);

    // console.log(spacing);

    const padding = ' '.repeat(options.padding);
    const prefix = ' '.repeat(spacing.start);
    const suffix = ' '.repeat(spacing.end);

    let vertical = layout.vertical;

    if (options.borderStyle)
      vertical = this._colurs.applyAnsi(vertical, options.borderStyle) as string;

    if (options.align !== 'center')
      return vertical + padding + row + prefix + suffix + padding + vertical;

    else
      return vertical + padding + prefix + row + suffix + padding + vertical;

  }

  /**
   * Wrap
   * : Wraps text building rows for use withing text box.
   *
   * @param msg the message to wrap text for.
   */
  private wrap(msg: string) {

    const options = this.options;
    let matches = msg.split(' ');
    const maxLen = options.width - (options.padding * 2) - 2;
    const rows = [];

    let row = '';
    let rowStripped = '';

    if (matches === null)
      matches = [msg];

    while (matches.length) {
      let match = matches.shift() + ' ';
      let mStrip = this._colurs.strip(match);
      let mLen = mStrip.length;
      let rLen = rowStripped.length;
      if ((rLen + mLen) > maxLen) {
        rows.push(this.normalizeRow(row, rLen, maxLen));
        row = match;
        rowStripped = mStrip;
        if (!matches.length) // last element.
          rows.push(this.normalizeRow(row, mLen, maxLen));
      }
      else {
        row += match;
        rowStripped += mStrip;
        if (!matches.length) {
          rows.push(this.normalizeRow(row, rLen + mLen, maxLen));
        }
      }
    }

    return rows;
  }

  /**
   * Read
   * : Simply reads a file, useful for looking up pre-compiled Goticon images.
   *
   * @param path the path of the file to be read.
   */
  read(path: string) {
    path = resolve(path);
    return readFileSync(path, 'utf8');
  }

  /**
   * Goticon
   * : Creates a new Goticon.
   *
   * @param name the name of the Goticon.
   * @param path the path to the goticon.
   * @param content static or default content for the Goticon.
   */
  goticon(name: string, content?: string, path?: string) {
    const defaultPath = join(this.options.directory, name + '.goticon');
    path = resolve(path || defaultPath);
    return new Goticon(name, path, content);
  }

  /**
   * Set Option
   * : Sets an options.
   *
   * @param key the option key.
   * @param val the value for the key.
   */
  setOption(key: string, val: any) {
    this.options[key] = val;
  }

  /**
   * Boxify
   * : Boxify a message.
   *
   * @param msg the message to say.
   * @param layout the box layout to be used.
   * @param width the width of the message box.
   * @param padding the number of spaces to pad the message box.
   * @param align the text alignment within the box.
   */

  boxify(msg: string) {

    const options = this.options;
    const layout = BOXES[options.border];

    let boxTop =
      layout.topLeft +
      layout.horizontal.repeat(options.width - 2) +
      layout.topRight;

    const boxRows = this.wrap(msg);
    const boxInner = boxRows.join('\n');

    let boxBottom =
      layout.bottomLeft +
      layout.horizontal.repeat(options.width - 2) +
      layout.bottomRight;

    if (options.borderStyle) {
      boxTop = this._colurs.applyAnsi(boxTop, options.borderStyle) as string;
      boxBottom = this._colurs.applyAnsi(boxBottom, options.borderStyle) as string;
    }

    boxRows.unshift(boxTop);
    boxRows.push(boxBottom);

    return {
      top: boxTop,
      inner: boxInner,
      bottom: boxBottom,
      rows: boxRows,
      result: boxRows.join('\n')
    };

  }

  /**
   * Configure
   * : Configures a message.
   *
   * @param msg the message to boxify and display.
   */
  configure(msg: string): string;

  /**
   * Configure
   * : Configures a message.
   *
   * @param msg the message to boxify and display.
   * @param goticon the ansi artwork adjacent to message box.
   */
  configure(msg: string, goticon?: string | Goticon): string;

  /**
   * Configure
   * : Configures a message.
   *
   * @param msg the message to boxify and display.
   * @param goticon the ansi artwork adjacent to message box.
   * @param options options override for this message.
   */
  configure(msg: string, goticon?: string | Goticon, options?: IOptions): string;
  configure(msg: string, goticon?: string | Goticon, options?: IOptions): string {

    options = extend({}, this.options, options);

    if (!msg)
      return '\nWhoops nothing to say...\n';

    let append, prepend;
    goticon = goticon || options.goticon || '';
    const wrapper = toArray<string>(options.wrapper);

    prepend = wrapper[0] || '';
    append = wrapper[1] || wrapper[0] || '';

    if (isString(goticon) && PATH_LIKE.test(<string>goticon))
      goticon = this.read(<string>goticon);
    else if (isObject(goticon))
      goticon = (goticon as Goticon).render();

    // If options doesn't contain a goticon
    // and one has been passed update.
    if (goticon && (!this.options.goticon || isEmpty(this.options.goticon)))
      this.options.goticon = goticon;

    if (!(goticon as string).length)
      options.gutter = 0;

    const boxified = this.boxify(msg);
    const parsedGoticon = this.parseGoticon(goticon as string);
    let goticonRows = parsedGoticon.rows;
    let boxRows = boxified.rows;

    const goticonRowsLen = parsedGoticon.rows.length;
    const boxRowsLen = boxified.rows.length;
    const adjustBox = goticonRowsLen > boxRowsLen;

    const boxRowsOffset = Math.max(0, goticonRowsLen - boxRowsLen);
    const goticonRowsOffset = Math.max(0, boxRowsLen - goticonRowsLen);
    const goticonRowsAdjust = this.equalParts(goticonRowsOffset);
    const boxRowsAdjust = this.equalParts(boxRowsOffset);

    let adjustedRows = adjustBox ? boxRows : goticonRows;
    const adjuster = adjustBox ? boxRowsAdjust : goticonRowsAdjust;
    const adjusterWidth = adjustBox ? options.width : parsedGoticon.width;

    const posX = options.positionX;
    const posY = options.positionY;
    const goticonMaxWidth = parsedGoticon.width;

    // Compile the adjuster rows.
    const adjusterRow = ' '.repeat(adjusterWidth);
    let ct = adjuster.start + adjuster.end;
    const padRows = [];
    while (ct--)
      padRows.push(adjusterRow);

    if (posY === 'top') {
      adjustedRows = adjustedRows.concat(padRows);
    }
    else if (posY === 'middle') {
      adjustedRows =
        padRows.slice(0, adjuster.start)
          .concat(adjustedRows)
          .concat(padRows.slice(adjuster.start));
    }
    else {
      adjustedRows = padRows.concat(adjustedRows);
    }
    if (adjustBox)
      boxRows = adjustedRows;
    else
      goticonRows = adjustedRows;


    let table = [];
    const gutter = ' '.repeat(options.gutter || 0);
    goticonRows.forEach((r, i) => {

      let row;

      const boxRow = boxRows.shift() || '';
      const logoRowLen = r && this._colurs.strip(r).length;
      const boxRowLen = boxRow && this._colurs.strip(boxRow).length;

      // Ensure goticon rows are all same width.
      r += ' '.repeat(Math.max(0, parsedGoticon.width - logoRowLen));
      if (posX === 'right')
        row = r + gutter + boxRow;
      else
        row = boxRow + gutter + r;
      table.push(row);

    });

    return prepend + table.join('\n') + append;

  }

  /**
   * Say
   * : Outputs the configured or new message.
   *
   * @param msg the message to boxify and display.
   */
  say(msg: string): Gosay;

  /**
   * Say
   * : Outputs the configured message.
   *
   * @param msg the message to boxify and display.
   * @param goticon the ansi artwork adjacent to message box.
   */
  say(msg: string, goticon: string | Goticon): Gosay;

  /**
   * Say
   * : Outputs the configured message.
   *
   * @param msg the message to boxify and display.
   * @param goticon the ansi artwork adjacent to message box.
   * @param options overrides for options for this message.
   */
  say(msg: string, goticon: string | Goticon, options: IOptions): Gosay;
  say(msg: string, goticon?: string | Goticon, options?: IOptions): Gosay {
    msg = this.configure(msg, goticon, options);
    console.log(msg);
    return this;
  }

}

/**
 *  Get
 * : Gets an instance of Gosay. Handly when using
 * require can call require('gosay').get().
 *
 * @param text the text message to be displayed.
 * @param goticon the ansi artwork shown adjacent to the message box.
 * @param options the Gosay options object.
 */
export function init(options?: IOptions) {
  return new Gosay(options);
}
