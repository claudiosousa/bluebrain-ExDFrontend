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

