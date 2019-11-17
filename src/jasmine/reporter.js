jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(new (require('jasmine-spec-reporter').SpecReporter)({
  spec: {
    displayPending: true
  },
  summary: {
    displayDuration: false
  }
}));
