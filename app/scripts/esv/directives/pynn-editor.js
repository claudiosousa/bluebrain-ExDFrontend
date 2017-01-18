(function () {
  'use strict';

  angular.module('exdFrontendApp').directive('pynnEditor', [
    '$timeout',
    'backendInterfaceService',
    'documentationURLs',
    'hbpDialogFactory',
    'simulationInfo',
    'STATE',
    'stateService',
    'autoSaveService',
    'RESET_TYPE',
    function ($timeout, backendInterfaceService, documentationURLs, hbpDialogFactory, simulationInfo, STATE, stateService, autoSaveService,RESET_TYPE) {
      var DIRTY_TYPE = 'BRAIN';

      return {
        templateUrl: 'views/esv/pynn-editor.html',
        restrict: 'E',
        scope: {
          control: '='
        },
        link: function (scope, element, attrs) {

          scope.isCollabExperiment = simulationInfo.isCollabExperiment;
          scope.loading = false;
          scope.collabDirty = false;
          scope.localDirty = false;
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

          scope.resetListenerUnbindHandler = scope.$on('RESET', function (event, resetType) {
            if (resetType !== RESET_TYPE.RESET_CAMERA_VIEW)
            {
              scope.collabDirty = false;
              scope.localDirty = false;
            }
          });

          scope.control.refresh = function () {
            if (scope.collabDirty || scope.localDirty) {
              $timeout(function () { scope.refreshCodemirror = !scope.refreshCodemirror; }, 100);
              return;
            }

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

          /** Convert Populations Object into array and create for each population a unique
             * regular expression to avoid duplicate names.
          */

          scope.preprocessPopulations = function(neuronPopulations) {
            var populationNames = Object.keys(neuronPopulations);
            var populationsArray = populationNames.map(function (name, index) {
              var populationObject = neuronPopulations[name];
              populationObject.name = name;
              var isSlice = scope.isSlice(populationObject);
              if (isSlice && !populationObject.step) {
                populationObject.step = 1;
              }
              if (!isSlice) {
                var str = populationObject.toString();
                populationObject.list = str;
              }
              populationObject.regex = generateRegexPattern(populationNames, index);
              return populationObject;
            });
            return populationsArray;
          };

          function objectifyPopulations(neuroPopulations) {
            var populations = angular.copy(neuroPopulations);
            var populationsObject = {};
            angular.forEach(populations, function(population, index) {
              var name = population.name;
              delete population.name;
              populationsObject[name] = population;
            });
            return populationsObject;
          }

          function populationNames() {
            var names = scope.populations.map(function (obj) {
              return obj.name;
            });
            return names;
          }

          function generateRegexPattern(currentPopulationNames, index) {
            var pattern = '([A-z_]+[\\w_]*)$';
            var populationNames = angular.copy(currentPopulationNames);
            populationNames.splice(index, 1);
            populationNames = populationNames.filter(function(item) {
              return item !== undefined;
            });
            if (populationNames.length === 0) {
              return pattern;
            } else {
              var exclude = '^\\b(?!\\b' + populationNames.join('\\b|\\b') + '\\b)';
              return exclude + pattern;
            }
          }

          scope.updateRegexPatterns = function() {
            for (var i = 0; i < scope.populations.length; i++) {
              scope.populations[i].regex = generateRegexPattern(populationNames(), i);
            }
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

          scope.agreeAction = function () {
            scope.apply(1);
          };
          scope.doNotAgreeAction = function () {
            scope.apply(2);
          };

          /**
           * @param {integer} [change_population]
           */
          scope.apply = function (change_population) {
            var restart = stateService.currentState === STATE.STARTED;
            scope.loading = true;
            var populations = objectifyPopulations(scope.populations);
            stateService.ensureStateBeforeExecuting(
              STATE.PAUSED,
              function () {
                backendInterfaceService.setBrain(
                  scope.pynnScript, scope.stringsToLists(populations), 'py', 'text', change_population,
                  function () { // Success callback
                    scope.loading = false;
                    scope.getDoc().markClean();
                    scope.clearError();
                    scope.localDirty = false;
                    if (restart) {
                      stateService.setCurrentState(STATE.STARTED);
                    }
                  },
                  function (result) { // Failure callback
                    scope.loading = false;
                    scope.clearError();
                    if (result.data.handle_population_change) {
                      hbpDialogFactory.confirm({
                        title: 'Change TFs',
                        confirmLabel: 'Yes',
                        cancelLabel: 'No',
                        template: 'Would you like to have your transfer functions updated with the new population name?',
                        closable: false
                      }).then(scope.agreeAction, scope.doNotAgreeAction);
                    }
                    else {
                      scope.markError(
                        result.data.error_message,
                        result.data.error_line,
                        result.data.error_column
                      );
                      hbpDialogFactory.alert({title: 'Error.', template: result.data.error_message});
                    }
                  });
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
                scope.collabDirty = false;
                autoSaveService.clearDirty(DIRTY_TYPE);

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

          scope.isSlice = function(population) {
            return population.hasOwnProperty('from') && population.hasOwnProperty('to');
          };

          scope.deletePopulation = function(index) {
            scope.populations.splice(index, 1);
            scope.updateRegexPatterns();
          };

          scope.onBrainChange = function () {
            scope.collabDirty = scope.isCollabExperiment;
            scope.localDirty = true;
            autoSaveService.setDirty(DIRTY_TYPE, [scope.pynnScript, scope.populations]);
          };

          scope.$watch('pynnScript', function(after, before) { if (before) scope.onBrainChange();});
          scope.$watchCollection('populations', function(after, before) { if (before) scope.onBrainChange();});


          scope.addList = function() {
            var regex = generateRegexPattern(populationNames(), scope.populations.length);
            scope.populations.push({ name: scope.generatePopulationName(), list: '0, 1, 2', regex: regex});
            scope.updateRegexPatterns();
          };

          scope.addSlice = function() {
            var regex = generateRegexPattern(populationNames(), scope.populations.length);
            scope.populations.push({ name: scope.generatePopulationName(), from: 0, to: 1, step: 1, regex: regex});
            scope.updateRegexPatterns();
          };

          scope.generatePopulationName = function() {
            var prefix = 'population_';
            var suffix = 0;
            var existingNames = populationNames();
            while(existingNames.indexOf(prefix + suffix) >= 0) {
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

          var docs = documentationURLs.getDocumentationURLs();
          scope.backendDocumentationURL = docs.backendDocumentationURL;
          scope.platformDocumentationURL = docs.platformDocumentationURL;

          scope.$parent.$on("$destroy", function () {
            // Fix for Bug NRRPLT-3442.
            // Do not issue getBrain request if the pynn editor is
            // beeing destroyed; typically when a user pushes the STOP
            // button.
            scope.control.refresh = undefined;
          });

          autoSaveService.registerFoundAutoSavedCallback(DIRTY_TYPE, function (autoSaved) {
            scope.collabDirty = true;
            scope.pynnScript = autoSaved[0];
            scope.populations = autoSaved[1];
          });
        }
      };
    }]);
} ());
