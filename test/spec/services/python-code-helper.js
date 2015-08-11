'use strict';

describe('Services: pythonCodeHelper', function () {

  var pythonCodeHelper;

  beforeEach(module('exdFrontendApp'));
  beforeEach(module('pythonCodeHelperServices'));

  beforeEach(inject(function (_pythonCodeHelper_) {
    pythonCodeHelper = _pythonCodeHelper_;
  }));

  it('should get the name of a python function properly', function () {
    expect(pythonCodeHelper.getFunctionName('\n\ndef toto  (a,b,c):\n    print \"toto\"\n')).toEqual('toto');
  });

});
