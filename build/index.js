const stiks = require('stiks');
const sym = require('log-symbols');
const log = stiks.log;
const colurs = new stiks.colurs.Colurs();
const chek = stiks.chek;
const pkg = stiks.pkg();
const build = pkg && pkg.build;

// Ensure build info.
if (!build)
  log.error('Whoops looks like you forgot to configure package.json "build".');

// Parse command line arguments.
const parsed = stiks.argv.parse();
const command = parsed.command;
const commands = parsed.commands;
const flags = parsed.flags;

// Get user input less the command.
const input = parsed.normalized.slice(1);

// Don't merge in command line args automatically
// as will blow up spawn'd process.
const noMergeCmds = ['build', 'release'];

// Merges default args with any input args.
function normalize(def) {
  if (~noMergeCmds.indexOf(command))
    return stiks.argv.splitArgs(def);
  return stiks.argv.mergeArgs(def, input);
}

// Build actions.
const actions = {

  clean: () => {
    stiks.clean(build.clean);
    return actions;
  },

  copy: () => {
    stiks.copyAll(build.copy);
    return actions;
  },

  compile: (watch) => {
    let args = './node_modules/typescript/bin/tsc -p ./src/tsconfig.json'
    args += (watch ? ' -w' : '');
    args = normalize(args);
    stiks.exec.node(args);
    return actions;
  },

  watch: () => {
    actions.compile(true);
    return actions;
  },

  docs: () => {
    let args = './node_modules/typedoc/bin/typedoc --out ./docs ./src --options ./typedoc.json';
    args = normalize(args);
    stiks.exec.node(args);
    return actions;
  },

  bump: () => {
    const type = flags.semver || 'patch';
    const result = stiks.bump(type);
    log(`Bumped version from ${result.previous} to ${result.current}.`);
    return actions;
  },

  build: () => {
    actions.clean()
      .copy()
      .compile();
    return actions;
  },

  commit: () => {
    let args = `commit -m "auto commit"`;
    args = normalize(args);
    if (flags.m)
      args = stiks.argv.mergeArgs(args, ['-m', flags.m]);
    stiks.exec.command('git', 'add .');
    stiks.exec.command('git', args);
    stiks.exec.command('git', 'push');
    return actions;
  },

  publish() {
    stiks.exec.npm('publish');
    return actions;
  },

  release: () => {
    actions.build()
      .docs()
      .bump()
      .commit()
      .publish();
    return actions;
  },

  test: () => {
    let args = '--opts ./src/mocha.opts';
    args = normalize(args);
    stiks.exec.command('mocha', args);
  },

  serve: () => {
    const opts = flags || {};
    const server = stiks.serve('dev-server', opts, true);
  },

  exit: (msg, code) => {
    if (msg)
      log(msg)
    process.exit(code || 0);
  }

};

if (!actions[command])
  log.error(`Failed to run command "${command}", the command does not exist.`);

// Start the chain.
actions[command]();