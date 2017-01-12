(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .service('editorsServices', [
      '$timeout',
      function ($timeout) {

        return {
          getDefaultEditorOptions: getDefaultEditorOptions,
          getEditor: getEditor,
          refreshEditor: refreshEditor,
          refreshAllEditors: refreshAllEditors,
          resetEditor: resetEditor
        };

        function getDefaultEditorOptions() {
          return {
            lineWrapping : true,
            lineNumbers: true,
            readOnly: false,
            indentUnit: 4,
            mode: 'text/x-python'
          };
        }

        function getEditor(id) {
          var codeMirrorDiv = document.getElementById(id).firstChild;
          return codeMirrorDiv.CodeMirror;
        }

        function refreshEditor(editor) {
          $timeout(function() {
            editor.refresh();
          }, 100);
        }

        function refreshAllEditors(ids) {
          $timeout(function() {
            _.forEach(ids, function(id) {
              refreshEditor(getEditor(id));
            });
          }, 100);
        }

        function resetEditor(editor) {
          editor.clearHistory();
          editor.markClean();
        }
      }]);
} ());