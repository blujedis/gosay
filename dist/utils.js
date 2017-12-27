"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chek_1 = require("chek");
exports.ANSI_PATTERN = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
].join('|');
exports.ANSI_EXP = new RegExp(exports.ANSI_PATTERN, 'g');
/**
 * Normalize
 * : Iterates content and normalizes the length of each row.
 */
function normalize(content) {
    var _stats = stats(content);
    var rows = _stats.lines.map(function (s) {
        if (s.length < _stats.columns)
            s += ' '.repeat(_stats.columns - s.length);
        return s;
    });
    return rows.join('\n');
}
exports.normalize = normalize;
/**
 * Has ANSI
 * : Tests if string contains ANSI escape codes.
 *
 * @param val the value to inspect.
 */
function hasAnsi(val) {
    return exports.ANSI_EXP.test(val);
}
exports.hasAnsi = hasAnsi;
/**
  * Index ANSI
  * : Indexes all ASNI escape codes.
  *
  * @param val the value to index.
  * @param replace when NOT false matched values are replaced.
  */
function indexAnsi(val, replace) {
    var source = val;
    var indexes = {};
    val = val.replace(exports.ANSI_EXP, function (match, offset) {
        if (!match)
            return;
        chek_1.keys(indexes).forEach(function (key, i) {
            offset -= indexes[key].length;
        });
        indexes[offset] = indexes[offset] ? indexes[offset] + match : match;
        if (replace !== false)
            return '';
        return match;
    });
    return {
        source: source,
        modified: val,
        indexes: indexes
    };
}
exports.indexAnsi = indexAnsi;
/**
 * Revert ANSI
 * : Revert back to ANSI styles using indexes.
 *
 * @see https://github.com/yeoman/yosay/blob/master/index.js#L117
 *
 * @param val the value to revert.
 * @param indexes the indexes object for mapping back styles.
 */
function revertAnsi(val, indexes) {
    if (chek_1.isPlainObject(val)) {
        var obj = val;
        val = obj.modified;
        indexes = obj.indexes;
    }
    val = (val + ' ').replace(/./g, function (char, idx) {
        chek_1.keys(indexes).forEach(function (offset) {
            var continues = 0;
            var contiuesStyle;
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
exports.revertAnsi = revertAnsi;
/**
 * To Lines
 * : Converts string to lines of strings.
 *
 * @param val the value to split into lines.
 */
function toLines(val) {
    val = val.replace(/\r?\n/g, '\n');
    return val.split('\n');
}
exports.toLines = toLines;
/**
 * Stats
 * : Gets rows and columns for content.
 *
 * @param content optional content or stored value is used.
 */
function stats(content) {
    var lines = toLines(content);
    var columns = lines.reduce(function (a, b) { return a.length > b.length ? a : b; });
    return {
        columns: columns.length,
        rows: lines.length,
        lines: lines,
        content: content
    };
}
exports.stats = stats;
//# sourceMappingURL=utils.js.map