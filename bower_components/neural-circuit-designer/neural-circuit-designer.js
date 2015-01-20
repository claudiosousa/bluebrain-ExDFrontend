(function(){
    'use strict';
    angular.module('ncdModule',['ncdTemplates']);
})();

(function(){
    'use strict';

    angular.module('ncdModule').directive('ncdLayers', function(){
        return {
            restrict: 'E',
            templateUrl: 'layers.html'
        };
    });
})();

(function(){
    'use strict';

    angular.module('ncdModule').directive('ncdApp', function(){
        return {
            restrict: 'E',
            templateUrl: 'main.html',
            scope: {
                blueprint: '=',
                pynnscript: '='
            },
            link: function($scope){
                $scope.tabs = {
                    alltabs: ['Raw', 'Neurons', 'Layers'],
                    current: 0
                };
            }
        };
    });
})();

(function(){
    'use strict';

    angular.module('ncdModule').directive('ncdNeurons', function(){
        return {
            restrict: 'E',
            templateUrl: 'neurons.html'
        };
    });
})();

(function(){
    'use strict';

    angular.module('ncdModule').directive('ncdRaw', function(){
        return {
            restrict: 'E',
            templateUrl: 'raw.html'
        };
    });
})();


angular.module('ncdTemplates', ['layers.html', 'main.html', 'neurons.html', 'raw.html']);

angular.module("layers.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("layers.html",
    "<h1>I'm the layers view!</h1>");
}]);

angular.module("main.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("main.html",
    "<div class=ncd-tabbar><span class=ncd-tabitem ng-class=\"{'active':(tabs.current == $index)}\" ng-repeat=\"tab in tabs.alltabs\" ng-click=\"tabs.current = $index\">{{tab}}</span></div><div class=ncd-view ng-switch=tabs.current><ncd-raw ng-switch-when=0></ncd-raw><ncd-neurons ng-switch-when=1></ncd-neurons><ncd-layers ng-switch-when=2></ncd-layers></div>");
}]);

angular.module("neurons.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("neurons.html",
    "<h1>I'm the neurons view</h1>");
}]);

angular.module("raw.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("raw.html",
    "<div ng-if=blueprint><p>Raw blueprint json file:</p><pre>\n" +
    "    <code class=json>{{blueprint}}</code>\n" +
    "  </pre></div><div ng-if=pynnscript><p>Raw blueprint json file:</p><pre>\n" +
    "    <code class=python>{{pynnscript}}</code>\n" +
    "  </pre></div>");
}]);
