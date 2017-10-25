/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 * https://www.humanbrainproject.eu
 *
 * The Human Brain Project is a European Commission funded project
 * in the frame of the Horizon2020 FET Flagship plan.
 * http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END**/
(function() {
  'use strict';
  angular.module('exdFrontendApp').directive('rgbCurveEditor', [
    function() {
      return {
        templateUrl:
          'components/environment-settings/rgb-curve-editor.template.html',
        restrict: 'E',
        scope: {
          curve: '=',
          disabled: '=',
          selectedColorChannel: '=',
          onChange: '&'
        },
        link: function(scope, element, attrs) {
          //------------------------------------------
          // Init

          // Constants

          var canvas = element.find('#rgb-curve-canvas')[0];
          var canvasContext = canvas.getContext('2d');
          var pointSize = 8;

          //------------------------------------------
          // Vertices management

          scope.buildVertexList = function(channel) {
            var vertices;

            if (
              scope.curve === undefined ||
              scope.curve[channel] === undefined ||
              scope.curve[channel].length < 2
            ) {
              vertices = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(1, 1, 0)
              ]; // No color correction, display default curve
            } else {
              vertices = [];

              scope.curve[channel].forEach(function(pti) {
                vertices.push(new THREE.Vector3(pti[0], pti[1], 0));
              });
            }

            return vertices;
          };

          scope.updateCurveWithVertexList = function(channel, vertexList) {
            if (
              vertexList.length === 2 &&
              vertexList[0].x === 0 &&
              vertexList[0].y === 0 &&
              vertexList[1].x === 0 &&
              vertexList[1].y === 1
            ) {
              scope.curve[channel] = []; // No curve needed, simple linear colors
            } else {
              var newcurve = [];

              vertexList.forEach(function(vi) {
                newcurve.push([vi.x, vi.y]);
              });

              scope.curve[channel] = newcurve;
              scope.onChange();
            }
          };

          //------------------------------------------
          // Render

          scope.renderCurve = function() {
            var colors = [];

            if (scope.curve === undefined) {
              scope.curve = { red: [], green: [], blue: [] };
            }

            if (scope.disabled) {
              colors.push({
                key: 'red',
                color: '#EEEEEE',
                deselectedColor: '#EEEEEE'
              });
              colors.push({
                key: 'green',
                color: '#EEEEEE',
                deselectedColor: '#EEEEEE'
              });
              colors.push({
                key: 'blue',
                color: '#EEEEEE',
                deselectedColor: '#EEEEEE'
              });
            } else {
              colors.push({
                key: 'red',
                color: '#FF0000',
                deselectedColor: '#FFBBBB'
              });
              colors.push({
                key: 'green',
                color: '#00FF00',
                deselectedColor: '#BBFFBB'
              });
              colors.push({
                key: 'blue',
                color: '#0000FF',
                deselectedColor: '#BBBBFF'
              });
            }

            // Render selected channel last, so it appears in front

            switch (scope.selectedColorChannel) {
              case 0:
                colors.splice(2, 0, colors.splice(0, 1)[0]);
                break;
              case 1:
                colors.splice(2, 0, colors.splice(1, 1)[0]);
                break;
            }

            colors[0].color = colors[0].deselectedColor; // First two channels should
            colors[1].color = colors[1].deselectedColor; // use the deselected color which is lighter
            colors[2].selected = true;

            canvasContext.fillStyle = '#FFFFFF';
            canvasContext.fillRect(0, 0, canvas.width, canvas.height);
            canvasContext.lineWidth = 2;

            colors.forEach(function(coli) {
              var key = coli.key;
              var color = coli.color;
              var selected = coli.selected;
              var vertices;
              var x, y, vec;
              var i;

              // Prepare vertices

              vertices = scope.buildVertexList(key);

              // Render curve

              canvasContext.strokeStyle = color;
              canvasContext.beginPath();

              if (vertices.length === 2) {
                // Linear, no curve is required

                vertices.forEach(function(vec, i) {
                  x = vec.x * canvas.width;
                  y = canvas.width - vec.y * canvas.height;

                  if (i === 0) {
                    canvasContext.moveTo(x, y);
                  } else {
                    canvasContext.lineTo(x, y);
                  }
                });
              } else {
                var catmullCurve = new THREE.CatmullRomCurve3(vertices);

                for (i = 0; i <= canvas.width; i += 8) {
                  vec = catmullCurve.getPoint(i / canvas.width);
                  x = vec.x * canvas.width;
                  y = canvas.width - vec.y * canvas.height;

                  if (i === 0) {
                    canvasContext.moveTo(x, y);
                  } else {
                    canvasContext.lineTo(x, y);
                  }
                }
              }

              canvasContext.stroke();

              // Render points

              if (selected) {
                canvasContext.fillStyle = color;

                vertices.forEach(function(vec) {
                  var x = vec.x * canvas.width;
                  var y = canvas.width - vec.y * canvas.height;

                  canvasContext.beginPath();
                  canvasContext.arc(x, y, pointSize, 0, 2 * Math.PI);

                  canvasContext.fill();
                });
              }
            });
          };

          //------------------------------------------
          // Update

          scope.$watch(
            'disabled',
            function() {
              scope.renderCurve(); // State modified, update canvas
            },
            true
          );

          scope.$watch(
            'curve',
            function() {
              scope.renderCurve(); // Curve modified, update canvas
            },
            true
          );

          scope.$watch(
            'selectedColorChannel',
            function() {
              scope.renderCurve(); // Selected color channel has been modified, update canvas
            },
            true
          );

          //------------------------------------------
          // Events

          scope.selectedColor = function() {
            switch (scope.selectedColorChannel) {
              case 0:
                return 'red';
              case 1:
                return 'green';
              default:
                return 'blue';
            }
          };

          scope.mouseDown = function(e) {
            if (scope.disabled) {
              return;
            }

            var mx, my, i, vec, x, y, vx, vy, hitZone;
            scope.mouseEditingVertices = scope.buildVertexList(
              scope.selectedColor()
            );

            var rect = canvas.getBoundingClientRect();
            mx = e.clientX - rect.left;
            my = e.clientY - rect.top;

            scope.draggingPointIndex = -1;
            scope.draggingPointLastMouseX = mx;
            scope.draggingPointLastMouseY = my;

            // Check if it is on a vertex

            scope.mouseEditingVertices.forEach(function(vec, vi) {
              x = vec.x * canvas.width;
              y = canvas.width - vec.y * canvas.height;

              vx = mx - x;
              vy = my - y;
              hitZone = pointSize + 16;

              if (vx * vx + vy * vy < hitZone * hitZone) {
                scope.draggingPointIndex = vi;
              }
            });

            // Now point was hit, we should add one if the click was on the curve

            if (scope.draggingPointIndex === -1) {
              var catmullCurve = new THREE.CatmullRomCurve3(
                scope.mouseEditingVertices
              );

              for (
                i = 0;
                i <= canvas.width && scope.draggingPointIndex === -1;
                i += 4
              ) {
                vec = catmullCurve.getPoint(i / canvas.width);
                x = vec.x * canvas.width;
                y = canvas.width - vec.y * canvas.height;

                vx = mx - x;
                vy = my - y;
                hitZone = pointSize + 16;

                if (vx * vx + vy * vy < hitZone * hitZone) {
                  // Add point at the right place

                  for (
                    var j = 0;
                    j < scope.mouseEditingVertices.length - 1;
                    j += 1
                  ) {
                    if (
                      vec.x >= scope.mouseEditingVertices[j].x &&
                      vec.y < scope.mouseEditingVertices[j + 1].x
                    ) {
                      var newPt = new THREE.Vector3(
                        mx / canvas.width,
                        1.0 - my / canvas.height,
                        0
                      );

                      scope.draggingPointIndex = j + 1;
                      scope.mouseEditingVertices.splice(
                        scope.draggingPointIndex,
                        0,
                        newPt
                      );

                      break;
                    }
                  }
                }
              }
            }
          };

          scope.mouseMove = function(e) {
            if (scope.disabled) {
              return;
            }

            var rect = canvas.getBoundingClientRect();
            var mx = e.clientX - rect.left;
            var my = e.clientY - rect.top;

            var deltaX = mx - scope.draggingPointLastMouseX;
            var deltaY = my - scope.draggingPointLastMouseY;

            scope.draggingPointLastMouseX = mx;
            scope.draggingPointLastMouseY = my;

            if (scope.draggingPointIndex >= 0) {
              // Drag point
              if (
                scope.draggingPointIndex === 0 ||
                scope.draggingPointIndex ===
                  scope.mouseEditingVertices.length - 1
              ) {
                deltaX = 0; // Start/end point cannot be moved on horizontal axis
              }

              var newX =
                scope.mouseEditingVertices[scope.draggingPointIndex].x +
                deltaX / canvas.width;
              var newY =
                scope.mouseEditingVertices[scope.draggingPointIndex].y -
                deltaY / canvas.height;

              newX = Math.min(Math.max(0.0, newX), 1.0); // Clamp
              newY = Math.min(Math.max(0.0, newY), 1.0);

              scope.mouseEditingVertices[scope.draggingPointIndex].x = newX;
              scope.mouseEditingVertices[scope.draggingPointIndex].y = newY;

              scope.updateCurveWithVertexList(
                scope.selectedColor(),
                scope.mouseEditingVertices
              );
              scope.renderCurve();
            }
          };

          scope.mouseUp = function(e) {
            scope.draggingPointIndex = -1;
          };

          scope.mouseOut = function(e) {
            scope.draggingPointIndex = -1;
          };

          $(canvas).on('mousemove', scope.mouseMove);
          $(canvas).on('mousedown', scope.mouseDown);
          $(canvas).on('mouseup', scope.mouseUp);
          $(canvas).on('mouseout', scope.mouseOut);

          //------------------------------------------
          // Terminate

          scope.terminate = function() {
            $(canvas).off('mousemove');
            $(canvas).off('mousedown');
            $(canvas).off('mouseup');
            $(canvas).off('mouseout');
          };

          scope.$on('$destroy', scope.terminate);
        }
      };
    }
  ]);
})();
