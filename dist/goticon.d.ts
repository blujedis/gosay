import { IMap, IElement, ITheme, IRange, Points, IPoint } from './interfaces';
export declare class Goticon {
    name: string;
    path: string;
    content: string;
    yaml: string;
    rendered: string;
    elements: IMap<IElement>;
    themes: IMap<ITheme>;
    constructor(name: string, path: string, content: string);
    /**
     * To Point Sets
     * : Converts x and y points to PointSets.
     *
     * @param x the x point(s) or array of PointSets.
     * @param y the y point(s).
     */
    private toPointSets(x?, y?);
    /**
     * Unique Points
     * : Ensures points are unique.
     *
     * @param element the element to compare points against.
     * @param points points to compare returning unique points.
     */
    private uniquePoints(element, points);
    /**
     * To YAML
     * : Converts Goticon to YAML.
     */
    private toYAML();
    /**
     * Map To Array
     * : Parses a string converting to element array using ranges.
     * Assumes you are passing the entire string element including ignored points.
     * The valid points are then parsed based on the element's ranges.
     *
     * @param ranges the ranges used to parse value with.
     * @param val the string value to parse.
     */
    private mapToArray(name, val);
    /**
     * Fill Range
     * : Fills a range of numbers.
     *
     * @param start the starting value.
     * @param end the ending value.
     */
    private fillRange(start, end);
    /**
     * Has Elements
     * : Checks if Goticon has any elements.
     */
    hasElements(): number;
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
    toRange(x: Points, y: Points): IRange[];
    /**
     * To Ranges
     * : Converts x and y arrays of points or PointSets to ranges.
     *
     * @param x the x points(s) or PointSets.
     * @param y the y points(s).
     */
    toRanges(points: IPoint[]): IRange[];
    /**
     * Parse
     * : Parses raw content for YAML.
     *
     * @param pathOrContent the file path to be parsed for YAML.
     * @param content optional raw static content to parse for YAML.
     */
    parse(pathOrContent?: string, content?: string): {
        path: string;
        data: any;
        body: string;
        yaml: string;
    };
    /**
     * Load
     * : Loads content from file or static value.
     *
     * @param pathOrContent the path or content to load from.
     * @param content optional content to override from disk.
     */
    load(pathOrContent?: string, content?: string): this;
    /**
     * Replace Element
     * : When replacing ensure characters match points generated from "toRanges" or provide a single string INCLUDING characters which may be ignored. The replace method will filter or ignore characters NOT maching your defined points/element.
     *
     * @param name the name of the element to replace content for.
     * @param val the value(s) for replacement or complete Goticon containing changes.
     * @param repeat when true a string val is repeated for each character.
     */
    replace(name: string | IElement, val: string | string[], repeat?: boolean): any;
    /**
      * Replace Element
      * : When replacing ensure characters match points generated from "toRanges" or provide a single string INCLUDING characters which may be ignored. The replace method will filter or ignore characters NOT maching your defined points/element.
      *
      * @param name the name of the element to replace content for.
      * @param val the value(s) for replacement or complete Goticon containing changes.
      * @param content optional main content string.
      * @param repeat when true a string val is repeated for each character.
      */
    replace(name: string | IElement, val: string | string[], content?: string, repeat?: boolean): any;
    /**
     * Find
     * : Finds an elements by coordinate(s).
     *
     * @param x the x coordinate to find by.
     * @param y the y coordinate to find by.
     */
    find(x?: number, y?: number): IElement[];
    /**
     * Element
     * : Gets or sets a new element.
     *
     * @param name the name of the element to get or set.
     * @param x the x point(s).
     * @param y the y point(s).
     */
    element(name: string, x?: Points | IPoint[], y?: Points): IElement;
    /**
     * Theme
     * : Gets or creates a theme.
     *
     * @param name the name of the theme to get or create.
     * @param elements
     * @param styles
     */
    theme(name: string): ITheme;
    /**
     * Remove Element
     * : Removes an element from the collection.
     *
     * @param name the name of the element to be removed.
     */
    removeElement(name: string): this;
    /**
     * Remove Theme
     * : Removes a theme from the collection.
     *
     * @param name the name of the theme to be removed.
     */
    removeTheme(name: string): this;
    /**
     * Grid
     * : Displays Goticon as grid for defining points for colorization.
     *
     * @param themeOrContent optional theme to apply to plot or custom content.
     * @param content optional content or uses stored value.
     */
    plot(themeOrContent?: string | ITheme, content?: string): any;
    /**
     * Render
     * : Renders the content with optional theme.
     *
     * @param theme the theme to use to colorize the content.
     */
    render(theme?: string | false | ITheme): string;
    /**
     * Render To
     * : Outputs rendered content to path.
     *
     * @param path the output path to render to.
     * @param theme the theme to use to colorize the content.
     */
    renderTo(path: string, theme?: string | false | ITheme): this;
    /**
     * Reset
     * : Clears elements and themes.
     *
     * @param elements optional object containing elements to reset with.
     */
    reset(elements?: IMap<IElement>): this;
    /**
     * Duplicate
     * : Duplicate the current Goticon.
     *
     * @param name the name of the duplicate Goticon.
     * @param path optional path that defaults to current using name above.
     */
    duplicate(name: string, path?: string): Goticon;
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
    save(path: string | boolean, content?: string): Goticon;
    /**
     * Save
     * : Persists Goticon to file sysem.
     *
     * @param path the path to output the current content to.
     * @param config whether to include config as front matter.
     * @param content optional content instead of using internal this.content
     */
    save(path?: string | boolean, config?: boolean | string, content?: string): Goticon;
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
    saveRendered(theme?: string | false | ITheme, path?: string | boolean, config?: boolean): Goticon;
}
