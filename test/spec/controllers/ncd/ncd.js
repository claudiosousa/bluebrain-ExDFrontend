'use strict';

describe('Controller: NcdCtrl', function () {

    // load the controller's module
    beforeEach(module('exdFrontendApp'));

    var NcdCtrl,
        scope,
        state;

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope, _$state_) {
        scope = $rootScope.$new();
        state = _$state_;
        NcdCtrl = $controller('NcdCtrl', {
            $scope: scope
        });
    }));

    it('should attach $state to the scope for the navbar', function() {
        expect(scope.$state).toBe(state);
    });

    it('should have the blueprint attribute for storing a blueprint', function(){
        expect(scope.blueprint).toBeDefined();
    });

    it('should call onEntityIdChange when the uuid of the entity changes',function(){
        spyOn(scope, 'onEntityIdChange');
        scope.input.entity = {_uuid:'blubb'};
        scope.$digest();
        expect(scope.onEntityIdChange).toHaveBeenCalledWith('blubb');
    });

    it('should call updateBlueprint with the results from hbpFileStore', inject(function(hbpFileStore){
        spyOn(hbpFileStore, 'getContent').andReturn({
          then: function(callback){callback('blubbData');}
        });
        spyOn(scope, 'updateBlueprint');

        scope.input.entity = {_uuid:'blubb'};
        scope.$digest();

        expect(hbpFileStore.getContent).toHaveBeenCalledWith('blubb');
        expect(scope.updateBlueprint).toHaveBeenCalledWith('blubbData');

    }));

    it('sould update the blueprint after loading a new entity', function(){
        var sampleBlueprint = {
            I: 'am actually',
            not: 'a blueprint',
            at: 'all',
            but: 'for testing',
            it: 'does not matter'
        };
        scope.updateBlueprint(sampleBlueprint);
        expect(scope.blueprint).toEqual(sampleBlueprint);
    });

    it('should assign an empty object as blueprint if the entity is empty', function(){
        scope.updateBlueprint('');
        expect(scope.blueprint).toEqual({});
    });

    it('should not call updateBlueprint for invalid entity uuid\'s', function(){
        spyOn(scope, 'updateBlueprint');
        scope.onEntityIdChange(null);
        scope.onEntityIdChange(undefined);
        scope.onEntityIdChange(42);
        scope.onEntityIdChange(true);
        expect(scope.updateBlueprint).not.toHaveBeenCalled();
    });
});
