import { Goticon } from './goticon';
import { IAnsiStyles } from 'colurs';
export declare type BorderStyles = 'bold' | 'dim' | 'hidden' | 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey' | 'bgBlack' | 'bgRed' | 'bgGreen' | 'bgYellow' | 'bgBlue' | 'bgMagenta' | 'bgCyan' | 'bgWhite';
export declare type AnsiStyles = keyof IAnsiStyles;
export declare type RestParam<T> = (T | T[])[];
export interface IMap<T> {
    [key: string]: T;
}
export interface IBox {
    topLeft: string;
    topRight: string;
    bottomRight: string;
    bottomLeft: string;
    vertical: string;
    horizontal: string;
}
export interface IOptions {
    goticon?: string | Goticon;
    directory?: string;
    width?: number;
    padding?: number;
    align?: 'left' | 'center';
    positionX?: 'left' | 'right';
    positionY?: 'top' | 'middle' | 'bottom';
    gutter?: number;
    border?: 'single' | 'double' | 'round' | 'single-double' | 'double-single' | 'classic';
    borderStyle?: BorderStyles | BorderStyles[];
    wrapper?: string | string[];
    colorize?: boolean;
}
export declare type Points = number | (number | string)[];
export declare type PointSet = [Points, Points];
export interface IPoint {
    x: Points;
    y: Points;
}
export interface IRange {
    row: number;
    start: number;
    end: number;
}
export interface IElement {
    name: string;
    points?: IPoint[];
    alt?: IMap<string>;
    add?(x: Points | IPoint[], y?: Points): IElement;
    styles?(styles: AnsiStyles | AnsiStyles[], theme?: string | ITheme): IElement;
    replace?(val: string | string[], theme?: string | ITheme): IElement;
    show?(theme?: string | ITheme | (string | ITheme)[]): IElement;
    hide?(theme?: string | ITheme | (string | ITheme)[]): IElement;
    remove?(): void;
    element?(name: string, x?: Points | IPoint[], y?: Points): IElement;
}
export interface IThemeElement {
    element: string;
    styles?: AnsiStyles[];
    replace?: string | string[];
    hidden?: boolean;
}
export interface ITheme {
    name: string;
    elements?: IMap<IThemeElement>;
    inherit?(...themes: (string | ITheme)[]): ITheme;
    styles?(element: string | IElement, ...styles: RestParam<AnsiStyles>): ITheme;
    replace?(element: string | IElement, ...val: RestParam<string>): ITheme;
    show?(element?: string | IElement | (string | IElement)[]): ITheme;
    hide?(element?: string | IElement | (string | IElement)[]): ITheme;
    remove?(): void;
}
export interface IIndexResult {
    source: string;
    modified: string;
    indexes: IMap<string>;
}
