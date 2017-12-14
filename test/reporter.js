// import * as Mocha from 'mocha';

// declare namespace mocha {
//   const setup: any;
//   const run: any;
// }

// export function statsReporter() {
//   function MyReporter(runner: any) {
//     var passes = 0;
//     var failures = 0;

//     ['start', 'end', 'suite', 'suite end', 'test', 'test end', 'hook', 'hook end', 'pending'].forEach(event => {
//       runner.on(event, function (...args: Array<any>) { console.log(event, JSON.stringify(args)) });
//     })

//     runner.on('pass', function (test: Mocha.ITest) {
//       passes++;
//       console.log('pass: %s', test.fullTitle());
//     });

//     runner.on('fail', function (test: Mocha.ITest, err: Error) {
//       failures++;
//       console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
//     });

//     runner.on('end', function () {
//       console.log('end: %d/%d', passes, passes + failures);
//       // process.exit(failures);
//     });
//   }

//   mocha.setup({ reporter: MyReporter })
//   mocha.run();
// }
// import * as Mocha from 'mocha';

// declare namespace mocha {
//   const setup: any;
//   const run: any;
// }

module.exports = function statsReporter() {
  // console.log('mocha???', window.mocha);
  // function MyReporter(runner) {
  //   var passes = 0;
  //   var failures = 0;

  //   ['start', 'end', 'suite', 'suite end', 'test', 'test end', 'hook', 'hook end', 'pending'].forEach(event => {
  //     runner.on(event, function (...args) { console.log(event, JSON.stringify(args)) });
  //   })

  //   runner.on('pass', function (test) {
  //     passes++;
  //     console.log('pass: %s', test.fullTitle());
  //   });

  //   runner.on('fail', function (test, err) {
  //     failures++;
  //     console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
  //   });

  //   runner.on('end', function () {
  //     console.log('end: %d/%d', passes, passes + failures);
  //     // process.exit(failures);
  //   });
  // }

  // mocha.setup({ reporter: MyReporter })
  // mocha.run();
}