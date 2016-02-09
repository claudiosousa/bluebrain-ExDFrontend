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
                scope.populations = scope.preprocessPopulations(response.additional_populations);
                scope.refreshCodemirror = !scope.refreshCodemirror; // just toggle it to refresh
                scope.loading = false;
                setTimeout(function () {
                  scope.getDoc().clearHistory();
                  scope.getDoc().markClean();
                  scope.searchToken("si");
                }, 100);
              } else {
                scope.pynnScript = undefined;
                scope.populations = undefined;
                scope.refreshCodemirror = !scope.refreshCodemirror;
              }
            });
          };

          scope.preprocessPopulations = function(neuronPopulations) {
            angular.forEach(neuronPopulations, function(population, name){
              var isSlice = scope.isSlice(population);
              // If the step field of a slice is undefined, we set it to its default value, i.e., 1.
              // This way the population form remains valid.
              if (isSlice && !population.step) {
                population.step = 1;
              }
              if (!isSlice) {
                // It must be a list.
                // We convert a JS array into a string for display in HTML input tag: [1,2,3] --> '1,2,3'
                var str = population.toString();
                neuronPopulations[name] = {list: str};
              }
            });
            return neuronPopulations;
          };

          scope.stringsToLists = function(neuronPopulations) {
            var populations = angular.copy(neuronPopulations);
            angular.forEach(populations, function(population, name){
              var isList = !scope.isSlice(population);
              if (isList) {
                var stringList = population.list.split(',');
                var numberList = _.map(stringList, function(item){
                  return Number(item);
                });
                populations[name] = numberList;
              }
            });
            return populations;
          };

          scope.apply = function() {
            scope.loading = true;
            backendInterfaceService.setBrain(
              scope.pynnScript, scope.stringsToLists(scope.populations), 'py', 'text',
              function() { // Success callback
                scope.loading = false;
                scope.getDoc().markClean();
                scope.clearError();
                hbpDialogFactory.alert({title: 'Success.', template: 'Successfully updated brain.'});
              },
              function(result) { // Failure callback
                scope.loading = false;
                scope.clearError();
                scope.markError(
                  result.data.error_message,
                  result.data.error_line,
                  result.data.error_column
                );
                hbpDialogFactory.alert({title: 'Error.', template: result.data.error_message});
              });
          };

          scope.saveIntoCollabStorage = function() {
            scope.isSavingToCollab = true;
            backendInterfaceService.saveBrain(
              simulationInfo.contextID,
              scope.pynnScript,
              scope.stringsToLists(scope.populations),
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

          scope.isSlice = function(indices) {
            return indices.hasOwnProperty('from') && indices.hasOwnProperty('to');
          };

          scope.deletePopulation = function(population) {
            delete scope.populations[population];
          };

          scope.addList = function() {
            var neuronName = scope.generatePopulationName();
            scope.populations[neuronName] = { list: '0, 1, 2' };
          };

          var defaultSlice = {
            'from': 0,
            'to': 1,
            'step': 1
          };

          scope.addSlice = function() {
            var neuronName = scope.generatePopulationName();
            scope.populations[neuronName] = angular.copy(defaultSlice);
          };

          scope.generatePopulationName = function() {
            var prefix = 'population_';
            var suffix = 0;
            while(prefix + suffix in scope.populations) {
              suffix += 1;
            }
            return prefix + suffix;
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

          scope.markError = function(error_message, line, column) {
            if (isNaN(line) || isNaN(column)) {
              return;
            }
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
            scope.platformDocumentationURL = data.platformDocumentationURL;
          });

        }
      };
    }]);
}());
