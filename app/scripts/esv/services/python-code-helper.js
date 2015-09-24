(function () {
  'use strict';

  var pythonCodeHelperServices = angular.module('pythonCodeHelperServices', []);

  pythonCodeHelperServices.factory('pythonCodeHelper', function () {

      var returnValue = {};

      returnValue.getFunctionName = function (code) {
        // Kind of weird, but if we move that up as a service variable, it produces random bugs.
        var transferFunctionNameRegExp = /^.*def\s+(\w+)\s*\(.*/gm;
        var matches = transferFunctionNameRegExp.exec(code);
        if (matches) {
          return matches[1];
        }
      };

      returnValue.ScriptObject = function(id, code) {
            this.name = this.id = id;
            this.code = code;
            this.local = this.dirty = false;
            this.error = {};
      };
      
      return returnValue;
    }
  );
}());
