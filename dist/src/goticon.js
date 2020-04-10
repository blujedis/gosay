"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chek_1 = require("chek");
const table = require("text-table");
const colurs_1 = require("colurs");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const util_1 = require("util");
const yaml = require("./yaml");
const utils = require("./utils");
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
const YAML_TEMPLATE = '---' + os_1.EOL + os_1.EOL +
    '# YAML CONFIGURATION: This section contains element and theme ' + os_1.EOL +
    '# settings for rendering this Goticon. If you DO NOT wish to ' + os_1.EOL +
    '# store configuration settings use .save(false).' + os_1.EOL + os_1.EOL +
    '{{YAML}}' + os_1.EOL +
    '---' + os_1.EOL;
let colurs = new colurs_1.Colurs();
class Goticon {
    constructor(name, path, content) {
        this.elements = {};
        this.themes = {};
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
    toPointSets(x, y) {
        if (!x && !y)
            return [];
        if (chek_1.isArray(x) && chek_1.isPlainObject(x[0]))
            // is a point set
            return x;
        return [{ x: chek_1.toArray(x), y: chek_1.toArray(y) }];
    }
    /**
     * Unique Points
     * : Ensures points are unique.
     *
     * @param element the element to compare points against.
     * @param points points to compare returning unique points.
     */
    uniquePoints(element, points) {
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
    toYAML() {
        const clone = {};
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
    mapToArray(name, val) {
        if (!chek_1.isString(name))
            name = name.name;
        let lines = utils.toLines(val);
        let linesContent = utils.toLines(this.content);
        // All rows were passed just return the string.
        if (lines.length === linesContent.length)
            return lines;
        const result = [];
        const element = this.element(name);
        const ranges = this.toRanges(element.points);
        const offset = ranges[0].row; // the starting row.
        const pad = ranges.reduce((prev, cur) => {
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
    fillRange(start, end) {
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
        return chek_1.keys(this.elements).length;
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
    toRange(x, y) {
        const ranges = [];
        const _stats = utils.stats(this.content);
        if (!chek_1.isValue(x))
            return ranges;
        x = chek_1.toArray(x).slice(0);
        y = chek_1.toArray(y).slice(0);
        if (x[1] === '*')
            x[1] = _stats.columns;
        if (x[1] && x[0] === '*')
            x[0] = 0;
        if (y[1] === '*') {
            y[1] = _stats.lines.length - 1;
            y.push('range');
        }
        if (y[1] && y[0] === '*') {
            y[0] = 0;
            y.push('range');
        }
        const rangeX = /r(ange)?/.test(chek_1.last(x) || '');
        const rangeY = /r(ange)?/.test(chek_1.last(y) || '');
        // If last is x or y is range remove.
        if (rangeX)
            x.pop();
        if (rangeY)
            y.pop();
        // Feel the range of rows.
        if (rangeY)
            y = this.fillRange(y[0], y[1]);
        y.forEach(r => {
            if (x.length > 2 || !rangeX) {
                x.forEach(p => {
                    ranges.push({
                        row: r,
                        start: p,
                        end: p
                    });
                });
            }
            else {
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
    toRanges(points) {
        let ranges = [];
        points.forEach(p => {
            ranges = ranges.concat(this.toRange(p.x, p.y));
        });
        chek_1.orderBy(ranges, 'row', 'start');
        return ranges;
    }
    /**
     * Parse
     * : Parses raw content for YAML.
     *
     * @param pathOrContent the file path to be parsed for YAML.
     * @param content optional raw static content to parse for YAML.
     */
    parse(pathOrContent, content) {
        if (!/\.goticon$/.test(pathOrContent)) {
            content = pathOrContent;
            pathOrContent = undefined;
        }
        pathOrContent = pathOrContent || this.path;
        const ext = path_1.extname(pathOrContent || '');
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
    load(pathOrContent, content) {
        const parsed = this.parse(pathOrContent, content);
        parsed.body = utils.normalize(parsed.body);
        this.path = parsed.path;
        this.content = parsed.body;
        this.yaml = parsed.yaml;
        const config = parsed.data;
        // If config is not empty configure the elements.
        if (!chek_1.isEmpty(config)) {
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
    replace(name, val, content, repeat) {
        if (chek_1.isBoolean(content)) {
            repeat = content;
            content = undefined;
        }
        content = content || this.content;
        let element = name;
        if (chek_1.isString(name))
            element = this.element(name);
        if (!element)
            throw new Error('cannot replace using element of undefined.');
        if (repeat && !chek_1.isString(val))
            throw new Error(`Cannot replace using type ${typeof val}, a string is required.`);
        let arr = val;
        if (!repeat || (chek_1.isArray(arr) && arr.length === 1))
            arr = this.mapToArray(element, val[0]);
        if (!repeat) {
            if (element.points.length > arr.length)
                throw new Error(`replace failed, requires ${element.points.length} values but got only ${arr.length}.`);
        }
        const ranges = this.toRanges(element.points);
        const lines = utils.toLines(content);
        ranges.forEach((range, i) => {
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
    find(x, y) {
        let elements = [];
        for (const k in this.elements) {
            const ranges = this.toRanges(this.elements[k].points);
            const found = ranges.some((r) => {
                if (chek_1.isValue(x) && chek_1.isValue(y))
                    return r.row === y && (x >= r.start && x <= r.end);
                if (chek_1.isValue(y))
                    return r.row === y;
                if (chek_1.isValue(x))
                    return (x >= r.start && x <= r.end);
            });
            if (found)
                elements.push(this.elements[k]);
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
    element(name, x, y) {
        if (!x && this.elements[name])
            return this.elements[name];
        let element = {
            name: name
        };
        element.points = this.toPointSets(x, y);
        const toggleHidden = (theme, visible) => {
            if (!theme.length)
                theme.push('default');
            theme = chek_1.toArray(theme);
            theme.forEach((k) => {
                const _theme = chek_1.isString(k) ? this.theme(k) : k;
                _theme.elements[element.name].hidden = visible;
            });
            return element;
        };
        element.add = (x, y) => {
            let pointSets = this.toPointSets(x, y);
            pointSets = this.uniquePoints(element, pointSets);
            element.points = element.points.concat(pointSets);
            return element;
        };
        element.styles = (styles, theme) => {
            theme = theme || 'default';
            if (chek_1.isString(theme))
                theme = this.theme(theme);
            theme.styles(element, chek_1.toArray(styles));
            return element;
        };
        element.replace = (val, theme) => {
            theme = theme || 'default';
            if (chek_1.isString(theme))
                theme = this.theme(theme);
            theme.replace(element, chek_1.toArray(val));
            return element;
        };
        element.show = (...theme) => {
            return toggleHidden(theme, false);
        };
        element.hide = (...theme) => {
            return toggleHidden(theme, true);
        };
        element.remove = () => {
            for (const k in this.themes) {
                const theme = this.themes[k];
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
    theme(name) {
        if (this.themes[name])
            return this.themes[name];
        const theme = {
            name: name,
            elements: {}
        };
        const ensureThemeElement = (element) => {
            if (chek_1.isString(element))
                element = this.element(element);
            const name = element.name;
            if (!theme.elements[name])
                theme.elements[name] = {
                    element: name
                };
            return theme.elements[name];
        };
        const toggleHidden = (element = null, visible) => {
            let elements = chek_1.toArray(element);
            // If not specific elements to show toggle all to show.
            if (!elements.length)
                elements = chek_1.keys(theme.elements);
            elements.forEach((el) => {
                if (!chek_1.isString(el))
                    el = el.name;
                theme.elements[el].hidden = false;
            });
            return theme;
        };
        theme.styles = (element, ...styles) => {
            const themeElem = ensureThemeElement(element);
            themeElem.styles = chek_1.flatten(styles);
            return theme;
        };
        theme.replace = (element, ...val) => {
            const themeElem = ensureThemeElement(element);
            themeElem.replace = chek_1.flatten(val);
            return theme;
        };
        theme.show = (...element) => {
            return toggleHidden(element, false);
        };
        theme.hide = (...element) => {
            return toggleHidden(element, true);
        };
        theme.inherit = (...themes) => {
            let _themes = themes.filter((t) => {
                return t !== 'default' && t.name !== 'default';
            }).map((t) => {
                return chek_1.isString(t) ? this.theme(t) : t;
            });
            _themes.unshift(this.theme('default'));
            _themes.forEach((t) => {
                for (const k in t.elements) {
                    if (!theme.elements[k])
                        theme.elements[k] = chek_1.clone(t.elements[k]);
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
    removeElement(name) {
        delete this.elements[name];
        return this;
    }
    /**
     * Remove Theme
     * : Removes a theme from the collection.
     *
     * @param name the name of the theme to be removed.
     */
    removeTheme(name) {
        // Don't remove default theme.
        if (name === 'default')
            return this;
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
    plot(themeOrContent, content) {
        if (chek_1.isString(themeOrContent) && !this.themes[themeOrContent]) {
            content = themeOrContent;
            themeOrContent = undefined;
        }
        content = content || this.content;
        themeOrContent = themeOrContent || 'default';
        const tmpPath = path_1.resolve(content);
        if (fs_1.existsSync(tmpPath)) {
            const parsed = yaml.load(tmpPath);
            content = parsed.body;
        }
        if (!content.length)
            throw new Error('Whoops cannot plot Goticon using content of undefined.');
        if (utils.ANSI_EXP.test(content))
            content = colurs.strip(content);
        if (chek_1.isString(themeOrContent))
            themeOrContent = this.theme(themeOrContent);
        if (!themeOrContent)
            throw new Error('Cannot plot using missing or theme of undefined.');
        let rows = [];
        let maxLen = 0;
        const isOdd = n => {
            return n % 2;
        };
        const padLeft = (s, n) => {
            s = s + '';
            if (s.length < n)
                s = new Array(n).join('0') + s;
            return s;
        };
        // Hide elements and replace content for theme.
        chek_1.keys(themeOrContent.elements).forEach((key) => {
            const themeElem = themeOrContent.elements[key];
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
        const btm = [' '];
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
    render(theme) {
        if (theme === false)
            return this.content;
        let content = this.content;
        theme = theme || 'default';
        if (!this.content.length)
            throw new Error('Whoops cannot render Goticon using content of undefined.');
        if (chek_1.isString(theme))
            theme = this.theme(theme);
        if (!theme)
            throw new Error(`failed to load theme ${theme}.`);
        let _theme = theme;
        let elements = chek_1.keys(_theme.elements);
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
        const indexes = {};
        const lastIndexes = {};
        const usedRanges = [];
        const validRange = (current) => {
            return usedRanges.filter((range) => {
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
                    throw new Error(`render failed for element '${element.name}'.\n  range:    '${util_1.inspect(range, null, null, true)}\n  conflict: ${util_1.inspect(invalidRange, null, null, true)}\n`);
                let line = lines[range.row];
                line = colurs.strip(line);
                let orig, styled;
                const head = line.slice(0, range.start);
                const tail = line.slice(range.end + 1, line.length);
                // If not hidden stylize and then index line.
                if (!themeElem.hidden) {
                    styled = (orig = line.slice(range.start, range.end + 1));
                    if (themeElem.styles && themeElem.styles.length)
                        styled = colurs.applyAnsi(styled, themeElem.styles);
                    line = head + styled + tail;
                    const obj = (indexes[range.row] = indexes[range.row] || {});
                    const lastIdx = (lastIndexes[range.row] = lastIndexes[range.row] || {});
                    const indexedLine = utils.indexAnsi(line).indexes;
                    for (const k in indexedLine) {
                        if (obj[k]) {
                            if ((lastIdx[k] || 0) > range.end)
                                obj[k] = indexedLine[k] + obj[k];
                            else
                                obj[k] = obj[k] + indexedLine[k];
                        }
                        else {
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
        chek_1.keys(indexes).forEach(i => {
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
    renderTo(path, theme) {
        if (!path)
            throw new Error(`cannot render using path of undefined.`);
        const content = this.render(theme);
        fs_1.writeFileSync(path_1.resolve(path), content);
        return this;
    }
    /**
     * Reset
     * : Clears elements and themes.
     *
     * @param elements optional object containing elements to reset with.
     */
    reset(elements) {
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
    duplicate(name, path) {
        if (!path) {
            const parsed = path_1.parse(this.path);
            path = path_1.join(parsed.dir, name + parsed.ext);
        }
        else {
            path = path_1.resolve(path);
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
    save(path, config, content) {
        if (chek_1.isString(config)) {
            content = config;
            config = undefined;
        }
        if (chek_1.isBoolean(path)) {
            content = config;
            config = path;
            path = undefined;
        }
        path = path || this.path;
        config = !chek_1.isValue(config) ? true : config;
        content = content || this.content;
        if (!path)
            path = this.path = path_1.resolve(path_1.join('./goticons', this.name + '.goticon'));
        if (chek_1.isWindows())
            content = content.replace(/(\r?\n)/, os_1.EOL);
        if (config) {
            const matter = this.toYAML();
            content = YAML_TEMPLATE.replace('{{YAML}}', matter) + content;
        }
        const dir = path_1.dirname(path);
        if (!fs_1.existsSync(dir))
            fs_1.mkdirSync(dir);
        fs_1.writeFileSync(path, content, 'utf8');
        return this;
    }
    saveRendered(theme, path, config) {
        const content = this.render(theme);
        return this.save(path, config, content);
    }
}
exports.Goticon = Goticon;
//# sourceMappingURL=goticon.js.map