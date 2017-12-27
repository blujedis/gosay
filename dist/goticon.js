"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chek_1 = require("chek");
var table = require("text-table");
var colurs_1 = require("colurs");
var fs_1 = require("fs");
var path_1 = require("path");
var os_1 = require("os");
var util_1 = require("util");
var yaml = require("./yaml");
var utils = require("./utils");
var ANSI_PATTERN = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
].join('|');
var ANSI_EXP = new RegExp(ANSI_PATTERN, 'g');
var LOG_TYPES = {
    error: 'red',
    warn: 'yellow',
    notice: 'green'
};
var YAML_TEMPLATE = '---' + os_1.EOL + os_1.EOL +
    '# YAML CONFIGURATION: This section contains element and theme ' + os_1.EOL +
    '# settings for rendering this Goticon. If you DO NOT wish to ' + os_1.EOL +
    '# store configuration settings use .save(false).' + os_1.EOL + os_1.EOL +
    '{{YAML}}' + os_1.EOL +
    '---' + os_1.EOL;
var colurs = new colurs_1.Colurs();
var Goticon = /** @class */ (function () {
    function Goticon(name, path, content) {
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
    Goticon.prototype.toPointSets = function (x, y) {
        if (!x && !y)
            return [];
        if (chek_1.isArray(x) && chek_1.isPlainObject(x[0]))
            // is a point set
            return x;
        return [{ x: chek_1.toArray(x), y: chek_1.toArray(y) }];
    };
    /**
     * Unique Points
     * : Ensures points are unique.
     *
     * @param element the element to compare points against.
     * @param points points to compare returning unique points.
     */
    Goticon.prototype.uniquePoints = function (element, points) {
        var exists = function (val) {
            return element.points.some(function (p) {
                return JSON.stringify(p) === JSON.stringify(val);
            });
        };
        points = points.filter(function (p) {
            return !exists(p);
        });
        return points;
    };
    /**
     * To YAML
     * : Converts Goticon to YAML.
     */
    Goticon.prototype.toYAML = function () {
        var clone = {};
        clone.name = this.name;
        clone.elements = this.elements;
        clone.themes = this.themes;
        for (var k in clone.elements) {
            var elem = clone.elements[k];
            delete elem.ranges;
        }
        return yaml.yamlify(clone);
    };
    /**
     * Map To Array
     * : Parses a string converting to element array using ranges.
     * Assumes you are passing the entire string element including ignored points.
     * The valid points are then parsed based on the element's ranges.
     *
     * @param ranges the ranges used to parse value with.
     * @param val the string value to parse.
     */
    Goticon.prototype.mapToArray = function (name, val) {
        if (!chek_1.isString(name))
            name = name.name;
        var lines = utils.toLines(val);
        var linesContent = utils.toLines(this.content);
        // All rows were passed just return the string.
        if (lines.length === linesContent.length)
            return lines;
        var result = [];
        var element = this.element(name);
        var ranges = this.toRanges(element.points);
        var offset = ranges[0].row; // the starting row.
        var pad = ranges.reduce(function (prev, cur) {
            return prev.start < cur.start ? prev : cur;
        }).start;
        lines.forEach(function (line, i) {
            i += offset;
            line = '-'.repeat(pad) + line;
            ranges.forEach(function (r) {
                if (i === r.row) {
                    var tmp = line.slice(r.start, r.end + 1);
                    result.push(tmp);
                }
            });
        });
        return result;
    };
    /**
     * Fill Range
     * : Fills a range of numbers.
     *
     * @param start the starting value.
     * @param end the ending value.
     */
    Goticon.prototype.fillRange = function (start, end) {
        var arr = [];
        while (start <= end)
            arr.push(start++);
        return arr;
    };
    /**
     * Has Elements
     * : Checks if Goticon has any elements.
     */
    Goticon.prototype.hasElements = function () {
        return chek_1.keys(this.elements).length;
    };
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
    Goticon.prototype.toRange = function (x, y) {
        var ranges = [];
        var _stats = utils.stats(this.content);
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
        var rangeX = /r(ange)?/.test(chek_1.last(x) || '');
        var rangeY = /r(ange)?/.test(chek_1.last(y) || '');
        // If last is x or y is range remove.
        if (rangeX)
            x.pop();
        if (rangeY)
            y.pop();
        // Feel the range of rows.
        if (rangeY)
            y = this.fillRange(y[0], y[1]);
        y.forEach(function (r) {
            if (x.length > 2 || !rangeX) {
                x.forEach(function (p) {
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
    };
    /**
     * To Ranges
     * : Converts x and y arrays of points or PointSets to ranges.
     *
     * @param x the x points(s) or PointSets.
     * @param y the y points(s).
     */
    Goticon.prototype.toRanges = function (points) {
        var _this = this;
        var ranges = [];
        points.forEach(function (p) {
            ranges = ranges.concat(_this.toRange(p.x, p.y));
        });
        chek_1.orderBy(ranges, 'row', 'start');
        return ranges;
    };
    /**
     * Parse
     * : Parses raw content for YAML.
     *
     * @param pathOrContent the file path to be parsed for YAML.
     * @param content optional raw static content to parse for YAML.
     */
    Goticon.prototype.parse = function (pathOrContent, content) {
        if (!/\.goticon$/.test(pathOrContent)) {
            content = pathOrContent;
            pathOrContent = undefined;
        }
        pathOrContent = pathOrContent || this.path;
        var ext = path_1.extname(pathOrContent || '');
        if (!/\.?goticon/.test(ext))
            throw new Error("the extension " + ext + " is NOT supported.");
        return yaml.load(pathOrContent, content);
    };
    /**
     * Load
     * : Loads content from file or static value.
     *
     * @param pathOrContent the path or content to load from.
     * @param content optional content to override from disk.
     */
    Goticon.prototype.load = function (pathOrContent, content) {
        var parsed = this.parse(pathOrContent, content);
        parsed.body = utils.normalize(parsed.body);
        this.path = parsed.path;
        this.content = parsed.body;
        this.yaml = parsed.yaml;
        var config = parsed.data;
        // If config is not empty configure the elements.
        if (!chek_1.isEmpty(config)) {
            this.name = config.name || this.name;
            if (config.elements) {
                for (var k in config.elements) {
                    var element = this.element(k);
                    element.add(config.elements[k].points);
                    // element.hidden = config.elements[k].hidden;
                    this.elements[k] = element;
                }
            }
            if (config.themes) {
                for (var k in config.themes) {
                    var theme = this.theme(k);
                    theme.elements = config.themes[k].elements;
                }
            }
        }
        return this;
    };
    Goticon.prototype.replace = function (name, val, content, repeat) {
        if (chek_1.isBoolean(content)) {
            repeat = content;
            content = undefined;
        }
        content = content || this.content;
        var element = name;
        if (chek_1.isString(name))
            element = this.element(name);
        if (!element)
            throw new Error('cannot replace using element of undefined.');
        if (repeat && !chek_1.isString(val))
            throw new Error("Cannot replace using type " + typeof val + ", a string is required.");
        var arr = val;
        if (!repeat || (chek_1.isArray(arr) && arr.length === 1))
            arr = this.mapToArray(element, val[0]);
        if (!repeat) {
            if (element.points.length > arr.length)
                throw new Error("replace failed, requires " + element.points.length + " values but got only " + arr.length + ".");
        }
        var ranges = this.toRanges(element.points);
        var lines = utils.toLines(content);
        ranges.forEach(function (range, i) {
            var line = lines[range.row];
            var head = line.slice(0, range.start);
            var tail = line.slice(range.end + 1, line.length);
            var replaced;
            if (repeat)
                replaced = val;
            else
                replaced = arr[i];
            lines[range.row] = head + replaced + tail;
        });
        return lines.join('\n');
    };
    /**
     * Find
     * : Finds an elements by coordinate(s).
     *
     * @param x the x coordinate to find by.
     * @param y the y coordinate to find by.
     */
    Goticon.prototype.find = function (x, y) {
        var elements = [];
        for (var k in this.elements) {
            var ranges = this.toRanges(this.elements[k].points);
            var found = ranges.some(function (r) {
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
    };
    /**
     * Element
     * : Gets or sets a new element.
     *
     * @param name the name of the element to get or set.
     * @param x the x point(s).
     * @param y the y point(s).
     */
    Goticon.prototype.element = function (name, x, y) {
        var _this = this;
        if (!x && this.elements[name])
            return this.elements[name];
        var element = {
            name: name
        };
        element.points = this.toPointSets(x, y);
        var toggleHidden = function (theme, visible) {
            if (!theme.length)
                theme.push('default');
            theme = chek_1.toArray(theme);
            theme.forEach(function (k) {
                var _theme = chek_1.isString(k) ? _this.theme(k) : k;
                _theme.elements[element.name].hidden = visible;
            });
            return element;
        };
        element.add = function (x, y) {
            var pointSets = _this.toPointSets(x, y);
            pointSets = _this.uniquePoints(element, pointSets);
            element.points = element.points.concat(pointSets);
            return element;
        };
        element.styles = function (styles, theme) {
            theme = theme || 'default';
            if (chek_1.isString(theme))
                theme = _this.theme(theme);
            theme.styles(element, chek_1.toArray(styles));
            return element;
        };
        element.replace = function (val, theme) {
            theme = theme || 'default';
            if (chek_1.isString(theme))
                theme = _this.theme(theme);
            theme.replace(element, chek_1.toArray(val));
            return element;
        };
        element.show = function () {
            var theme = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                theme[_i] = arguments[_i];
            }
            return toggleHidden(theme, false);
        };
        element.hide = function () {
            var theme = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                theme[_i] = arguments[_i];
            }
            return toggleHidden(theme, true);
        };
        element.remove = function () {
            for (var k in _this.themes) {
                var theme = _this.themes[k];
                delete theme.elements[name];
            }
            delete _this.elements[name];
        };
        element.element = this.element; // for chaining.
        this.elements[element.name] = element;
        return element;
    };
    /**
     * Theme
     * : Gets or creates a theme.
     *
     * @param name the name of the theme to get or create.
     * @param elements
     * @param styles
     */
    Goticon.prototype.theme = function (name) {
        var _this = this;
        if (this.themes[name])
            return this.themes[name];
        var theme = {
            name: name,
            elements: {}
        };
        var ensureThemeElement = function (element) {
            if (chek_1.isString(element))
                element = _this.element(element);
            var name = element.name;
            if (!theme.elements[name])
                theme.elements[name] = {
                    element: name
                };
            return theme.elements[name];
        };
        var toggleHidden = function (element, visible) {
            if (element === void 0) { element = null; }
            var elements = chek_1.toArray(element);
            // If not specific elements to show toggle all to show.
            if (!elements.length)
                elements = chek_1.keys(theme.elements);
            elements.forEach(function (el) {
                if (!chek_1.isString(el))
                    el = el.name;
                theme.elements[el].hidden = false;
            });
            return theme;
        };
        theme.styles = function (element) {
            var styles = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                styles[_i - 1] = arguments[_i];
            }
            var themeElem = ensureThemeElement(element);
            themeElem.styles = chek_1.flatten(styles);
            return theme;
        };
        theme.replace = function (element) {
            var val = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                val[_i - 1] = arguments[_i];
            }
            var themeElem = ensureThemeElement(element);
            themeElem.replace = chek_1.flatten(val);
            return theme;
        };
        theme.show = function () {
            var element = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                element[_i] = arguments[_i];
            }
            return toggleHidden(element, false);
        };
        theme.hide = function () {
            var element = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                element[_i] = arguments[_i];
            }
            return toggleHidden(element, true);
        };
        theme.inherit = function () {
            var themes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                themes[_i] = arguments[_i];
            }
            var _themes = themes.filter(function (t) {
                return t !== 'default' && t.name !== 'default';
            }).map(function (t) {
                return chek_1.isString(t) ? _this.theme(t) : t;
            });
            _themes.unshift(_this.theme('default'));
            _themes.forEach(function (t) {
                for (var k in t.elements) {
                    if (!theme.elements[k])
                        theme.elements[k] = chek_1.clone(t.elements[k]);
                }
            });
            return theme;
        };
        theme.remove = function () {
            delete _this.themes[name];
        };
        this.themes[name] = theme;
        return theme;
    };
    /**
     * Remove Element
     * : Removes an element from the collection.
     *
     * @param name the name of the element to be removed.
     */
    Goticon.prototype.removeElement = function (name) {
        delete this.elements[name];
        return this;
    };
    /**
     * Remove Theme
     * : Removes a theme from the collection.
     *
     * @param name the name of the theme to be removed.
     */
    Goticon.prototype.removeTheme = function (name) {
        // Don't remove default theme.
        if (name === 'default')
            return this;
        delete this.themes[name];
        return this;
    };
    /**
     * Grid
     * : Displays Goticon as grid for defining points for colorization.
     *
     * @param themeOrContent optional theme to apply to plot or custom content.
     * @param content optional content or uses stored value.
     */
    Goticon.prototype.plot = function (themeOrContent, content) {
        var _this = this;
        if (chek_1.isString(themeOrContent) && !this.themes[themeOrContent]) {
            content = themeOrContent;
            themeOrContent = undefined;
        }
        content = content || this.content;
        themeOrContent = themeOrContent || 'default';
        var tmpPath = path_1.resolve(content);
        if (fs_1.existsSync(tmpPath)) {
            var parsed = yaml.load(tmpPath);
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
        var rows = [];
        var maxLen = 0;
        var isOdd = function (n) {
            return n % 2;
        };
        var padLeft = function (s, n) {
            s = s + '';
            if (s.length < n)
                s = new Array(n).join('0') + s;
            return s;
        };
        // Hide elements and replace content for theme.
        chek_1.keys(themeOrContent.elements).forEach(function (key) {
            var themeElem = themeOrContent.elements[key];
            if (themeElem.replace && !themeElem.hidden)
                content = _this.replace(themeElem.element, themeElem.replace);
            if (themeElem.hidden)
                content = _this.replace(themeElem.element, ' ', content, true);
        });
        content = utils.normalize(content);
        var lines = utils.toLines(content);
        // Iterate and split into single columns.
        lines.forEach(function (r, i) {
            if (r.length > maxLen)
                maxLen = r.length;
            var row = r.split('');
            row.unshift(padLeft(i, (lines.length + '').length));
            rows.push(row);
        });
        var padLen = (maxLen + '').length;
        var dash = colurs.gray.dim('--');
        var sep = colurs.gray.dim('|');
        var grid = [];
        var hdr = [' '];
        var align = ['l'];
        var btm = [' '];
        var ctr = 0;
        // build the header row and
        // build bottom fill rows.
        while (ctr < maxLen) {
            hdr.push(padLeft(ctr, padLen));
            align.push('c');
            btm.push(dash);
            ctr++;
        }
        rows.unshift(hdr);
        rows.forEach(function (r, i) {
            if (i)
                grid.push(btm);
            grid.push(r);
        });
        var _table = table(grid, {
            hsep: sep,
            align: align,
            stringLength: function (s) { return colurs.strip(s).length; }
        });
        return _table;
    };
    /**
     * Render
     * : Renders the content with optional theme.
     *
     * @param theme the theme to use to colorize the content.
     */
    Goticon.prototype.render = function (theme) {
        var _this = this;
        if (theme === false)
            return this.content;
        var content = this.content;
        theme = theme || 'default';
        if (!this.content.length)
            throw new Error('Whoops cannot render Goticon using content of undefined.');
        if (chek_1.isString(theme))
            theme = this.theme(theme);
        if (!theme)
            throw new Error("failed to load theme " + theme + ".");
        var _theme = theme;
        var elements = chek_1.keys(_theme.elements);
        if (!elements.length)
            return content;
        // Replace any needed elements for the theme.
        elements.forEach(function (k, i) {
            var themeElem = _theme.elements[k];
            if (themeElem.replace) {
                content = _this.replace(k, themeElem.replace, content);
            }
        });
        // Convert to lines.
        var lines = utils.toLines(content);
        var indexes = {};
        var lastIndexes = {};
        var usedRanges = [];
        var validRange = function (current) {
            return usedRanges.filter(function (range) {
                var isRow = current.row === range.row;
                if (isRow && (current.start >= range.start && current.end <= range.end))
                    return true;
                return false;
            })[0];
        };
        // Iterate elements build style indexes for ranges.
        elements.forEach(function (k) {
            var element = _this.element(k);
            var themeElem = _theme.elements[k];
            var ranges = _this.toRanges(element.points);
            ranges.forEach(function (range) {
                if (!lines[range.row])
                    return;
                var invalidRange = validRange(range);
                if (invalidRange)
                    throw new Error("render failed for element '" + element.name + "'.\n  range:    '" + util_1.inspect(range, null, null, true) + "\n  conflict: " + util_1.inspect(invalidRange, null, null, true) + "\n");
                var line = lines[range.row];
                line = colurs.strip(line);
                var orig, styled;
                var head = line.slice(0, range.start);
                var tail = line.slice(range.end + 1, line.length);
                // If not hidden stylize and then index line.
                if (!themeElem.hidden) {
                    styled = (orig = line.slice(range.start, range.end + 1));
                    if (themeElem.styles && themeElem.styles.length)
                        styled = colurs.applyAnsi(styled, themeElem.styles);
                    line = head + styled + tail;
                    var obj = (indexes[range.row] = indexes[range.row] || {});
                    var lastIdx = (lastIndexes[range.row] = lastIndexes[range.row] || {});
                    var indexedLine = utils.indexAnsi(line).indexes;
                    for (var k_1 in indexedLine) {
                        if (obj[k_1]) {
                            if ((lastIdx[k_1] || 0) > range.end)
                                obj[k_1] = indexedLine[k_1] + obj[k_1];
                            else
                                obj[k_1] = obj[k_1] + indexedLine[k_1];
                        }
                        else {
                            obj[k_1] = indexedLine[k_1];
                        }
                        lastIdx[k_1] = range.end;
                    }
                    usedRanges.push(range);
                }
                else {
                    styled = ' '.repeat((range.end - range.start) + 1);
                    lines[range.row] = head + styled + tail;
                }
            });
        });
        chek_1.keys(indexes).forEach(function (i) {
            lines[i] = utils.revertAnsi(lines[i], indexes[i]);
        });
        return lines.join('\n');
    };
    /**
     * Render To
     * : Outputs rendered content to path.
     *
     * @param path the output path to render to.
     * @param theme the theme to use to colorize the content.
     */
    Goticon.prototype.renderTo = function (path, theme) {
        if (!path)
            throw new Error("cannot render using path of undefined.");
        var content = this.render(theme);
        fs_1.writeFileSync(path_1.resolve(path), content);
        return this;
    };
    /**
     * Reset
     * : Clears elements and themes.
     *
     * @param elements optional object containing elements to reset with.
     */
    Goticon.prototype.reset = function (elements) {
        this.elements = elements || {};
        this.themes = {};
        this.theme('default');
        return this;
    };
    /**
     * Duplicate
     * : Duplicate the current Goticon.
     *
     * @param name the name of the duplicate Goticon.
     * @param path optional path that defaults to current using name above.
     */
    Goticon.prototype.duplicate = function (name, path) {
        if (!path) {
            var parsed = path_1.parse(this.path);
            path = path_1.join(parsed.dir, name + parsed.ext);
        }
        else {
            path = path_1.resolve(path);
        }
        // Define new Goticon.
        var goticon = new Goticon(name, path, this.content);
        // Duplicate elements.
        for (var k in this.elements) {
            var element = goticon.element(k);
            element.add(this.elements[k].points);
            goticon.elements[k] = element;
        }
        // Duplicate themes.
        for (var k in this.themes) {
            var theme = goticon.theme(k);
            theme.elements = this.themes[k].elements;
        }
        // Return the duplicated Goticon.
        return goticon;
    };
    Goticon.prototype.save = function (path, config, content) {
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
            var matter = this.toYAML();
            content = YAML_TEMPLATE.replace('{{YAML}}', matter) + content;
        }
        var dir = path_1.dirname(path);
        if (!fs_1.existsSync(dir))
            fs_1.mkdirSync(dir);
        fs_1.writeFileSync(path, content, 'utf8');
        return this;
    };
    Goticon.prototype.saveRendered = function (theme, path, config) {
        var content = this.render(theme);
        return this.save(path, config, content);
    };
    return Goticon;
}());
exports.Goticon = Goticon;
//# sourceMappingURL=goticon.js.map