/**
 * This CLI is not all that useful.
 * Mainly here as a demo, instead you should
 * import Gosay into your project, but this should
 * put you in the right direction.
 */

import { capitalize, contains } from 'chek';
import { Gosay } from './';

const pkg = require('../../package.json');
const argv = process.argv.slice(2);
const input = parseInput(argv);

const gosay = new Gosay({
  width: 32,
  gutter: 1,
  positionY: 'top'
});

function parseInput(args: string[]) {

  const obj: any = {
    yaml: true
  };

  obj.text = args.filter((v, i) => {
    const isFlag = /^--?/.test(v);
    const isFlagPrev = /^--?/.test(args[i - 1]);
    const valFlags = ['--theme'];
    const key = v.replace(/^--(no-)?/, '').replace(/^-/, '');
    if (isFlag) { // is an arg flag lik --help
      if (!contains(valFlags, v))
        obj[key] = /--no-/.test(v) ? false : true;
      else // is a flag that requires a value.
        obj[key] = args[i + 1];
    }
    return !isFlag && !isFlagPrev;
  }).join(' ');

  return obj;

}

function message(msg?: string) {
  msg = msg || '';
  const methods = {
    add: (str, newlines?) => {
      msg += str;
      newlines = typeof newlines === 'undefined' ? 1 : newlines;
      if (newlines)
        msg += '\n'.repeat(newlines);
      return methods;
    },
    done: () => {
      return msg;
    },
    show: () => {
      console.log(msg);
    }
  };
  return methods;
}

function help() {
  message()
    .add('')
    .add(capitalize(pkg.name))
    .add('--------------------------------------------------', 2)
    .add(pkg.description, 2)
    .add('Usage:')
    .add('  $ gosay <string>                 | say string with Gus.')
    .add('  $ gosay <string> --theme sleepy  | say with theme (sleepy, scared).')
    .add('  $ gosay --plot                   | displays the plot for Gus.')
    .add('  $ gosay --plot --theme sleepy    | as above using theme sleepy.')
    .add('  $ gosay --help                   | show help.', 2)
    .add('Themes:')
    .add(`  sleepy   | shows Gus sleeping.`)
    .add(`  scared   | shows Gus with scared eyes.`)
    .add(`  alert    | shows default Gus with alert flag.`)
    .add(`  wink     | shows default Gus but winking.`, 2)
    .add('Examples:')
    .add(`  $ gosay 'Hello Gus.'`)
    .add(`  $ gosay 'Gus is sleepy.' --theme sleepy`)
    .add(`  $ gosay --plot`)
    .add(`  $ gosay --plot --theme sleepy`)
    .show();
}

function plot() {
  if (input.plot === true)
    input.plot = undefined;
  const gus = load();
  console.log();
  console.log(gus.plot(input.theme));
  console.log();
}

function load() {

  const gus = gosay.goticon('gus');
  const flip = gosay.goticon('flip');

  // We reset here to clear
  // previous configuration.
  gus.reset();

  gus.element('head')
    .add([6, 12], 3)
    .add([7, 11], 2);

  gus.element('brow')
    .add([8, 11], 3);

  gus.element('nose', 9, 5);

  gus.element('mouth', [7, 11, 'range'], 6);

  gus.element('hair', [8, 10, 'range'], 2)
    .styles('gray');

  gus.element('eyes', [7, 11], 4)
    .styles('bgBlack');

  gus.element('nostrils', [8, 10], 5)
    .styles('magenta');

  gus.element('body')
    .add([1, 17], [4, 5, 9, 10])
    .add([0, 18], [6, 9, 'range'])
    .add([5, 13], 8)
    .add([6, 12], [9, 10]);

  gus.element('shoulders')
    .add([2, 5, 'range'], 3)
    .add([13, 16, 'range'], 3);

  gus.element('chest')
    .add([8, 10], 9)
    .styles(['magenta']);

  gus.element('nips', [5, 13], 7)
    .styles('magenta');

  gus.element('toes')
    .add([2, 3, 4, 14, 15, 16], 11)
    .styles('gray');

  gus.element('feet')
    .add([1, 6, 12, 17], 11);

  gus.element('mute')
    .add(9, 4)
    .add([2, 16], 8)
    .add([4, 14], 9)
    .add([2, 16], 10)
    .add([5, 13], 11)
    .add([7, 11], 5)
    .add(9, 10)
    .styles('gray');

  gus.element('parens')
    .add([6, 12], 4)
    .add([6, 12], 6)
    .add([4, 14], 4)
    .add([3, 15], 5)
    .styles('gray');

  gus.element('bubble')
    .add(21, 3)
    .add(20, 4)
    .add(19, 5);

  gus.element('bulb', 15, 0)
    .add([14, 16], 1)
    .add(15, 2)
    .styles('magenta')
    .hide();

  gus.element('bulb-inner', 15, 1)
    .styles('white')
    .hide();

  // THEMES //

  gus.theme('alert')
    .inherit()
    .show();

  gus.theme('sleepy')
    .replace('mouth', '-----')
    .replace('eyes', '_ Y _')
    .inherit();

  gus.theme('scared')
    .replace('mouth', '~~~~~')
    .replace('eyes', 'O Y O')
    .inherit();

  gus.theme('wink')
    .replace('eyes', 'c Y _')
    .inherit();

  gus.save(input.yaml);

  return gus;

}

function say() {

  if (!input.text)
    return;

  const gus = load();
  const rendered = gus.render(input.theme);
  gosay.say(input.text, rendered);

}

if (input.help || input.h)
  help();
if (input.plot || input.p)
  plot();
else
  say();