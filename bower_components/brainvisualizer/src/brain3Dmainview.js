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

BRAIN3D.COLOR_MAP_CORTEXLAYERS = 'Cortex Layers';
BRAIN3D.COLOR_MAP_AREAS = 'Areas';
BRAIN3D.COLOR_MAP_NONE = 'None';


//------------------------------
// Initialize

BRAIN3D.MainView = function (container, data, ballImagePath, ballAuraImagePath)
{
    this.data = data;
    this.container = container;
    this.ballImagePath = ballImagePath;
    this.ballAuraImagePath = ballAuraImagePath;
    this.init();
};

BRAIN3D.MainView.prototype.init = function ()
{
    this.paused = false;
    this.area = [];
    this.layer = [];
    this.vertices = [];

    this.ptsize = 6.0;
    this.ptsizeInViewOld = 0;
    this.spheretype = BRAIN3D.SPHERE_TYPE_BLENDED;
    this.colormap = BRAIN3D.COLOR_MAP_AREAS;
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

    this.renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(this.width(), this.height());
    this.renderer.setClearColor(new THREE.Color().setRGB(0.0, 0.0, 0.0), 0);
    this.renderer.sortObjects = false;
    this.container.appendChild(this.renderer.domElement);
};


BRAIN3D.MainView.prototype.init3DBrain = function ()     // Init brain 3D object
{
    // Shader Attributes / Uniforms
    this.uniforms = { amplitude: { type: "f", value: 1.0 }, color: { type: "c", value: new THREE.Color(0xffffff) }, texture: { type: "t", value: this.ballimage }, texture_aura: { type: "t", value: this.auraimage } };
    this.uniforms.texture.value.wrapS = this.uniforms.texture.value.wrapT = THREE.RepeatWrapping;
    this.uniforms.texture_aura.value.wrapS = this.uniforms.texture_aura.value.wrapT = THREE.RepeatWrapping;

    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: BRAIN3D.vertexshader,
        fragmentShader: BRAIN3D.fragmentshader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
    });

    this.layer = [];
    this.area = [];

    // Vertices

    var sc = 0.025;
    var poses = this.data["poses"];

    for (var i_pose = 0; i_pose < poses.length; i_pose++)
    {
        var pose = poses[i_pose];

        for (var i = 0; i < pose.length / 5; i++)
        {
            var vertex = new THREE.Vector3(sc * pose[i * 5 + 0], sc * pose[i * 5 + 1], sc * pose[i * 5 + 2]);

            this.layer.push(pose[i * 5 + 3]);
            this.area.push(pose[i * 5 + 4]);
            this.vertices.push(vertex);
        }
    }

    var sc = 0.025;
    var poses = this.data["poses"];


    var positions = new Float32Array(this.vertices.length * 3);
    var colors = new Float32Array(this.vertices.length * 3);
    var ex = new Float32Array(this.vertices.length);
    var sizes = new Float32Array(this.vertices.length);
    var textured = new Float32Array(this.vertices.length);
    var vall = new Float32Array(this.vertices.length);

    var ptSize = this.ptsizeInView();

    for (var i = 0, i3 = 0; i < this.vertices.length; i++ , i3 += 3)
    {
        positions[i3] = this.vertices[i].x;
        positions[i3 + 1] = this.vertices[i].y;
        positions[i3 + 2] = this.vertices[i].z;

        colors[i3] = 1.0;
        colors[i3 + 1] = 1.0;
        colors[i3 + 2] = 1.0;

        textured[i] = 1.0;
        ex[i] = 1.0;
        sizes[i] = ptSize;
        vall[i] = 1.0;
    }

    // Use new ThreeJS model


    this.geometry = new THREE.BufferGeometry();
    this.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.addAttribute('vcolor', new THREE.BufferAttribute(colors, 3));
    this.geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.addAttribute('textured', new THREE.BufferAttribute(textured, 1));
    this.geometry.addAttribute('vall', new THREE.BufferAttribute(vall, 1));
    this.geometry.addAttribute('ex', new THREE.BufferAttribute(ex, 1));


    this.object = new THREE.Points(this.geometry, shaderMaterial);
    this.object.dynamic = true;
    this.scene.add(this.object);

    this.applySphereType();
    this.applyColors();
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
    this.container.addEventListener('mousemove', function (e) { that.mouseMove.call(that, e); }, false);
    this.container.addEventListener('mousedown', function (e) { that.mouseDown.call(that, e); }, false);
    this.container.addEventListener('mouseup', function (e) { that.mouseUp.call(that, e); }, false);
    this.container.addEventListener('mouseout', function (e) { that.mouseOut.call(that, e); }, false);

    // IE9, Chrome, Safari, Opera
    this.container.addEventListener("mousewheel", function (e) { that.mouseWheel.call(that, e); }, false);

    // Firefox
    this.container.addEventListener("DOMMouseScroll", function (e) { that.mouseWheel.call(that, e); }, false);
}

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

    var ptSize = this.ptsizeInView();

    for (var i = 0; i < this.vertices.length; i++) { this.geometry.attributes.size.array[i] = ptSize; }

    this.geometry.attributes.size.needsUpdate = true;
    this.ptsizeInViewOld = ptSize;
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
// Buffer updates

BRAIN3D.MainView.prototype.applyColors = function ()
{
    if (this.colormap == BRAIN3D.COLOR_MAP_AREAS)
    {
        for (var i = 0, i3 = 0; i < this.vertices.length; i++ , i3 += 3)
        {
            var clr = this.data["allancolors"][this.area[i]];

            this.geometry.attributes.vcolor.array[i3] = clr[0];
            this.geometry.attributes.vcolor.array[i3 + 1] = clr[1];
            this.geometry.attributes.vcolor.array[i3 + 2] = clr[2];
        }
    }
    else if (this.colormap == BRAIN3D.COLOR_MAP_CORTEXLAYERS)
    {
        for (var i = 0, i3 = 0; i < this.vertices.length; i++ , i3 += 3)
        {
            var r, g, b;

            if (this.layer[i] == 1)
            {
                r = 0.8;
                g = 0.0;
                b = 1.0;
            }
            else if (this.layer[i] == 2 || this.layer[i] == 3)
            {
                r = 0.0;
                g = 1.0;
                b = 0.0;
            }
            else if (this.layer[i] == 4)
            {
                r = 0.0;
                g = 0.2;
                b = 1.0;
            }
            else if (this.layer[i] == 5)
            {
                r = 0.0;
                g = 1.0;
                b = 1.0;
            }
            else if (this.layer[i] == 6)
            {
                r = 1.0;
                g = 1.0;
                b = 0.0;
            }
            else
            {
                r = 0.0;
                g = 0.5;
                b = 1.0;
            }

            this.geometry.attributes.vcolor.array[i3] = r;
            this.geometry.attributes.vcolor.array[i3 + 1] = g;
            this.geometry.attributes.vcolor.array[i3 + 2] = b;
        }
    }
    else if (this.colormap == BRAIN3D.COLOR_MAP_NONE)
    {
        for (var i = 0, i3 = 0; i < this.vertices.length; i++ , i3 += 3)
        {
            this.geometry.attributes.vcolor.array[i3] = 1.0;
            this.geometry.attributes.vcolor.array[i3 + 1] = 0.5;
            this.geometry.attributes.vcolor.array[i3 + 2] = 0.9;
        }
    }

    this.geometry.attributes.vcolor.needsUpdate = true;
};

BRAIN3D.MainView.prototype.applySphereType = function ()
{
    var texturedValue = 1.0;

    if (this.spheretype == BRAIN3D.SPHERE_TYPE_SPHERE)
    {
        this.object.material.blending = 0;
        this.object.material.depthTest = true;
        this.object.material.transparent = false;
    }
    else if (this.spheretype == BRAIN3D.SPHERE_TYPE_BLENDED)
    {
        texturedValue = 0.5;

        this.object.material.blending = THREE.AdditiveBlending;
        this.object.material.depthTest = false;
        this.object.material.transparent = true;
    }
    else if (this.spheretype == BRAIN3D.SPHERE_TYPE_POINT)
    {
        texturedValue = 0.5;

        this.object.material.blending = 0;
        this.object.material.depthTest = true;
        this.object.material.transparent = false;
    }
    else if (this.spheretype == BRAIN3D.SPHERE_TYPE_SIMPLE)
    {
        texturedValue = 0.0;

        this.object.material.blending = 0;
        this.object.material.depthTest = true;
        this.object.material.transparent = false;
    }

    for (var i = 0; i < this.vertices.length; i++)
    {
        this.geometry.attributes.textured.array[i] = texturedValue;
    }

    this.geometry.attributes.textured.needsUpdate = true;
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
    if (this.cameraZoom < 10.0) { this.cameraZoom = 10; }
    else if (this.cameraZoom > 750.0) { this.cameraZoom = 750.0; }

};





