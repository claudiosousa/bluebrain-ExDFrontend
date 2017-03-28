'use strict';

describe('Directive: show-on-top', function () {

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates'));

    var panels;
    var $rootScope, MAX_PANEL_ZINDEX, $compile;

    beforeEach(inject(function (_$rootScope_, _MAX_PANEL_ZINDEX_, _$compile_) {
        $rootScope = _$rootScope_;
        $compile = _$compile_;
        MAX_PANEL_ZINDEX = _MAX_PANEL_ZINDEX_;
        panels = [];
        for (var i = 0; i < 3; i++) {
            $rootScope['show' + i] = false;
            panels.push($compile('<div show-on-top ng-show="show' + i + '"/>')($rootScope.$new()));
        }
        $rootScope.$digest();
    }));

    function getZINdex(panel) {
        return Number(panel.css('z-index'));
    }

    it('should bring a panel to the front when shown', function () {
        $rootScope.show0 = true;
        $rootScope.$digest();
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX);
    });

    it('should bring new panel to the front and push the previous ones backwards', function () {
        $rootScope.show0 = true;
        $rootScope.$digest();
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX);

        $rootScope.show1 = true;
        $rootScope.$digest();
        expect(getZINdex(panels[1])).toBe(MAX_PANEL_ZINDEX);
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX - 1);

        $rootScope.show2 = true;
        $rootScope.$digest();
        expect(getZINdex(panels[2])).toBe(MAX_PANEL_ZINDEX);
        expect(getZINdex(panels[1])).toBe(MAX_PANEL_ZINDEX - 1);
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX - 2);

        $rootScope.show0 = false;
        $rootScope.$digest();
        $rootScope.show0 = true;
        $rootScope.$digest();
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX);
        expect(getZINdex(panels[2])).toBe(MAX_PANEL_ZINDEX - 1);
        expect(getZINdex(panels[1])).toBe(MAX_PANEL_ZINDEX - 2);
    });

    it('should bring new panel to the front when clicking on a panel', function () {
        panels[0].trigger('click');
        $rootScope.$digest();
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX);

        panels[1].trigger('click');
        $rootScope.$digest();
        expect(getZINdex(panels[1])).toBe(MAX_PANEL_ZINDEX);
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX - 1);

        panels[2].trigger('click');
        $rootScope.$digest();
        expect(getZINdex(panels[2])).toBe(MAX_PANEL_ZINDEX);
        expect(getZINdex(panels[1])).toBe(MAX_PANEL_ZINDEX - 1);
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX - 2);

        panels[0].trigger('click');
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX);
        expect(getZINdex(panels[2])).toBe(MAX_PANEL_ZINDEX - 1);
        expect(getZINdex(panels[1])).toBe(MAX_PANEL_ZINDEX - 2);
    });


    it('should through exception if applied to element without ng-show', function () {
        expect(function () {
            $compile('<div show-on-top/>')($rootScope.$new());
        }).toThrow('Directive \'show-on-top\' requires a ng-show to exist in the same element');
    });

    it('should not re-apply z-index if panel is already on top', function () {
        spyOn(panels[0], 'css').and.callThrough();
        panels[0].trigger('click');
        $rootScope.$digest();
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX);
        expect(panels[0].css).toHaveBeenCalled();

        panels[0].css.calls.reset();
        panels[0].trigger('click');
        $rootScope.$digest();
        expect(panels[0].css).not.toHaveBeenCalled();
    });

    it('should no longuer manipulate destroyed elements', function () {
        $rootScope.show0 = true;
        $rootScope.$digest();
        $rootScope.show1 = true;
        $rootScope.$digest();
        $rootScope.show2 = true;
        $rootScope.$digest();
        expect(getZINdex(panels[2])).toBe(MAX_PANEL_ZINDEX);
        expect(getZINdex(panels[1])).toBe(MAX_PANEL_ZINDEX - 1);
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX - 2);

        panels[2].scope().$destroy();
        $rootScope.$digest();
        panels[0].trigger('click');
        $rootScope.$digest();
        expect(getZINdex(panels[0])).toBe(MAX_PANEL_ZINDEX);
        //the panel[1] was previously at (MAX_PANEL_ZINDEX - 1)
        //and now that we have brought panels[1] to the top, panel[0] will be at the bottom
        //but there should be only two panels left in the pile of panels so the bottom should be (MAX_PANEL_ZINDEX - 1)
        expect(getZINdex(panels[1])).toBe(MAX_PANEL_ZINDEX - 1);
    });

});