var ProgressFormatter = require('./progress_formatter')
var ansi_color = require('ansi-color').set

function SpecFormatter(options) {
  var Cucumber = require('../../cucumber');

  var self          = Cucumber.Listener.Formatter(options);
  var summaryLogger = Cucumber.Listener.Summarizer();
  summaryLogger.logUndefinedStepSnippets = function() {
    var undefinedStepLogBuffer = summaryLogger.getUndefinedStepLogBuffer();
    summaryLogger.log(self.colorize("\nYou can implement step definitions for undefined steps with these snippets:\n\n", 'UNDEFINED'));
    summaryLogger.log(self.colorize(undefinedStepLogBuffer, 'UNDEFINED'));
  }
  summaryLogger.logFailedStepResults = function logFailedStepResults() {
    summaryLogger.log("(::) failed steps (::)\n\n");
    summaryLogger.failedStepResults.syncForEach(function(stepResult) {
      summaryLogger.logFailedStepResult(stepResult);
    });
  }
  summaryLogger.logFailedStepResult = function(stepResult) {
    var failureMessage = stepResult.getFailureException();
    summaryLogger.log(self.formatStep(2, stepResult.getStep(), 'FAILED'))
    summaryLogger.log(self.reindent(3, failureMessage.stack || failureMessage, 'FAILED'))
    summaryLogger.log("\n\n")
  }
  summaryLogger.logErroredStepResult = function(stepResult) {
    var errorMessage = stepResult.getFailureException();
    summaryLogger.log(self.formatStep(2, stepResult.getStep(), 'ERRORED'))
    summaryLogger.log(self.reindent(3, errorMessage.stack || errorMessage, 'ERRORED'))
    summaryLogger.log("\n\n")
  }
  summaryLogger.storeUndefinedStep = function(step) {
    var snippetBuilder = Cucumber.SupportCode.StepDefinitionSnippetBuilder(step);
    var snippet        = snippetBuilder.buildSnippet();
    summaryLogger.appendStringToUndefinedStepLogBuffer(snippet);
  }
  summaryLogger.logScenariosSummary = function() {
    var scenarioCount          = summaryLogger.statsJournal.getScenarioCount();
    var passedScenarioCount    = summaryLogger.statsJournal.getPassedScenarioCount();
    var undefinedScenarioCount = summaryLogger.statsJournal.getUndefinedScenarioCount();
    var pendingScenarioCount   = summaryLogger.statsJournal.getPendingScenarioCount();
    var failedScenarioCount    = summaryLogger.statsJournal.getFailedScenarioCount();
    // var erroredScenarioCount   = summaryLogger.statsJournal.getErroredScenarioCount();
    var details                = [];

    summaryLogger.log(self.colorize(scenarioCount + " scenario" + (scenarioCount != 1 ? "s" : ""), 'SUMMARY'));
    if (scenarioCount > 0 ) {
      // if (erroredScenarioCount > 0)
      //   details.push(self.colorize(erroredScenarioCount + " errored", 'ERRORED', true));
      if (failedScenarioCount > 0)
        details.push(self.colorize(failedScenarioCount + " failed", 'FAILED', true));
      if (undefinedScenarioCount > 0)
        details.push(self.colorize(undefinedScenarioCount + " undefined", 'UNDEFINED', true));
      if (pendingScenarioCount > 0)
        details.push(self.colorize(pendingScenarioCount + " pending", 'PENDING', true));
      if (passedScenarioCount > 0)
        details.push(self.colorize(passedScenarioCount + " passed", 'SUCCESS', true));
      summaryLogger.log(self.colorize(" (", 'SUMMARY') + details.join(self.colorize(', ', 'SUMMARY')) + self.colorize(")", 'SUMMARY'));
    }
    summaryLogger.log("\n");
  }
  summaryLogger.logStepsSummary = function() {
    var stepCount          = summaryLogger.statsJournal.getStepCount();
    var passedStepCount    = summaryLogger.statsJournal.getPassedStepCount();
    var undefinedStepCount = summaryLogger.statsJournal.getUndefinedStepCount();
    var skippedStepCount   = summaryLogger.statsJournal.getSkippedStepCount();
    var pendingStepCount   = summaryLogger.statsJournal.getPendingStepCount();
    var failedStepCount    = summaryLogger.statsJournal.getFailedStepCount();
    // var erroredStepCount   = summaryLogger.statsJournal.getErroredStepCount();
    var details            = [];

    summaryLogger.log(self.colorize(stepCount + " step" + (stepCount != 1 ? "s" : ""), 'SUMMARY'));
    if (stepCount > 0) {
      // if (erroredStepCount > 0)
      //   details.push(self.colorize(erroredStepCount    + " errored", 'ERRORED', true));
      if (failedStepCount > 0)
        details.push(self.colorize(failedStepCount    + " failed", 'FAILED', true));
      if (undefinedStepCount > 0)
        details.push(self.colorize(undefinedStepCount + " undefined", 'UNDEFINED', true));
      if (pendingStepCount > 0)
        details.push(self.colorize(pendingStepCount   + " pending", 'PENDING', true));
      if (skippedStepCount > 0)
        details.push(self.colorize(skippedStepCount   + " skipped", 'SKIPPED', true));
      if (passedStepCount > 0)
        details.push(self.colorize(passedStepCount    + " passed", 'SUCCESS', true));
      summaryLogger.log(self.colorize(" (", 'SUMMARY') + details.join(self.colorize(', ', 'SUMMARY')) + self.colorize(")", 'SUMMARY'));
    }
    summaryLogger.log("\n");
  }

  var parentHear = self.hear;
  self.hear = function hear(event, callback) {
    summaryLogger.hear(event, function () {
      parentHear(event, callback);
    });
  };
  self.indent = '  '
  self.kinds = {
    SUCCESS:   {color: 'green',  append_to_output: true},
    PENDING:   {color: 'cyan',   append_to_output: true},
    SKIPPED:   {color: 'blue',   append_to_output: true},
    UNDEFINED: {color: 'yellow', append_to_output: true},
    FAILED:    {color: 'red',    append_to_output: true},
    ERRORED:   {color: 'magenta',append_to_output: true},
    FEATURE:   {color: 'white',  append_to_output: false},
    SCENARIO:  {color: 'white',  append_to_output: false},
    SUMMARY:   {color: 'white',  append_to_output: false},
    DEFAULT:   {color: 'white',  append_to_output: false},
  }
  // colorize the text based on the kind.
  // if colors are turned off, it adds kind to the output.
  self.colorize = function(text, kind, skip_append_to_output) {
    var result = text
    var k = self.kinds[kind] || self.kinds.DEFAULT
    result = ansi_color(text, k.color)
    return result
  }
  self._overwriteHandler = function(handlerName, newFunction) {
    var origHandler = self[handlerName]
    self[handlerName] = function(event, callback) {
      newFunction(event, callback)
      if (origHandler) origHandler(event, callback)
      else callback()
    }
  }
  // logs a (multiline) message with indentation, using the given color
  self.reindent = function(indentLevel, text, color) {
    var indent = ''
    for (var i = 0; i < indentLevel; i++) {
      indent += self.indent
    }
    var result = ''
    text.split('\n').forEach(function(line) {
      result += indent + self.colorize(line + '\n', color)
    })
    return result
  }
  self.formatStep = function(indentLevel, step, color) {
    var result = self.reindent(indentLevel, step.getKeyword() + step.getName(), color)
    if (step.getDocString()) {
      result += self.reindent(indentLevel + 1, '"""', color)
      result += self.reindent(indentLevel + 1, step.getDocString().getContents(), color)
      result += self.reindent(indentLevel + 1, '"""', color)
    }
    if (step.hasDataTable()) {
      var hashes = step.getDataTable().hashes()
      var keys = Object.keys(hashes[0])
      var columnWidths = {}
      keys.forEach(function(columnName) {
        columnWidths[columnName] = columnName.length
        hashes.forEach(function(hash) {
          columnWidths[columnName] = Math.max(columnWidths[columnName], hash[columnName].length)
        })
      })
      function pad(s, width, ch) {
        while (s.length < width) {
          s += ch
        }
        return s
      }
      function formatHeader() {
        s = '| ' + formatRow(keys, ' | ', ' ') + ' |\n'
        return s + '+-' + formatRow([], '-+-', '-') + '-+'
      }
      function formatRow(arr, glue, paddingChar) {
        var s = ''
        keys.forEach(function(key, index) {
          if (index > 0) {
            s += glue
          }
          s += pad(arr[index] || '', columnWidths[key], paddingChar)
        })
        return s
      }
      function values(hash) {
        return keys.map(function(key) { return hash[key] })
      }
      var s = formatHeader()
      hashes.forEach(function(hash) {
        s += '\n' + '| ' + formatRow(values(hash), ' | ', ' ') + ' |'
      })
      result += self.reindent(indentLevel + 1, s, color)
    }
    return result
  }
  self.handleStepResultEvent = function handleStepResult(event, callback) {
    var stepResult = event.getPayloadItem('stepResult');
    if (stepResult.isSuccessful())
      self.handleSuccessfulStepResult(stepResult);
    else if (stepResult.isPending())
      self.handlePendingStepResult(stepResult);
    else if (stepResult.isSkipped())
      self.handleSkippedStepResult(stepResult);
    else if (stepResult.isUndefined())
      self.handleUndefinedStepResult(stepResult);
    else
      self.handleFailedStepResult(stepResult);
    callback();
  };
  self.handleSuccessfulStepResult = function(stepResult) {
    self.log(self.formatStep(2, stepResult.getStep(), 'SUCCESS'))
  }
  self.handlePendingStepResult = function(stepResult) {
    self.log(self.formatStep(2, stepResult.getStep(), 'PENDING'))
  }
  self.handleSkippedStepResult = function(stepResult) {
    self.log(self.formatStep(2, stepResult.getStep(), 'SKIPPED'))
  }
  self.handleUndefinedStepResult = function(stepResult) {
    self.log(self.formatStep(2, stepResult.getStep(), 'UNDEFINED'))
  }
  self.handleFailedStepResult = function(stepResult) {
    self.log(self.formatStep(2, stepResult.getStep(), 'FAILED'))
    // var failureMessage = stepResult.getFailureException()
    // self.logIndent(2, failureMessage.stack || failureMessage, 'FAILED')
  }
  self.handleErroredStepResult = function(stepResult) {
    self.log(self.formatStep(2, stepResult.getStep(), 'ERRORED'))
    // var failureMessage = stepResult.getFailureException()
    // self.logIndent(2, failureMessage.stack || failureMessage, 'ERRORED')
  }
  self._overwriteHandler('handleBeforeFeatureEvent', function(event, callback) {
    var feature = event.getPayloadItem('feature')
    self._last_feature = feature //only store the feature object, but do not print anything
  })
  self._overwriteHandler('handleBeforeScenarioEvent', function(event, callback) {
    // print out the stored feature object at the first time.
    // so it will not print all features when I use tag filtering.
    var feature = self._last_feature
    if (feature) {
      self._last_feature = undefined
      self.log(self.reindent(0, '\n' + feature.getKeyword() + ' ' + feature.getName(), 'FEATURE'))
      if (feature.getDescription()) {
        self.log(self.reindent(1, feature.getDescription(), 'FEATURE'))
      }
    }
    var scenario = event.getPayloadItem('scenario')
    self.log(self.reindent(1, '\n' + scenario.getKeyword() + ' ' + scenario.getName(), 'SCENARIO'))
    if (scenario.getDescription()) {
      self.log(self.reindent(2, scenario.getDescription(), 'SCENARIO'))
    }
  })
  self.handleAfterFeaturesEvent = function handleAfterFeaturesEvent(event, callback) {
    var summaryLogs = summaryLogger.getLogs();
    self.log(summaryLogs);
    callback();
  }
  self.logUndefinedStepSnippets = function logUndefinedStepSnippets() {
    var undefinedStepLogBuffer = self.getUndefinedStepLogBuffer();
    self.log("\nYou can implement step definitions for undefined steps with these snippets:\n\n");
    self.log(undefinedStepLogBuffer);
  }
  return self
}
module.exports = SpecFormatter
