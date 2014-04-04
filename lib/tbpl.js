var Base = require('mocha').reporters.Base,
    corredor = require('corredor-js-client');


/**
 * Initialize a new TBPL reporter.
 * @constructor
 * @param {Runner} runner mocha test runner.
 */
function TBPL(runner) {
  Base.call(this, runner);

  this.onEnd = this.onEnd.bind(this);
  runner.on('end', this.onEnd);
  this.onFail = this.onFail.bind(this);
  runner.on('fail', this.onFail);
  this.onPass = this.onPass.bind(this);
  runner.on('pass', this.onPass);
  this.onPending = this.onPending.bind(this);
  runner.on('pending', this.onPending);
  this.onTest = this.onTest.bind(this);
  runner.on('test', this.onTest);
  this.onTestEnd = this.onTestEnd.bind(this);
  runner.on('test end', this.onTestEnd);

  this.status = 'PASS';
  this.resultStream = new corredor.Publisher('ipc', '/tmp/corredor_sink');

  this.outputStream = new corredor.StreamPublisher('ipc', '/tmp/corredor_output');
  this.outputStream.bindStreamToAction(process.stdout, 'stdout');
  this.outputStream.bindStreamToAction(process.stderr, 'stderr');
}
module.exports = TBPL;


TBPL.prototype = {
  __proto__: Base.prototype,
  /**
   * Output a summary of the mocha run.
   */
  onEnd: function() {
    this.resultStream.sendData({'action': 'suite_end'});
    this.epilogue();
  },

  /**
   * @param {Test} test failing test.
   * @param {Error} err failure.
   */
  onFail: function(test, err) {
    this.status = 'FAIL';
    this.resultStream.sendData({'action': 'test_status',
                                'test': test.file,
                                'status': this.status,
                                'subtest': test.fullTitle(),
                                'expected': 'PASS'});
  },

  /**
   * @param {Test} test passing test.
   */
  onPass: function(test) {
    this.resultStream.sendData({'action': 'test_status',
                                'test': test.file,
                                'subtest': test.fullTitle()});
    this.status = 'PASS';
  },

  /**
   * @param {Test} test pending test.
   */
  onPending: function(test) {
    // theoretically this should never happen
    console.log('TEST-PENDING | %s', test.fullTitle());
  },

  /**
   * @param {Test} test started test.
   */
  onTest: function(test) {
    this.resultStream.sendData({'action': 'test_start',
                                'test': test.file});
  },

  /**
   * @param {Test} test finished test.
   */
  onTestEnd: function(test) {
    this.resultStream.sendData({'action': 'test_end',
                                'test': test.file,
                                'status': this.status,
                                'expected': 'PASS'});
  }
};
