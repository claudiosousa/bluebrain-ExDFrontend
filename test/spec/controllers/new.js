'use strict';

describe('Controller: NewCtrl', function() {

    // load the controller's module
    beforeEach(module('exdFrontendApp'));

    var NewCtrl,
        scope,
        state;

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope, _$state_) {
        scope = $rootScope.$new();
        state = _$state_;
        NewCtrl = $controller('NewCtrl', {
            $scope: scope
        });
    }));

    it('should attach $state to the scope', function() {
        expect(scope.$state).toBe(state);
    });

    it('should create "environmentInput", "neurobotInput" and "brainInput" with specific properties', function() {
        var inputKeys = ["environmentInput", "neurobotInput", "brainInput"];
        var propertyKeys = ["type", "title", "description"];
        var inputLength = inputKeys.length;
        var propertyLength = propertyKeys.length;

        for (var i = 0; i < inputLength; ++i) {
            var input = scope[inputKeys[i]];
            expect(input).toBeDefined();
            expect(input.selectedEntity).not.toBeDefined();
            for (var j = 0; j < propertyLength; ++j) {
                expect(input[propertyKeys[j]]).toBeDefined();
            }
        }
    });

    it('should create "brainInput.selectableExtended", a function that returns true if the entity nrpBinding refers to the selected neurobot', function() {
        var getType = {};
        expect(getType.toString.call(scope.brainInput.selectableExtended)).toBe('[object Function]');
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