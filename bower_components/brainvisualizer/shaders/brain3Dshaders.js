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
/**
 * Brain visualizer / Shaders
 *
 */

//------------------------------
// Vertex Shader


BRAIN3D.vertexshader = "\
attribute float size; \
attribute vec3 vcolor; \
 \
varying vec4 vC; \
varying float drawvertice; \
 \
void main() { \
 \
    vC = vec4(vcolor, 1.0); \
    drawvertice = size; \
 \
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 ); \
 \
    gl_PointSize = size * ( 150.0 / length( mvPosition.xyz ) ); \
 \
    gl_Position = projectionMatrix * mvPosition; \
 \
} \
";


BRAIN3D.maskvertexshader = "\
attribute float size; \
attribute vec3 vcolor; \
attribute float innermask; \
 \
varying vec4 vC; \
varying float drawvertice; \
varying float drawinnermask; \
 \
void main() { \
 \
    vC = vec4(vcolor, 1.0); \
    drawvertice = size; \
    drawinnermask = innermask; \
 \
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 ); \
 \
    gl_PointSize = size * ( 75.0 / length( mvPosition.xyz ) ); \
 \
    gl_Position = projectionMatrix * mvPosition; \
 \
} \
";

//------------------------------
// Fragment Shader

BRAIN3D.fragmentshader = " \
uniform vec3 color; \
uniform sampler2D texture; \
 \
varying vec4 vC;\
varying float drawvertice; \
 \
 \
void main() { \
 \
	if ( drawvertice <= 0.0 ) discard; \
 \
	vec4 outColor; \
  outColor = texture2D( texture, gl_PointCoord ); \
 \
    if ( outColor.a < 0.2 ) discard; \
     \
	gl_FragColor = outColor * vec4( color * vC.xyz, 1.0 ); \
 \
} \
 \
";

BRAIN3D.maskfragmentshader = " \
uniform vec3 color; \
uniform sampler2D texture; \
 \
varying vec4 vC;\
varying float drawvertice; \
varying float drawinnermask; \
 \
 \
void main() { \
 \
	if ( drawvertice <= 0.0 ) discard; \
 \
	vec4 outColor; \
  outColor = texture2D( texture, gl_PointCoord ); \
  if (drawinnermask>0.0) \
  { \
    vec4 maskColor; \
    vec2 maskCoord = gl_PointCoord; \
    maskCoord = maskCoord-0.5;  \
    maskCoord = maskCoord * 1.3; \
    maskCoord = maskCoord+0.5;  \
    maskCoord = clamp(maskCoord,0.0,1.0); \
    maskColor = texture2D( texture, maskCoord ); \
    outColor = outColor * (1.0-maskColor.w); \
  } \
 \
     \
	gl_FragColor = outColor * vec4( color * vC.xyz, 1.0 ); \
 \
} \
 \
";

