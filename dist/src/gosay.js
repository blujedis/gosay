"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const fs_1 = require("fs");
const path_1 = require("path");
const colurs_1 = require("colurs");
const chek_1 = require("chek");
const goticon_1 = require("./goticon");
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
const DEFAULTS = {
    goticon: undefined,
    directory: './goticons',
    width: 36,
    padding: 2,
    align: 'center',
    positionX: 'right',
    positionY: 'middle',
    gutter: 2,
    border: 'round',
    borderStyle: null,
    wrapper: os_1.EOL,
    colorize: true // enables/disables colorization.
};
class Gosay {
    constructor(options) {
        options = options || {};
        this.options = chek_1.extend({}, DEFAULTS, options);
        this._colurs = new colurs_1.Colurs({ enabled: this.options.colorize });
    }
    /**
     * Equal Parts
     * : Gets equal parts using divisor adds remainder if any.
     *
     * @param value the value to be divided.
     * @param divisor the value to divide by.
     */
    equalParts(value, divisor) {
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
    parseGoticon(goticon) {
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
    normalizeRow(row, len, max) {
        const options = this.options;
        const layout = BOXES[options.border];
        const spacing = this.equalParts(max - len);
        const padding = ' '.repeat(options.padding);
        const prefix = ' '.repeat(spacing.start);
        const suffix = ' '.repeat(spacing.end);
        let vertical = layout.vertical;
        if (options.borderStyle)
            vertical = this._colurs.applyAnsi(vertical, options.borderStyle);
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
    wrap(msg) {
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
    read(path) {
        return fs_1.readFileSync(path_1.resolve(path), 'utf8');
    }
    /**
     * Goticon
     * : Creates a new Goticon.
     *
     * @param name the name of the Goticon.
     * @param path the path to the goticon.
     * @param content static or default content for the Goticon.
     */
    goticon(name, content, path) {
        const defaultPath = path_1.join(this.options.directory, name + '.goticon');
        path = path_1.resolve(path || defaultPath);
        return new goticon_1.Goticon(name, path, content);
    }
    /**
     * Set Option
     * : Sets an options.
     *
     * @param key the option key.
     * @param val the value for the key.
     */
    setOption(key, val) {
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
    boxify(msg) {
        const options = this.options;
        const layout = BOXES[options.border];
        let boxTop = layout.topLeft +
            layout.horizontal.repeat(options.width - 2) +
            layout.topRight;
        const boxRows = this.wrap(msg);
        const boxInner = boxRows.join('\n');
        let boxBottom = layout.bottomLeft +
            layout.horizontal.repeat(options.width - 2) +
            layout.bottomRight;
        if (options.borderStyle) {
            boxTop = this._colurs.applyAnsi(boxTop, options.borderStyle);
            boxBottom = this._colurs.applyAnsi(boxBottom, options.borderStyle);
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
    configure(msg, goticon, options) {
        options = chek_1.extend({}, this.options, options);
        if (!msg)
            return '\nWhoops nothing to say...\n';
        let append, prepend;
        goticon = goticon || options.goticon || '';
        const wrapper = chek_1.toArray(options.wrapper);
        prepend = wrapper[0] || '';
        append = wrapper[1] || wrapper[0] || '';
        if (chek_1.isString(goticon) && PATH_LIKE.test(goticon))
            goticon = this.read(goticon);
        else if (chek_1.isObject(goticon))
            goticon = goticon.render();
        // If options doesn't contain a goticon
        // and one has been passed update.
        if (goticon && (!this.options.goticon || chek_1.isEmpty(this.options.goticon)))
            this.options.goticon = goticon;
        if (!goticon.length)
            options.gutter = 0;
        const boxified = this.boxify(msg);
        const parsedGoticon = this.parseGoticon(goticon);
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
    say(msg, goticon, options) {
        msg = this.configure(msg, goticon, options);
        console.log(msg);
        return this;
    }
}
exports.Gosay = Gosay;
/**
 *  Get
 * : Gets an instance of Gosay. Handly when using
 * require can call require('gosay').get().
 *
 * @param text the text message to be displayed.
 * @param goticon the ansi artwork shown adjacent to the message box.
 * @param options the Gosay options object.
 */
function init(options) {
    return new Gosay(options);
}
exports.init = init;
//# sourceMappingURL=gosay.js.map