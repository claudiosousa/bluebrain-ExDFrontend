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

