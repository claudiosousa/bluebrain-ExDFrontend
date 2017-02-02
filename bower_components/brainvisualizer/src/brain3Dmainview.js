/**
 * Brain visualizer / Main view
 *
 */

//------------------------------
// Constants

// Sphere type

BRAIN3D.SPHERE_TYPE_BLENDED = 'Blended';
BRAIN3D.SPHERE_TYPE_SPHERE = 'Sphere';
BRAIN3D.SPHERE_TYPE_POINT = 'Point';
BRAIN3D.SPHERE_TYPE_SIMPLE = 'Color';

// Color map

BRAIN3D.COLOR_MAP_POLULATIONS = 'Populations';
BRAIN3D.COLOR_MAP_NONE = 'None';

// Camera zoom min/max

BRAIN3D.CAMERA_MIN_ZOOM = 10;
BRAIN3D.CAMERA_MAX_ZOOM = 750.0;

// neuronesDones

BRAIN3D.OVERLAPPING_NEURONES_RESIZE_FACTOR = 0.3;



//------------------------------
// Initialize

BRAIN3D.MainView = function (container, data, ballImagePath, ballAuraImagePath)
{
    this.populations = data.populations;
    this.userXYZ = data.xyz;
    this.container = container;
    this.ballImagePath = ballImagePath;
    this.ballAuraImagePath = ballAuraImagePath;
    this.init();
};

BRAIN3D.MainView.prototype.init = function ()
{
    this.needsAnimationPass = false;
    this.paused = false;
    this.particles = [];

    this.ptsize = 6.0;
    this.ptsizeInViewOld = 0;
    this.spheretype = BRAIN3D.SPHERE_TYPE_POINT;
    this.colormap = BRAIN3D.COLOR_MAP_POLULATIONS;
    this.min_render_dist = 1.0;             // Clipping planes
    this.max_render_dist = 1000.0;

    this.cameraZoom = 400.0;
    this.cameraTheta = -1.0;
    this.cameraPhi = 1.56;
    this.cameraThetaOld = 0.0;
    this.cameraPhiOld = 0.0;
    this.camera_translation = [0.0, 0.0, 0.0];
    this.cameraDefaultRotation = true;

    this.mouse = { x: 0, y: 0 };
    this.mouseOld = { x: 0, y: 0 };
    this.mouseLast = { x: 0, y: 0 };
    this.mouseSpeed = { x: 0, y: 0 };
    this.mouseIsDown = false;

    this.time = 0;

    this.initPopulations();
    this.init3D();
    this.initImages();
    this.init3DBrain();
    this.initInteractivity();

    this.startPeriodicalUpdate();
};

BRAIN3D.MainView.prototype.init3D = function ()     // Init Three JS
{
    this.currentWidth = this.width();
    this.currentHeight = this.height();

    this.camera = new THREE.PerspectiveCamera(40, this.width() / this.height(), 1, 1000);
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    var canvas;
    try
    {
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        exts = ctx.getSupportedExtensions();
    }
    catch (e)
    {
        // WebGL is not available, don't build a renderer
        this.renderer = undefined;
        return;
    }

    this.renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true, antialias: true });
    this.renderer.setSize(this.width(), this.height());
    this.renderer.setClearColor(new THREE.Color().setRGB(0.0, 0.0, 0.0), 0);
    this.renderer.sortObjects = false;
    this.container.appendChild(this.renderer.domElement);
};

BRAIN3D.MainView.prototype.initPopulations = function ()     // Init population
{
    for (var popname in this.populations)
    {
        var popValues = this.populations[popname];

        popValues.name = popname;
        popValues.color3D = new THREE.Color(popValues.color);
    }
};

BRAIN3D.MainView.prototype.newParticle = function (pop, posx,posy,posz, psize)     // Init a new particle
{
    return {x:posx,     // Current pos
            y:posy,
            z:posz,
            tx:posx,    // Target pos
            ty:posy,
            tz:posz,
            xyzInterpolant:1.0,
            size:psize,
            tsize:psize,
            sizeInterpolant:1.0,
            population: pop };
};

BRAIN3D.MainView.prototype.init3DBrain = function ()     // Init brain 3D object
{
    // Shader Attributes / Uniforms
    this.uniforms = { amplitude: { type: "f", value: 1.0 }, color: { type: "c", value: new THREE.Color(0xffffff) }, texture: { type: "t", value: this.auraimage } };
    this.uniforms.texture.value.wrapS = this.uniforms.texture.value.wrapT = THREE.RepeatWrapping;

    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: BRAIN3D.vertexshader,
        fragmentShader: BRAIN3D.fragmentshader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
    });

    this.cameraZoom = BRAIN3D.CAMERA_MIN_ZOOM;  // By Default min zoom for now

    // Particles

    this.particles = [];

    var sc = 0.025;

    var xyz = this.userXYZ;  // For now use only XYZ predefined coordinates

    var neuronesVisible = {};

    for(var popname in this.populations)
    {
        var popValues = this.populations[popname];
        var start = popValues.from;
        var end = popValues.to;
        var step = popValues.hasOwnProperty('step') ? popValues.step : 1;
        if (step <= 0) step = 1;

        for (var i = start; i < end; i += step)
        {
            var nsize = 1.0;

            if (popValues.visible)
            {
                if (!neuronesVisible.hasOwnProperty(i))
                {
                    neuronesVisible[i] = 1;
                }
                else
                {
                    neuronesVisible[i] += 1;
                }

                nsize = 1.0-((neuronesVisible[i]-1.0)*BRAIN3D.OVERLAPPING_NEURONES_RESIZE_FACTOR);
            }

            if (i >= 0 && i < xyz.length / 3)
            {
                this.particles.push(this.newParticle( popValues,
                                            sc * xyz[i * 3 + 0],
                                            sc * xyz[i * 3 + 1],
                                            sc * xyz[i * 3 + 2],
                                            nsize) );
            }
        }
    }

    var positions = new Float32Array(this.particles.length * 3);
    var colors = new Float32Array(this.particles.length * 3);
    var sizes = new Float32Array(this.particles.length);

    var ptSize = this.ptsizeInView();

    for (var i = 0, i3 = 0; i < this.particles.length; i++ , i3 += 3)
    {
        var p = this.particles[i];

        positions[i3] = p.x;
        positions[i3 + 1] = p.y;
        positions[i3 + 2] = p.z;

        var c = p.population.color3D;

        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;

        sizes[i] = ptSize * p.size;
    }

    // Use new ThreeJS model

    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.addAttribute('vcolor', new THREE.BufferAttribute(colors, 3));
    this.geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.object = new THREE.Points(this.geometry, shaderMaterial);
    this.object.dynamic = true;
    this.scene.add(this.object);

    this.applySphereType();
};


BRAIN3D.MainView.prototype.initImages = function ()        // Init images
{
    var e = new THREE.TextureLoader;

    this.ballimage = e.load(this.ballImagePath);
    this.auraimage = e.load(this.ballAuraImagePath);
};

BRAIN3D.MainView.prototype.initInteractivity = function ()
{
    var that = this;

    this.container.addEventListener('mousemove', this.mouseMoveHandler = function (e) { that.mouseMove.call(that, e); }, false);
    this.container.addEventListener('mousedown', this.mouseDownHandler = function (e) { that.mouseDown.call(that, e); }, false);
    this.container.addEventListener('mouseup', this.mouseUpHandler = function (e) { that.mouseUp.call(that, e); }, false);
    this.container.addEventListener('mouseout', this.mouseOutHandler = function (e) { that.mouseOut.call(that, e); }, false);

    // IE9, Chrome, Safari, Opera
    this.container.addEventListener("mousewheel", this.mouseWheelHandler = function (e) { that.mouseWheel.call(that, e); }, false);

    // Firefox
    this.container.addEventListener("DOMMouseScroll", this.mouseWheelFXHandler = function (e) { that.mouseWheel.call(that, e); }, false);
};

//------------------------------
// Terminate (should be called when the object is not required anymore to unregister its event listeners)

BRAIN3D.MainView.prototype.terminate = function ()
{
    this.container.removeEventListener('mousemove', this.mouseMoveHandler);
    this.container.removeEventListener('mousedown', this.mouseDownHandler);
    this.container.removeEventListener('mouseup', this.mouseUpHandler);
    this.container.removeEventListener('mouseout', this.mouseOutHandler);

    this.container.removeEventListener('mousewheel', this.mouseWheelHandler);
    this.container.removeEventListener('DOMMouseScroll', this.mouseWheelFXHandler);
};

//------------------------------
// View size

BRAIN3D.MainView.prototype.width = function ()
{
    return this.container.clientWidth;
};

BRAIN3D.MainView.prototype.height = function ()
{
    return this.container.clientHeight;
};

BRAIN3D.MainView.prototype.updateSize = function ()
{
    this.camera.aspect = this.width() / this.height();

    if (this.renderer !== undefined)
    {
        this.renderer.setSize(this.width(), this.height());
    }

    this.currentWidth = this.width();
    this.currentHeight = this.height();

    this.updateParticleSize(false);
};

BRAIN3D.MainView.prototype.ptsizeInView = function ()    // Size of a point adapted to the viewport size
{
    return this.ptsize * (this.height() / 800.0);
};

//------------------------------
// Render

BRAIN3D.MainView.prototype.render = function ()
{
    if (this.renderer !== undefined)
    {
        this.renderer.render(this.scene, this.camera);
    }
};

//------------------------------
// Updates

BRAIN3D.MainView.prototype.setPaused = function (p)
{
    this.paused = p;
}

BRAIN3D.MainView.prototype.startPeriodicalUpdate = function ()
{
    var that = this;
    var updateFrame = function ()
    {
        requestAnimationFrame(function () { that.periodicalUpdate.call(that); updateFrame(); });
    };
    updateFrame();
};

BRAIN3D.MainView.prototype.periodicalUpdate = function ()
{
    // Time elapsed

    var time_old = this.time;
    this.time = Date.now() * 0.001;

    if (this.paused) return;

    // Update size if required

    if (this.currentWidth != this.width() || this.currentHeight != this.height() || this.ptsizeInView() != this.ptsizeInViewOld) this.updateSize();

    // Mouse interaction

    if (this.mouseIsDown)
    {
        this.cameraTheta = this.cameraThetaOld + 0.0075 * (this.mouse.x - this.mouseOld.x);
        this.cameraPhi = this.cameraPhiOld - 0.0075 * (this.mouse.y - this.mouseOld.y);
    }

    if (this.cameraPhi > Math.PI) { this.cameraPhi = Math.PI - 0.0001; }
    if (this.cameraPhi < 0.0) { this.cameraPhi = 0.0 + 0.0001; }

    if (this.mouseIsDown)
    {
        this.mouseSpeed.x = this.mouse.x - this.mouseLast.x;
        this.mouseSpeed.y = this.mouse.y - this.mouseLast.y;
    }
    else
    {
        this.cameraTheta += this.mouseSpeed.x * 0.0025;
        //~ phi   += mouse_speed.y*0.01;
    }

    this.mouseLast.x = this.mouse.x;
    this.mouseLast.y = this.mouse.y;


    // Camera

    // Initial rotation

    if (this.cameraDefaultRotation == true)
    {
        var droty = (this.time - time_old) * 0.3;
        if (time_old == 0.0) droty = 0.0;

        this.cameraTheta -= droty;
    }

    this.camera_position = [this.cameraZoom * Math.cos(this.cameraTheta) * Math.sin(this.cameraPhi), this.cameraZoom * Math.cos(this.cameraPhi), this.cameraZoom * Math.sin(this.cameraTheta) * Math.sin(this.cameraPhi)];
    this.camera.near = this.min_render_dist;
    this.camera.far = this.max_render_dist;
    this.camera.position.set(this.camera_translation[0] + this.camera_position[0], this.camera_translation[1] + this.camera_position[1], this.camera_translation[2] + this.camera_position[2]);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(new THREE.Vector3(this.camera_translation[0], this.camera_translation[1], this.camera_translation[2]));
    this.camera.updateProjectionMatrix();

    // Animation

    this.processAnimation();

    // Render

    this.render();
};

//------------------------------
// Public access methods

BRAIN3D.MainView.prototype.setClipPlanes = function (minClip, maxClip)
{
    this.min_render_dist = minClip;             // Clipping planes
    this.max_render_dist = maxClip;
};

BRAIN3D.MainView.prototype.setPointSize = function (ps)
{
    this.ptsize = ps;   // No need to update buffer, it will be done at next render
};

BRAIN3D.MainView.prototype.setColorMap = function (st)
{
    this.colormap = st;
    this.applyColors();
};

BRAIN3D.MainView.prototype.setSphereType = function (st)
{
    this.spheretype = st;
    this.applySphereType();
};

//------------------------------
// Animation

BRAIN3D.MainView.prototype.accDecCurve = function (pos)
{
    if (pos <= 0.5)
    {
        pos *= 2;
        pos = 1.0 -Math.sin((1.0 - pos) * 0.5 * Math.PI);
        pos *= 0.5;
    }
    else
    {
        pos = (pos - 0.5) * 2;
        pos = Math.sin(pos * 0.5 * Math.PI);
        pos = 0.5 + (pos * 0.5);
    }

    return pos;
}

BRAIN3D.MainView.prototype.processAnimation = function (perParticleUpdate)
{
    var elapsed = 0;
    var t = Date.now();
    if (this.lastAnimTime!==undefined)
    {
        elapsed = t-this.lastAnimTime;
    }
    this.lastAnimTime = t;
    if (elapsed>0.1)
    {
        elapsed = 0.1;
    }

    if (this.needsAnimationPass)
    {
        this.needsAnimationPass = false;

        var ptSize = this.ptsizeInView();
        var needsSizeUpdate = false;

        for (var i = 0; i < this.particles.length; i++)
        {
            var p = this.particles[i];

            if (p.sizeInterpolant<1.0)
            {
                var currentSize;

                p.sizeInterpolant += elapsed;
                if (p.sizeInterpolant>=1.0)
                {
                    p.sizeInterpolant = 1.0;
                    currentSize = p.size = p.tsize;
                }
                else
                {
                    this.needsAnimationPass = true;
                    currentSize = this.accDecCurve(p.size + (p.tsize - p.size) * p.sizeInterpolant);
                }

                needsSizeUpdate = true;

                this.geometry.attributes.size.array[i] = ptSize * currentSize;
            }
        }

        if (needsSizeUpdate)
        {
            this.geometry.attributes.size.needsUpdate = true;
            this.ptsizeInViewOld = ptSize;
        }

    }

};

//------------------------------
// Buffer updates

BRAIN3D.MainView.prototype.updateParticleSize = function (perParticleUpdate)
{
    if (perParticleUpdate)
    {
        this.needsAnimationPass = true;

        var neuronesVisible = {};
        var particlei = 0;

        var xyz = this.userXYZ;  // For now use only XYZ predefined coordinates

        for (var popname in this.populations)
        {
            var popValues = this.populations[popname];
            var start = popValues.from;
            var end = popValues.to;
            var step = popValues.hasOwnProperty('step') ? popValues.step : 1;
            if (step <= 0) step = 1;

            for (var i = start; i < end; i += step)
            {
                var nsize = 1.0;

                if (popValues.visible)
                {
                    if (!neuronesVisible.hasOwnProperty(i))
                    {
                        neuronesVisible[i] = 1;
                    }
                    else
                    {
                        neuronesVisible[i] += 1;
                    }

                    nsize = 1.0 - ((neuronesVisible[i] - 1.0) * BRAIN3D.OVERLAPPING_NEURONES_RESIZE_FACTOR);
                }
                else
                {
                    nsize = 0;
                }

                if (i >= 0 && i < xyz.length / 3)
                {
                    if (this.particles[particlei].tsize!=nsize)
                    {
                        this.particles[particlei].sizeInterpolant = 0.0;
                        this.particles[particlei].tsize = nsize;
                    }
                    particlei++;
                }
            }
        }
    }

    var ptSize = this.ptsizeInView();

    for (var i = 0; i < this.particles.length; i++)
    {
        var p = this.particles[i];

        var currentSize;

        if (p.sizeInterpolant<1.0)
        {
            currentSize = this.accDecCurve(p.size + (p.tsize - p.size) * p.sizeInterpolant);
        }
        else
        {
            currentSize = p.size;
        }

        this.geometry.attributes.size.array[i] = ptSize * currentSize;

    }

    this.geometry.attributes.size.needsUpdate = true;
    this.ptsizeInViewOld = ptSize;
};

BRAIN3D.MainView.prototype.updatePopulationVisibility = function()
{
    this.updateParticleSize(true);
};

BRAIN3D.MainView.prototype.applySphereType = function ()
{
    if (this.spheretype == BRAIN3D.SPHERE_TYPE_SPHERE)
    {
        this.object.material.blending = 0;
        this.object.material.depthTest = true;
        this.object.material.transparent = false;
    }
    else if (this.spheretype == BRAIN3D.SPHERE_TYPE_BLENDED)
    {

        this.object.material.blending = THREE.AdditiveBlending;
        this.object.material.depthTest = false;
        this.object.material.transparent = true;
    }
    else if (this.spheretype == BRAIN3D.SPHERE_TYPE_POINT)
    {

        this.object.material.blending = 0;
        this.object.material.depthTest = true;
        this.object.material.transparent = false;
    }
    else if (this.spheretype == BRAIN3D.SPHERE_TYPE_SIMPLE)
    {
        this.object.material.blending = 0;
        this.object.material.depthTest = true;
        this.object.material.transparent = false;
    }
};

//------------------------------
// Interactivity

BRAIN3D.MainView.prototype.mouseMove = function (e)
{
    this.mouse.x = e.layerX;
    this.mouse.y = e.layerY;
};

BRAIN3D.MainView.prototype.mouseDown = function (e)
{
    this.cameraDefaultRotation = false;
    this.mouseOld.x = this.mouse.x;
    this.mouseOld.y = this.mouse.y;
    this.cameraThetaOld = this.cameraTheta;
    this.cameraPhiOld = this.cameraPhi;
    this.mouseIsDown = true;
};

BRAIN3D.MainView.prototype.mouseUp = function (e)
{
    this.mouseIsDown = false;
};

BRAIN3D.MainView.prototype.mouseOut = function (e)
{
    this.mouseIsDown = false;
};


BRAIN3D.MainView.prototype.mouseWheel = function (e)
{
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    var move = delta * 20.0;
    this.cameraZoom = this.cameraZoom - move;
    if (this.cameraZoom < BRAIN3D.CAMERA_MIN_ZOOM) { this.cameraZoom = BRAIN3D.CAMERA_MIN_ZOOM; }
    else if (this.cameraZoom > BRAIN3D.CAMERA_MAX_ZOOM) { this.cameraZoom = BRAIN3D.CAMERA_MAX_ZOOM; }

};





