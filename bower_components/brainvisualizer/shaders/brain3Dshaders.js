/**
 * Brain visualizer / Shaders
 *
 */

//------------------------------
// Vertex Shader

BRAIN3D.vertexshader = "\
attribute float size; \
attribute vec3 vcolor; \
attribute float ex; \
attribute float textured; \
attribute float vall; \
 \
varying vec4 vC; \
varying float vexist; \
varying float texed; \
varying float val; \
 \
void main() { \
 \
    val = vall; \
    vC = vec4(vcolor, 1.0); \
    vexist = ex; \
    texed = textured; \
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
uniform sampler2D texture_aura; \
 \
varying vec4 vC;\
varying float vexist; \
varying float texed; \
varying float val; \
 \
 \
void main() { \
 \
	if ( vexist < 0.5 ) discard; \
 \
	vec4 outColor; \
    if(texed>0.6){outColor = texture2D( texture, gl_PointCoord );} \
    else{         outColor = texture2D( texture_aura, gl_PointCoord );} \
 \
    if ( outColor.a < 0.01 ) discard; \
     \
    if(texed>0.1){ \
		gl_FragColor = outColor * val * vec4( color * vC.xyz, 1.0 ); \
	}else{ \
		gl_FragColor = val * vec4( color * vC.xyz, 1.0 ); \
	} \
 \
} \
 \
";

