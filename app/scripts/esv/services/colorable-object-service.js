(function () {
    'use strict';

    angular.module('colorableObjectModule', ['simulationControlServices'])
        .constant('COLORABLE_VISUAL_REGEXP', {
            EMISSIVE: /::.+::screen_glass$/,
            NORMAL: /(::.+::COLORABLE_VISUAL)|((cylinder|box|sphere)_[0-9]+::link::visual)$/
        })
        .factory('colorableObjectService', ['objectControl', 'COLORABLE_VISUAL_REGEXP',
            function (objectControl, COLORABLE_VISUAL_REGEXP) {
                var EMISSIVE_COLOR_POSTFIX = 'Glow';

                //returns a node matching the regexp in parameter
                var getNode = function (entity, regexp) {
                    var foundNode;
                    entity.traverse(function (node) {
                        // Check whether the current node name matches the regexp condition
                        if (regexp.test(node.name)) {
                            return (foundNode = node);
                        }
                    });
                    return foundNode;
                };

                var setEntityMaterial = function (simulationInfo, entity, material) {
                    var colorableNode = getNode(entity, COLORABLE_VISUAL_REGEXP.NORMAL);
                    if (!colorableNode) {
                        colorableNode = getNode(entity, COLORABLE_VISUAL_REGEXP.EMISSIVE);
                        material += EMISSIVE_COLOR_POSTFIX;
                    }
                    var materialChange = { 'visual_path': colorableNode.name, 'material': material };
                    // Request color change through RESTful call
                    objectControl(simulationInfo.serverBaseUrl).updateMaterial(
                        { sim_id: simulationInfo.simulationID }, materialChange
                    );
                };

                //determines if entity has a colorable node
                var isColorableEntity = function (selectedEntity) {
                    return !!(getNode(selectedEntity, COLORABLE_VISUAL_REGEXP.EMISSIVE) || getNode(selectedEntity, COLORABLE_VISUAL_REGEXP.NORMAL));
                };

                return {
                    isColorableEntity: isColorableEntity,
                    setEntityMaterial: setEntityMaterial
                };
            }
        ]);
})();


