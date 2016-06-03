(function () {
    'use strict';

    angular.module('colorableObjectModule', ['simulationControlServices'])
        .constant('COLORABLE_VISUAL_REGEXP', /(::.+::(COLORABLE_VISUAL|screen_glass)|(cylinder|box|sphere)_[0-9]+::link::visual)$/)
        .factory('colorableObjectService', ['objectControl', 'COLORABLE_VISUAL_REGEXP',
            function (objectControl, COLORABLE_VISUAL_REGEXP) {

                //determines if entity has a colorable node. True if:
                // - the entity has a visual named 'screen_glass' (TV's)
                // - the entity has a visual named  'COLORABLE_VISUAL' (tagged visuals on the sdf)
                // - the entity has a node named 'cylinder_[n]' or 'box_[n]' or 'sphere_[n]' (dropped simple object)
                var getColorableNode = function (entity) {
                    var colorableNode;
                    entity.traverse(function (node) {
                        // Check whether the current node name matches the condition to be considered a node we can color
                        if (COLORABLE_VISUAL_REGEXP.test(node.name)) {
                            return (colorableNode = node);
                        }
                    });
                    return colorableNode;
                };

                var setEntityMaterial = function (simulationInfo, entity, material) {
                    var colorableNode = getColorableNode(entity);
                    var materialChange = { 'visual_path': colorableNode.name, 'material': material };
                    // Request color change through RESTful call
                    objectControl(simulationInfo.serverBaseUrl).updateMaterial(
                        { sim_id: simulationInfo.simulationID }, materialChange
                    );
                };

                var isColorableEntity = function (selectedEntity) {
                    return !!getColorableNode(selectedEntity);
                };

                return {
                    isColorableEntity: isColorableEntity,
                    setEntityMaterial: setEntityMaterial
                };
            }
        ]);
})();


