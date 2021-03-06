var ProgressFormatter = function(options) {
  var Cucumber = require('../../cucumber');

  if (!options)
    options = {};

  var self          = Cucumber.Listener.Formatter(options);
  var summaryLogger = Cucumber.Listener.Summarizer();

  var parentHear = self.hear;
  self.hear = function hear(event, callback) {
    summaryLogger.hear(event, function () {
      parentHear(event, callback);
    });
  };

  self.handleStepResultEvent = function handleStepResult(event, callback) {
    var stepResult = event.getPayloadItem('stepResult');
    if (stepResult.isSuccessful())
      self.handleSuccessfulStepResult();
    else if (stepResult.isPending())
      self.handlePendingStepResult();
    else if (stepResult.isSkipped())
      self.handleSkippedStepResult();
    else if (stepResult.isUndefined())
      self.handleUndefinedStepResult();
    else
      self.handleFailedStepResult();
    callback();
  };

  self.handleSuccessfulStepResult = function handleSuccessfulStepResult() {
    self.log(ProgressFormatter.PASSED_STEP_CHARACTER);
  };

  self.handlePendingStepResult = function handlePendingStepResult() {
    self.log(ProgressFormatter.PENDING_STEP_CHARACTER);
  };

  self.handleSkippedStepResult = function handleSkippedStepResult() {
    self.log(ProgressFormatter.SKIPPED_STEP_CHARACTER);
  };

  self.handleUndefinedStepResult = function handleUndefinedStepResult() {
    self.log(ProgressFormatter.UNDEFINED_STEP_CHARACTER);
  };

  self.handleFailedStepResult = function handleFailedStepResult() {
    self.log(ProgressFormatter.FAILED_STEP_CHARACTER);
  };

  self.handleAfterFeaturesEvent = function handleAfterFeaturesEvent(event, callback) {
    var summaryLogs = summaryLogger.getLogs();
    self.log(summaryLogs);
    callback();
  };

  return self;
};
ProgressFormatter.PASSED_STEP_CHARACTER    = '.';
ProgressFormatter.SKIPPED_STEP_CHARACTER   = '-';
ProgressFormatter.UNDEFINED_STEP_CHARACTER = 'U';
ProgressFormatter.PENDING_STEP_CHARACTER   = 'P';
ProgressFormatter.FAILED_STEP_CHARACTER    = 'F';
module.exports                             = ProgressFormatter;
