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

    it('should have the blueprint attribute for storing a blueprint', function(){
        expect(scope.input.blueprint).toEqual(jasmine.any(Object));
    });

    it('should call onEntityIdChange when the uuid of the entity changes',function(){
        spyOn(scope, 'onEntityIdChange');
        scope.input.blueprint.entity = {_uuid:'blubb'};
        scope.$digest();
        expect(scope.onEntityIdChange).toHaveBeenCalledWith('blueprint', 'blubb');
    });

    it('should call updateBlueprint with the results from hbpFileStore', inject(function(hbpFileStore){
        spyOn(hbpFileStore, 'getContent').andReturn({
          then: function(callback){callback('blubbData');}
        });
        spyOn(scope, 'updateBlueprint');

        scope.input.blueprint.entity = {_uuid:'blubb'};
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
        expect(scope.data.blueprint).toEqual(sampleBlueprint);
    });

    it('should assign an empty object as blueprint if the entity is empty', function(){
        scope.updateBlueprint('');
        expect(scope.data.blueprint).toEqual({});
    });

    it('should not call updateBlueprint for invalid entity uuid\'s', function(){
        spyOn(scope, 'updateBlueprint');
        scope.onEntityIdChange('blueprint', null);
        scope.onEntityIdChange('blueprint', undefined);
        scope.onEntityIdChange('blueprint', 42);
        scope.onEntityIdChange('blueprint', true);
        expect(scope.updateBlueprint).not.toHaveBeenCalled();
    });

    it('should have the pynnscript attribute for storing a pynnscript', function(){
        expect(scope.input.pynnscript).toEqual(jasmine.any(Object));
    });

    it('should call onEntityIdChange when the uuid of the entity changes',function(){
        spyOn(scope, 'onEntityIdChange');
        scope.input.pynnscript.entity = {_uuid:'blubb'};
        scope.$digest();
        expect(scope.onEntityIdChange).toHaveBeenCalledWith('pynnscript', 'blubb');
    });

    it('should call updatePynnscript with the results from hbpFileStore', inject(function(hbpFileStore){
        spyOn(hbpFileStore, 'getContent').andReturn({
          then: function(callback){callback('blubbData');}
        });
        spyOn(scope, 'updatePynnscript');

        scope.input.pynnscript.entity = {_uuid:'blubb'};
        scope.$digest();

        expect(hbpFileStore.getContent).toHaveBeenCalledWith('blubb');
        expect(scope.updatePynnscript).toHaveBeenCalledWith('blubbData');

    }));

    it('sould update the pynnscript after loading a new entity', function(){
        var samplePynnscript = '#I\'m a valid python script';
        scope.updatePynnscript(samplePynnscript);
        expect(scope.data.pynnscript).toEqual(samplePynnscript);
    });

    it('should assign an empty string as pynnscript if the entity is empty', function(){
        scope.updatePynnscript('');
        expect(scope.data.pynnscript).toEqual('');
    });

    it('should not call updatePynnscript for invalid entity uuid\'s', function(){
        spyOn(scope, 'updatePynnscript');
        scope.onEntityIdChange('pynnscript', null);
        scope.onEntityIdChange('pynnscript', undefined);
        scope.onEntityIdChange('pynnscript', 42);
        scope.onEntityIdChange('pynnscript', true);
        expect(scope.updatePynnscript).not.toHaveBeenCalled();
    });
});
