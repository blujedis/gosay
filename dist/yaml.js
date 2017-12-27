"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var fs_1 = require("fs");
var parser = require("js-yaml");
var chek_1 = require("chek");
var BOM = '\\ufeff?';
var SPLIT_EXP = /(\r?\n)/;
var YAML_EXP_STR = '^(' +
    BOM +
    '(= yaml =|---)' +
    '$([\\s\\S]*?)' +
    '^(?:\\2|\\.\\.\\.)' +
    '$' +
    (process.platform === 'win32' ? '\\r?' : '') +
    '(?:\\n)?)';
var YAML_EXP = new RegExp(YAML_EXP_STR, 'm');
var TRIM_EXP = /^\s+|\s+$/g;
var LOAD_OPTIONS = {};
var DUMP_OPTIONS = {
    skipInvalid: true
};
/**
 * Yamilify
 * : Converts object to YAML.
 *
 * @param obj the object to convert to yaml.
 * @param options options to use when converting to YAML.
 */
function yamlify(obj, options) {
    return parser.safeDump(obj, chek_1.extend(DUMP_OPTIONS, options));
}
exports.yamlify = yamlify;
/**
 * Parse
 * : Parses body and YAML from string.
 *
 * @param val the value to parse YAML from.
 */
function parse(val, options) {
    val = val || '';
    var hasYaml = /^= yaml =|---/.test(val);
    if (!hasYaml)
        return { data: {}, body: val, yaml: null };
    var matches = YAML_EXP.exec(val);
    if (!matches)
        return {
            data: {},
            body: val,
            yaml: null
        };
    var yaml = matches[matches.length - 1].replace(TRIM_EXP, '');
    var body = val.replace(matches[0], '');
    var data = parser.safeLoad(yaml, chek_1.extend(LOAD_OPTIONS, options));
    return {
        data: data,
        body: body,
        yaml: yaml
    };
}
exports.parse = parse;
/**
 * Load
 * : Loads file them parses for YAML.
 *
 * @param path the path to load from.
 * @param content existing raw static content.
 */
function load(path, content) {
    if (!path)
        throw new Error('Cannot read using path of undefined.');
    path = path_1.resolve(path);
    if (!content && fs_1.existsSync(path))
        content = fs_1.readFileSync(path).toString();
    content = content || '';
    var parsed = parse(content);
    return {
        path: path,
        data: parsed.data,
        body: parsed.body,
        yaml: parsed.yaml
    };
}
exports.load = load;
//# sourceMappingURL=yaml.js.map