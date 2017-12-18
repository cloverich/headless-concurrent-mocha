import chalk from 'chalk';

interface MochaRunResult {
  events: Array<MochaRunnerEvent>;
  // todo
  stats: null;
}

interface MochaRunnerEvent {
  type: string;
  value: TestResult | string[];
}

export interface TestResult {
  title: string;
  status: 'pass' | 'fail';
  duration: number;
  err: TestError | null;
}

export interface TestError {
  message: string;
  showDiff: boolean;
  actual: any;
  expected: any;
  stack: string;
}

export type TestFails = Array<TestResult>;

export function reportFails(fails: TestFails) {
  if (!fails.length) return;

  console.log('\n', chalk.red(`${fails.length} tests failed.\n`));
  fails.forEach((test, idx) => {
    console.log(`  ${idx + 1}) ${test.title}:`, chalk.red(test.err!.message));
    console.log('    Actual:', chalk.cyan(test.err!.actual));
    console.log('\n', chalk.dim(test.err!.stack), '\n');
  });
}


const isWin32 = process.platform === 'win32';

// Adapted from mocha/lib/base.js
const symbols = {
  ok: isWin32 ? '\u221A' : '✓',
  err: isWin32 ? '\u00D7' : '✖',
};


export const reportTests = (testFilename: string, report: MochaRunResult): TestFails => {
  let currentSuite: Array<string> = [];
  const fails: TestFails = [];

  // console.log('\n', chalk.cyan(`Reporting test: ${testFilename}`), '\n');

  report.events.forEach(event => {
    switch (event.type) {
      case 'suite_start':
        currentSuite = event.value as string[];

        // Mocha passes up [] for first suite; don't print it.
        if (!currentSuite.length) return;

        console.log(
          // Indent one level for each suite
          currentSuite.map(i => '  ').join(''),
          currentSuite[currentSuite.length - 1],
        );
        break;
      case 'suite_end':
        currentSuite.pop();
        break;
      case 'test':
        const test: TestResult = event.value as TestResult;

        console.log(
          // Indent one level deeper than the Suite
          [' '].concat(currentSuite).map(i => '  ').join(''),
          test.status === 'pass' ? chalk.green(symbols.ok) : chalk.red(symbols.err),
          chalk.dim(test.title),
        );

        if (test.status === 'fail') fails.push(test);

        break;
      default:
        throw new Error(`Unexpected event type from report: ${event.type}`);
    }
  })

  return fails;
}
