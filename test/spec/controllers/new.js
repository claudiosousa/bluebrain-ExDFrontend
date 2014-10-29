'use strict';

describe('Controller: NewCtrl', function() {

    // load the controller's module
    beforeEach(module('exDfrontendApp'));

    var NewCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope) {
        scope = $rootScope.$new();
        NewCtrl = $controller('NewCtrl', {
            $scope: scope
        });
    }));


    it('should create "environmentInput", "neurobotInput" and "brainInput" with specific properties', function() {
        var inputKeys = ["environmentInput", "neurobotInput", "brainInput"];
        var propertyKeys = ["type", "title", "description"];
        var inputLength = inputKeys.length;
        var propertyLength = propertyKeys.length;

        for (var i = 0; i < inputLength; ++i) {
            var input = scope[inputKeys[i]];
            expect(typeof(input) !== 'undefined').toBe(true);
            expect(input.selectedEntity === undefined).toBe(true);
            for (var j = 0; j < propertyLength; ++j) {
                expect(typeof(input[propertyKeys[j]]) !== 'undefined').toBe(true);
            }
        }
    });

    it('should create "brainInput.SelectableExtended", a function that returns true if the entity nrpBinding refers to the selected neurobot', function() {
        var getType = {};
        expect(getType.toString.call(scope.brainInput.selectableExtended) === '[object Function]').toBe(true);
        var entity;
        expect(scope.brainInput.selectableExtended(entity)).toBe(false);
        entity = {
            nrpBinding: undefined
        };
        expect(scope.brainInput.selectableExtended(entity)).toBe(false);
        entity.nrpBinding = 'Some Neurobot name';
        scope.neurobotInput.selectedEntity = {
            nrpName: 'Some other Neurobot name'
        };
        expect(scope.brainInput.selectableExtended(entity)).toBe(false);
        scope.neurobotInput.selectedEntity.nrpName = 'Some Neurobot name';
        expect(scope.brainInput.selectableExtended(entity)).toBe(true);
    });

});