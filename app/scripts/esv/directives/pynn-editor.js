(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('pynnEditor', [
    'backendInterfaceService',
    'documentationURLs',
    'hbpDialogFactory',
    'simulationInfo',
    function (backendInterfaceService, documentationURLs, hbpDialogFactory, simulationInfo) {
      return {
        templateUrl: 'views/esv/pynn-editor.html',
        restrict: 'E',
        scope: {
          control: '='
        },
        link: function (scope, element, attrs) {

          scope.isCollabExperiment = simulationInfo.isCollabExperiment;
          scope.loading = false;
          scope.refreshCodemirror = false;
          scope.isSavingToCollab = false;

          scope.getCM = function() {
            if(!scope.cm) {
              // (please tell me if there is a nicer way to get that object (Bernd))
              scope.cm = document.getElementById("codeEditor").children[0].CodeMirror;
            }
            return scope.cm;
          };

          scope.getDoc = function() {
            if (!scope.doc) {
              scope.doc = scope.getCM().getDoc();
            }
            return scope.doc;
          };

          scope.control.refresh = function () {
            scope.loading = true;
            backendInterfaceService.getBrain(function(response) {
              if (response.brain_type === "py") {
                scope.pynnScript = response.data;
                scope.refreshCodemirror = !scope.refreshCodemirror; // just toggle it to refresh
                setTimeout(function () {
                  scope.loading = false;
                  scope.getDoc().clearHistory();
                  scope.getDoc().markClean();
                  scope.searchToken("si");
                }, 100);
              } else {
                scope.pynnScript = undefined;
                scope.refreshCodemirror = !scope.refreshCodemirror;
              }
            });
          };

          scope.update = function(pynnScript) {
            scope.loading = true;
            backendInterfaceService.setBrain(
              pynnScript, "py", "text",
              function() { // Success callback
                scope.loading = false;
                scope.getDoc().markClean();
                scope.clearError();
                hbpDialogFactory.alert({title: "Success.", template: "Successfully updated brain."});
              },
              function(result) { // Failure callback
                scope.loading = false;
                scope.clearError();
                scope.markError(pynnScript, result.data.error_message, result.data.error_line, result.data.error_column);
                hbpDialogFactory.alert({title: "Error.", template: result.data.error_message});
              });
          };

          scope.saveIntoCollabStorage = function (pynnScript) {
            scope.isSavingToCollab = true;
            backendInterfaceService.saveBrain(
              simulationInfo.contextID,
              pynnScript,
              function() { // Success callback
                scope.isSavingToCollab = false;
              },function() { // Failure callback
                hbpDialogFactory.alert({
                  title: "Error.",
                  template: "Error while saving pyNN script to Collab storage."
                });
                scope.isSavingToCollab = false;
              }
            );
          };

          scope.searchToken = function(name) {
            var cm = scope.getCM();
            var lines = scope.pynnScript.split('\n');
            var l = 0;
            var ret = {line: 0, ch: 0};
            var found = false;

            lines.forEach(function(line) {
              if (found) { return; }
              var c = -2;
              while (c !== -1 && !found) {
                c = line.indexOf(name, c+1);
                if (c !== -1) {
                  var token = cm.getTokenAt({line: l, ch: c + 1});
                  if (token.type !== "string" && token.string === name) {
                    ret = {line: l, ch: c};
                    found = true;
                  }
                }
              }
              l += 1;
            });
            return ret;
          };

          scope.parseName = function(error){
            if (error.search("is not defined") > 0) {
              var start = error.search("name '");
              var end = error.search("' is not defined");
              return error.substring(start+6,end);
            } else {
              return false;
            }
          };

          scope.markError = function(pynnScript, error_message, line, column) {
            scope.pynnScript = pynnScript;
            if (line === 0 && column === 0) {
              var tokenname = scope.parseName(error_message);
              if (!tokenname) { return; }
              var lc = scope.searchToken(tokenname);
              line = lc.line;
              column = lc.ch;
            } else {
              line -= 1;
              column -= 2;
              if (line < 0) { line = 0; }
              if (column < 0) { column = 0; }
            }

            var cm = scope.getCM();

            var err = ' '.repeat(column)  + '^\n' +  error_message;
            var htmlNode = document.createElement('pre');
            var text = document.createTextNode(err);
            htmlNode.appendChild(text);

            scope.lineHandle = cm.addLineClass(line, 'background', 'alert-danger');
            scope.lineWidget = cm.addLineWidget(line, htmlNode, true);
            cm.scrollIntoView({line: line, ch:1});
          };

          scope.clearError = function() {
            if (scope.lineHandle) {
              scope.getCM().removeLineClass(scope.lineHandle, 'background');
            }
            if (scope.lineWidget) {
              scope.lineWidget.clear();
            }
          };

          documentationURLs.getDocumentationURLs().then(function(data) {
            scope.backendDocumentationURL = data.backendDocumentationURL;
          });

        }
      };
    }]);
}());
