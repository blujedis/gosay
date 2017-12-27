"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
var fs_1 = require("fs");
var path_1 = require("path");
var colurs_1 = require("colurs");
var chek_1 = require("chek");
var goticon_1 = require("./goticon");
// WARNING: this suits the need here
// but not remotely complete.
var PATH_LIKE = /^\.?(\\|\/)?.*\.[a-z]+$/;
/**
 * @see https://github.com/sindresorhus/cli-boxes/blob/master/boxes.json
 */
var BOXES = {
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
var DEFAULTS = {
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
var Gosay = /** @class */ (function () {
    function Gosay(options) {
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
    Gosay.prototype.equalParts = function (value, divisor) {
        divisor = divisor || 2;
        var start = ~~(value / divisor);
        var remainder = value % divisor;
        var end = start + remainder;
        return {
            start: start,
            end: end,
            remainder: remainder
        };
    };
    /**
      * Parse Goticon
      * : Parses the ansi artwork counting lines, finding longest line.
      *
      * @param goticon the ansi artwork to parse.
      */
    Gosay.prototype.parseGoticon = function (goticon) {
        var _this = this;
        var rows = goticon.split(/\r?\n/);
        var longest = rows.reduce(function (a, b) {
            a = _this._colurs.strip(a);
            b = _this._colurs.strip(b);
            return a.length > b.length ? a : b;
        });
        var width = longest.length;
        return {
            goticon: goticon,
            rows: rows,
            width: width
        };
    };
    /**
     * Compile
     * : Compiles the row spacing and padding.
     *
     * @param row the row to be spaced, padded and compiled.
     * @param len the length of the row.
     * @param max the max length allowable for the row.
     */
    Gosay.prototype.normalizeRow = function (row, len, max) {
        var options = this.options;
        var layout = BOXES[options.border];
        var spacing = this.equalParts(max - len);
        // console.log(spacing);
        var padding = ' '.repeat(options.padding);
        var prefix = ' '.repeat(spacing.start);
        var suffix = ' '.repeat(spacing.end);
        var vertical = layout.vertical;
        if (options.borderStyle)
            vertical = this._colurs.applyAnsi(vertical, options.borderStyle);
        if (options.align !== 'center')
            return vertical + padding + row + prefix + suffix + padding + vertical;
        else
            return vertical + padding + prefix + row + suffix + padding + vertical;
    };
    /**
     * Wrap
     * : Wraps text building rows for use withing text box.
     *
     * @param msg the message to wrap text for.
     */
    Gosay.prototype.wrap = function (msg) {
        var options = this.options;
        var matches = msg.split(' ');
        var maxLen = options.width - (options.padding * 2) - 2;
        var rows = [];
        var row = '';
        var rowStripped = '';
        if (matches === null)
            matches = [msg];
        while (matches.length) {
            var match = matches.shift() + ' ';
            var mStrip = this._colurs.strip(match);
            var mLen = mStrip.length;
            var rLen = rowStripped.length;
            if ((rLen + mLen) > maxLen) {
                rows.push(this.normalizeRow(row, rLen, maxLen));
                row = match;
                rowStripped = mStrip;
                if (!matches.length)
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
    };
    /**
     * Read
     * : Simply reads a file, useful for looking up pre-compiled Goticon images.
     *
     * @param path the path of the file to be read.
     */
    Gosay.prototype.read = function (path) {
        path = path_1.resolve(path);
        return fs_1.readFileSync(path, 'utf8');
    };
    /**
     * Goticon
     * : Creates a new Goticon.
     *
     * @param name the name of the Goticon.
     * @param path the path to the goticon.
     * @param content static or default content for the Goticon.
     */
    Gosay.prototype.goticon = function (name, content, path) {
        var defaultPath = path_1.join(this.options.directory, name + '.goticon');
        path = path_1.resolve(path || defaultPath);
        return new goticon_1.Goticon(name, path, content);
    };
    /**
     * Set Option
     * : Sets an options.
     *
     * @param key the option key.
     * @param val the value for the key.
     */
    Gosay.prototype.setOption = function (key, val) {
        this.options[key] = val;
    };
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
    Gosay.prototype.boxify = function (msg) {
        var options = this.options;
        var layout = BOXES[options.border];
        var boxTop = layout.topLeft +
            layout.horizontal.repeat(options.width - 2) +
            layout.topRight;
        var boxRows = this.wrap(msg);
        var boxInner = boxRows.join('\n');
        var boxBottom = layout.bottomLeft +
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
    };
    Gosay.prototype.configure = function (msg, goticon, options) {
        var _this = this;
        options = chek_1.extend({}, this.options, options);
        if (!msg)
            return '\nWhoops nothing to say...\n';
        var append, prepend;
        goticon = goticon || options.goticon || '';
        var wrapper = chek_1.toArray(options.wrapper);
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
        var boxified = this.boxify(msg);
        var parsedGoticon = this.parseGoticon(goticon);
        var goticonRows = parsedGoticon.rows;
        var boxRows = boxified.rows;
        var goticonRowsLen = parsedGoticon.rows.length;
        var boxRowsLen = boxified.rows.length;
        var adjustBox = goticonRowsLen > boxRowsLen;
        var boxRowsOffset = Math.max(0, goticonRowsLen - boxRowsLen);
        var goticonRowsOffset = Math.max(0, boxRowsLen - goticonRowsLen);
        var goticonRowsAdjust = this.equalParts(goticonRowsOffset);
        var boxRowsAdjust = this.equalParts(boxRowsOffset);
        var adjustedRows = adjustBox ? boxRows : goticonRows;
        var adjuster = adjustBox ? boxRowsAdjust : goticonRowsAdjust;
        var adjusterWidth = adjustBox ? options.width : parsedGoticon.width;
        var posX = options.positionX;
        var posY = options.positionY;
        var goticonMaxWidth = parsedGoticon.width;
        // Compile the adjuster rows.
        var adjusterRow = ' '.repeat(adjusterWidth);
        var ct = adjuster.start + adjuster.end;
        var padRows = [];
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
        var table = [];
        var gutter = ' '.repeat(options.gutter || 0);
        goticonRows.forEach(function (r, i) {
            var row;
            var boxRow = boxRows.shift() || '';
            var logoRowLen = r && _this._colurs.strip(r).length;
            var boxRowLen = boxRow && _this._colurs.strip(boxRow).length;
            // Ensure goticon rows are all same width.
            r += ' '.repeat(Math.max(0, parsedGoticon.width - logoRowLen));
            if (posX === 'right')
                row = r + gutter + boxRow;
            else
                row = boxRow + gutter + r;
            table.push(row);
        });
        return prepend + table.join('\n') + append;
    };
    Gosay.prototype.say = function (msg, goticon, options) {
        msg = this.configure(msg, goticon, options);
        console.log(msg);
        return this;
    };
    return Gosay;
}());
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