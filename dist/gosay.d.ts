import { Goticon } from './goticon';
import { IOptions } from './interfaces';
export declare class Gosay {
    private _colurs;
    options: IOptions;
    constructor(options?: IOptions);
    /**
     * Equal Parts
     * : Gets equal parts using divisor adds remainder if any.
     *
     * @param value the value to be divided.
     * @param divisor the value to divide by.
     */
    private equalParts(value, divisor?);
    /**
      * Parse Goticon
      * : Parses the ansi artwork counting lines, finding longest line.
      *
      * @param goticon the ansi artwork to parse.
      */
    private parseGoticon(goticon);
    /**
     * Compile
     * : Compiles the row spacing and padding.
     *
     * @param row the row to be spaced, padded and compiled.
     * @param len the length of the row.
     * @param max the max length allowable for the row.
     */
    private normalizeRow(row, len, max);
    /**
     * Wrap
     * : Wraps text building rows for use withing text box.
     *
     * @param msg the message to wrap text for.
     */
    private wrap(msg);
    /**
     * Read
     * : Simply reads a file, useful for looking up pre-compiled Goticon images.
     *
     * @param path the path of the file to be read.
     */
    read(path: string): string;
    /**
     * Goticon
     * : Creates a new Goticon.
     *
     * @param name the name of the Goticon.
     * @param path the path to the goticon.
     * @param content static or default content for the Goticon.
     */
    goticon(name: string, content?: string, path?: string): Goticon;
    /**
     * Set Option
     * : Sets an options.
     *
     * @param key the option key.
     * @param val the value for the key.
     */
    setOption(key: string, val: any): void;
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
    boxify(msg: string): {
        top: string;
        inner: string;
        bottom: string;
        rows: any[];
        result: string;
    };
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
export declare function init(options?: IOptions): Gosay;
