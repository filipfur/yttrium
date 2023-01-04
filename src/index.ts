
/*
https://humbletim.github.io/glm-js/
*/

import { Mesh_block } from "./assets/block";
import { Mesh_duck } from "./assets/duck";
import { Mesh_grass2 } from "./assets/grass2";
import { Mesh_plane } from "./assets/plane";
import { Mesh_rabbit } from "./assets/rabbit";
import { Mesh_swagbot } from "./assets/swagbot";
import { FrameBuffer } from "./gen/core/framebuffer";
import { ImageTexture } from "./gen/core/imagetexture";
import { ShaderProgram } from "./gen/core/shaderprogram"
import { VertexArray } from "./gen/core/vertexarray";
import { Object } from "./gen/render/object"
import { Rendering } from "./gen/render/rendering";
import { InstanceShader } from "./instanceshader";
import { ObjectShader } from "./objectshader";
import { ScreenShader } from "./screenshader";
import { readGLTF } from './gltfskinning'
import { SkinningShader } from "./skinningshader";
import { Skin } from "./gen/render/skin";
import { Node } from "./gen/render/node";
import { Mesh_terrain } from "./assets/terrain";
import { Mesh_terrain0 } from "./assets/terrain0";
import { Mesh_terrain1 } from "./assets/terrain1";
import { Mesh_terrain2 } from "./assets/terrain2";
import { Mesh_terrain3 } from "./assets/terrain3";
import { Mesh_terrain4 } from "./assets/terrain4";
import { Mesh_terrain5 } from "./assets/terrain5";
import { Mesh_terrain6 } from "./assets/terrain6";
import { Mesh_terrain7 } from "./assets/terrain7";
import { Mesh_terrain8 } from "./assets/terrain8";
import { Mesh_edge } from "./assets/edge";
import { Texture } from "./gen/core/texture";
import { DepthShader } from "./depthshader";
import { Mesh_grass } from "./assets/grass";

import { SkinnedObject } from "./gen/render/skinnedobject";
import { InstanceShadowShader } from "./instanceshadowshader";
import { ObjectShadowShader } from "./objectshadowshader";
import { MarkerShader } from "./markershader";
import { Mesh_rock2 } from "./assets/rock2";
import { Mesh_floor } from "./assets/floor";
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

//const glm = require('glm-js');

console.log('glm-js version: ', glm.version);
console.log('glm.vec3 example: ', glm.vec3(1, 2, 3));

const RotationBetweenVectors = (start:any, dest:any) => {
	start = glm.normalize(start);
	dest = glm.normalize(dest);

	const cosTheta = glm.dot(start, dest);
	let rotationAxis;

	if (cosTheta < -1 + 0.001){
		// special case when vectors in opposite directions:
		// there is no "ideal" rotation axis
		// So guess one; any will do as long as it's perpendicular to start
		rotationAxis = glm.cross(glm.vec3(0.0, 0.0, 1.0), start);
		if (glm.length2(rotationAxis) < 0.01 ) // bad luck, they were parallel, try again!
			rotationAxis = glm.cross(glm.vec3(1.0, 0.0, 0.0), start);

		rotationAxis = glm.normalize(rotationAxis);
		return glm.angleAxis(Math.PI, rotationAxis);
	}

	rotationAxis = glm.cross(start, dest);

	const s = Math.sqrt( (1+cosTheta)*2 );
	const invs = 1 / s;

	return glm.quat(
		s * 0.5, 
		rotationAxis.x * invs,
		rotationAxis.y * invs,
		rotationAxis.z * invs
	);

}

const ZRotation = (v0:any, v1:any) => {
    let v = v1["-"](v0);
    return glm.angleAxis(Math.atan2(v.x, v.z), glm.vec3(0,1,0));
}

window.onload = () => {

    const canvas = document.querySelector<HTMLCanvasElement>('#glCanvas');
    if (canvas) {
        const glContext = canvas.getContext('webgl2', {premultipliedAlpha: false, antialias: false});
        //{premultipliedAlpha: false});
        if (glContext === null) {
            alert(
                'Unable to initialize WebGL. Your browser or machine may not support it.'
            );
            return;
        }
        globalThis.gl = glContext;
    }
    let projection = glm.perspective(glm.radians(45.0), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);

    const ext = gl.getExtension('EXT_color_buffer_float');

    const objectShader = new ObjectShader(projection);
    const objectShadowShader = new ObjectShadowShader(projection);
    const skinningShader = new SkinningShader(projection);
    const instShader = new InstanceShader(projection);
    const instShadowShader = new InstanceShadowShader(projection);
    const depthShader = new DepthShader(projection);
    const markerShader = new MarkerShader(projection);
    const screenShader = new ScreenShader();

    const objectRendering = new Rendering(objectShader);
    const skinningRendering = new Rendering(skinningShader);
    const objectShadowRendering = new Rendering(objectShadowShader);

    const rabbitDiffuse = new ImageTexture("assets/rabbit.png", gl.SRGB8_ALPHA8, gl.RGBA);
    const dirtDiffuse = new ImageTexture("assets/dirt.png", gl.SRGB8_ALPHA8, gl.RGBA);
    const soilDiffuse = new ImageTexture("assets/soil.png", gl.SRGB8_ALPHA8, gl.RGBA);
    const edgeDiffuse = new ImageTexture("assets/terrain/Edge.png", gl.SRGB8_ALPHA8, gl.RGBA);
    const heroDiffuse = new ImageTexture("assets/Hero.png", gl.SRGB8_ALPHA8, gl.RGBA)
    const marbleDiffuse = new ImageTexture("assets/Marble_Blue_004_basecolor.jpg", gl.SRGB8_ALPHA8, gl.RGBA);
    const terrainDiffuses = [
        new ImageTexture("assets/terrain/Terrain0.png", gl.SRGB8_ALPHA8, gl.RGBA),
        new ImageTexture("assets/terrain/Terrain1.png", gl.SRGB8_ALPHA8, gl.RGBA),
        new ImageTexture("assets/terrain/Terrain2.png", gl.SRGB8_ALPHA8, gl.RGBA),
        new ImageTexture("assets/terrain/Terrain3.png", gl.SRGB8_ALPHA8, gl.RGBA),
        new ImageTexture("assets/terrain/Terrain4.png", gl.SRGB8_ALPHA8, gl.RGBA),
        new ImageTexture("assets/terrain/Terrain5.png", gl.SRGB8_ALPHA8, gl.RGBA),
        new ImageTexture("assets/terrain/Terrain6.png", gl.SRGB8_ALPHA8, gl.RGBA),
        new ImageTexture("assets/terrain/Terrain7.png", gl.SRGB8_ALPHA8, gl.RGBA),
        new ImageTexture("assets/terrain/Terrain8.png", gl.SRGB8_ALPHA8, gl.RGBA)
    ]
    const grassDiffuse = new ImageTexture("assets/grass2.png", gl.SRGB8_ALPHA8, gl.RGBA);
    const rockDiffuse = new ImageTexture("assets/rock.png", gl.SRGB8_ALPHA8, gl.RGBA);
    const srockDiffuse = new ImageTexture("assets/srock.png", gl.SRGB8_ALPHA8, gl.RGBA);
    const duckDiffuse = new ImageTexture("assets/Untitled.png", gl.SRGB8_ALPHA8, gl.RGBA);

    let indices = [
        0, 1,
        0, 2,
        1, 3,
        2, 3, //
        2, 4,
        3, 5,
        4, 5,
        4, 6,
        5, 7, //
        6, 7,
        6, 8,
        7, 9,
        8, 9,
    ]
    let vertices = [
        0,  1,  // 0
        0, -1,  // 1
        2,  1,  // 2
        2, -1,  // 3
        4,  1,  // 4
        4, -1,  // 5
        6,  1,  // 6
        6, -1,  // 7
        8,  1,  // 8
        8, -1,  // 9
    ]
    /*let z = 0.0;
    let x = 0.0;
    for(let y=0; y < 10; ++y)
    {
        let p = glm.vec3(x, y * 2.0, z);
        vertices.push(
            //p.x-0.5, p.y-1.0, p.z+0.0,   0.0, 0.0,  0.0, 1.0, 0.0,	
            //p.x-0.5, p.y+1.0, p.z+0.0,   0.0, 1.0,  0.0, 1.0, 0.0,	
            p.x+0.5, p.y+0.0, p.z+0.0,   0.0, 0.0,  0.0, 1.0, 0.0,	
            p.x+0.5, p.y+1.0, p.z+0.0,   0.0, 0.0,  0.0, 1.0, 0.0,
            p.x-0.5, p.y+0.0, p.z+0.0,   0.0, 0.0,  0.0, 1.0, 0.0,
        );
    }*/

    const prng = alea('seed');
    const noise2D = createNoise2D(prng);

    const treeVAO = new VertexArray();
    treeVAO.createVertexBuffer([3,2,3], new Float32Array(vertices), vertices.length, gl.FLOAT, 0, 0);
    treeVAO.createElementBuffer(new Uint16Array(indices), indices.length);
    //treeVAO.setDrawMode(gl.TRIANGLE_STRIP);
    treeVAO.setDrawMode(gl.LINES);
    const treeObj = new Object(treeVAO, [rabbitDiffuse]);

    const screenVAO = new VertexArray()
    vertices = [
        -1.0, -1.0, 0.0, 0.0,
        -1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, -1.0, 1.0, 0.0];
    screenVAO.createVertexBuffer([2, 2], new Float32Array(vertices), vertices.length, gl.FLOAT, 0, 0);
    indices = [0, 2, 1,
        0, 3, 2]
    screenVAO.createElementBuffer(new Uint16Array(indices), indices.length);

    let updateables = new Array();

    let testObj:Object|null = null;
    let testSkin:any = null;
    let heroObj:SkinnedObject|null = null;
    let heroShadowObj:Object|null = null;
    readGLTF('assets/hero-rigged.gltf').then((skinnedObject) => {
        heroObj = skinnedObject;
        if(heroObj)
        {
            heroObj.setPosition(glm.vec3(0.0, 0.0, 0.0));
            //heroObj.setColor(glm.vec4(0.8, 0.8, 0.4, 1.0))
            skinningRendering.addRenderable(heroObj);
            heroShadowObj = new Object(new Mesh_plane(), null);
            heroShadowObj.setUpdateCallback((obj:any, time:number, dt:number) => {
                if(heroObj)
                {
                    obj.setPosition(heroObj.position);
                }
            })
            //heroShadowObj.setPosition(glm.vec3(0.0, 0.0, 0.0));
            objectShadowRendering.addRenderable(heroShadowObj);
            updateables.push(heroObj, heroShadowObj);
        }
    });

    const planeMesh = new Mesh_plane();
    const rockShadowMesh = new Mesh_plane();

    const markerObj = new Object(new Mesh_plane(), null);

    const blockMesh = new Mesh_block();
    //const swagbotMesh = new Mesh_swagbot();
    //const duckMesh = new Mesh_duck();
    const blockObj = new Object(blockMesh, [duckDiffuse]);
    blockObj.setPosition(glm.vec3(0.0, 0.0, 0.0));
    blockObj.setRotation(glm.vec3(Math.PI * 0.25, 0.0, 0.0))
    blockObj.setScale(glm.vec3(1.0));

    const whiteTexture = new Texture();
    whiteTexture.bind();
    whiteTexture.textureImage2D(1, 1, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, [255, 255, 255, 255]);

    const terrainMeshes = [ new Mesh_terrain0(),
        new Mesh_terrain1(),
        new Mesh_terrain2(),
        new Mesh_terrain3(),
        new Mesh_terrain4(),
        new Mesh_terrain5(),
        new Mesh_terrain6(),
        new Mesh_terrain7(),
        new Mesh_terrain8()
    ]

    const terrainObjects = new Array(9);
    for(let i=0; i < 9; ++i)
    {
        terrainObjects[i] = new Object(terrainMeshes[i], [terrainDiffuses[i]]);
        terrainObjects[i].setColor(glm.vec4(0.9, 0.8, 0.4, 1.0));
    }

    const edgeObj = new Object(new Mesh_edge, [marbleDiffuse]);

    const rabbitMesh = new Mesh_rabbit();
    const rabbitObj = new Object(rabbitMesh, [rabbitDiffuse]);
    rabbitObj.setUpdateCallback((obj: any, time: number, dt: number) => {
        obj.setPosition(glm.vec3(4.0, Math.cos(time * 10.0) * 0.2 + 0.2, 4.0));
    });

    rabbitObj.setYRotation(glm.radians(45.0));
    rabbitObj.setYRotation(glm.radians(45.0));

    rabbitObj.setScale(glm.vec3(0.2));

    const floorObj = new Object(new Mesh_floor(), [soilDiffuse]);
    floorObj.setPosition(glm.vec3(0.0, 0.005, 0.0));
    floorObj.setScale(glm.vec3(16.0));

    objectRendering.setRenderables([edgeObj, ...terrainObjects, rabbitObj, floorObj]);


    updateables.push(rabbitObj);

    const grassVAO = new Mesh_grass();
    const grass2VAO = new Mesh_grass2();
    const rock2VAO = new Mesh_rock2();

    const createInstances = (vao:VertexArray, X:number, Y:number, createInstance:any) => {
        const instData = new Array();
        for (let y = 0; y < Y; y++) {
            for (let x = 0; x < X; x++) {
                let inst = createInstance(glm.vec3((x - X * 0.5), 0.0, (y - Y * 0.5)));
                if(inst)
                {
                    instData.push(...inst.array);
                }
            }
        }
        vao.setInstanceAttributes([4, 4, 4, 4], instData);
        return instData;
    };

    createInstances(grassVAO, 100, 100, (position: any) => {
        let inst = glm.mat4(1.0);
        const pnoise = noise2D(position.x * 0.01, position.z * 0.01);
        if(pnoise < 0)
        {
            return null;
        }
        inst = glm.translate(inst, position["+"](glm.vec3((pnoise * 1000.0 % 7) / 7.0, 0.0, (pnoise * 1000.0 % 3) / 3.0)));
        inst = glm.rotate(inst, ((pnoise * 10000.0) % Math.PI) * 2.0, glm.vec3(0,1,0));
        inst = glm.scale(inst, glm.vec3(1.0 + pnoise * 5.0));
        return inst;
    });

    let instances = createInstances(grass2VAO, 32, 32, (position:any) => {
        let inst = glm.mat4(1.0);
        const pnoise = noise2D(position.x, position.z);
        if(false && Math.abs(pnoise) < 0.2)
        {
            return null;
        }
        inst = glm.translate(inst, position);
        inst = glm.rotate(inst, ((pnoise * 10000.0) % Math.PI) * 2.0, glm.vec3(0,1,0));
        inst = glm.scale(inst, glm.vec3(0.6));
        return inst;
    });

    planeMesh.setInstanceAttributes([4, 4, 4, 4], instances);

    instances = createInstances(rock2VAO, 16, 16, (position:any) => {
        let inst = glm.mat4(1.0);
        const pnoise = noise2D(position.x * 0.5, position.z * 0.5);
        const anoise = Math.abs(pnoise);
        const pos = position["+"](glm.vec3((pnoise * 1000.0 % 7) / 14.0, 0.0, (pnoise * 1000.0 % 3) / 6.0))["*"](16.0);
        if(anoise < 0.2 || anoise > 0.5 || (pos.x > -16 && pos.x < 16 && pos.y > -16 && pos.y < 16))
        {
            return null;
        }
        inst = glm.translate(inst, pos);
        inst = glm.rotate(inst, ((pnoise * 10000.0) % Math.PI) * 2.0, glm.vec3(0,1,0));
        inst = glm.scale(inst, glm.vec3(0.05 + (Math.abs(pnoise) * 1000.0 % 11) / 11.0));
        return inst;
    });

    rockShadowMesh.setInstanceAttributes([4,4,4,4], instances);


    let lastTime = 0;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    const msaaFBO = new FrameBuffer(gl.drawingBufferWidth, gl.drawingBufferHeight);
    /*msaaFBO.bind();
    msaaFBO.createTexture(gl.COLOR_ATTACHMENT0, gl.RGBA16F, gl.RGBA, gl.FLOAT);
    //msaaFBO.declareDrawBuffers();
    msaaFBO.createRenderBuffer(gl.DEPTH_STENCIL_ATTACHMENT, gl.DEPTH24_STENCIL8);
    msaaFBO.unbind();*/
    let maxSamples = gl.getParameter(gl.MAX_SAMPLES);
    console.log("maxSamples=" + maxSamples);
    msaaFBO.bind();
    {
        msaaFBO.createRenderBufferMultisample(gl.COLOR_ATTACHMENT0, gl.RGBA16F, maxSamples);
        msaaFBO.createRenderBufferMultisample(gl.DEPTH_STENCIL_ATTACHMENT, gl.DEPTH24_STENCIL8, maxSamples);
    }
    msaaFBO.unbind();

    let depthFBO = new FrameBuffer(gl.drawingBufferWidth, gl.drawingBufferHeight);
    depthFBO.bind();
    {
        depthFBO.createTexture(gl.COLOR_ATTACHMENT0, gl.RGBA16F, gl.RGBA, gl.FLOAT);
    }
    depthFBO.unbind();

    let screenFBO = new FrameBuffer(gl.drawingBufferWidth, gl.drawingBufferHeight);
    screenFBO.bind();
    {
        screenFBO.createTexture(gl.COLOR_ATTACHMENT0, gl.RGBA16F, gl.RGBA, gl.FLOAT);
    }
    screenFBO.unbind();

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    //gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let w = false;
    let a = false;
    let s = false;
    let d = false;

    canvas?.addEventListener('keydown', (e) => {
        if(e.key == "w")
        {
            w = true;
        }
        else if(e.key == "a")
        {
            a = true;
        }
        else if(e.key == "s")
        {
            s = true;
        }
        else if(e.key == "d")
        {
            d = true;
        }
    });

    canvas?.addEventListener('keyup', (e) => {
        if(e.key == "w")
        {
            w = false;
        }
        else if(e.key == "a")
        {
            a = false;
        }
        else if(e.key == "s")
        {
            s = false;
        }
        else if(e.key == "d")
        {
            d = false;
        }
    });

    let clicked = false;

    canvas?.addEventListener('mousedown', (e) => {
        if(e.button == 0)
        {
            clicked = true;
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }
    })
    canvas?.addEventListener('mouseup', (e) => {
        if(e.button == 0)
        {
            clicked = false;
        }
    })

    let walking = false;
    let mouseX = 0.0;
    let mouseY = 0.0;
    let targetPosition = glm.vec3(0.0);

    canvas?.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    
    const drawScene = (time: number) => {
        time *= 0.001;
        let dt = time - lastTime;

        let viewPos = glm.vec3(30.0, 100.0, 30.0);
        let view = glm.lookAt(viewPos, glm.vec3(100.0, 1.8, -100.0), glm.vec3(0.0, 1.0, 0.0));
        if(heroObj)
        {

            const pos = heroObj.position;
            const rot = heroObj.rotation;
            const rotAngle = Math.acos(rot.w) * 2.0;
            const walkSpeed = 8.0;
            if(w || s)
            {
                heroObj.position.x += dt * Math.sin(rotAngle) * (s ? -walkSpeed : walkSpeed);
                heroObj.position.z += dt * Math.cos(rotAngle) * (s ? -walkSpeed : walkSpeed);
            }

            if(a || d)
            {
                heroObj.position.x += dt * Math.sin(rotAngle + Math.PI * 0.5) * (d ? -walkSpeed : walkSpeed);
                heroObj.position.z += dt * Math.cos(rotAngle + Math.PI * 0.5) * (d ? -walkSpeed : walkSpeed);
            }

            let delta = targetPosition["-"](heroObj.position);
            if(glm.length(delta) > 0.1)
            {
                delta = glm.normalize(delta);
                heroObj.setPosition(heroObj.position["+"](delta["*"](6.0 * dt)));
                heroObj.setRotation(ZRotation(heroObj.position, targetPosition));
                heroObj.setAnimation("Running");
                markerObj.setVisible(true);
            }
            else
            {
                heroObj.setPosition(targetPosition);
                heroObj.setAnimation("Idle");
                markerObj.setVisible(false);
            }
            if(glm.distance(heroObj.position, targetPosition) > 0.1)
            {
                walking = true;
            }
            else
            {
                walking = false;
            }

            viewPos = glm.vec3(pos.x + 12.0, pos.y + 16.0, pos.z + 12.0);
            view = glm.lookAt(viewPos, glm.vec3(pos.x, 4.0, pos.z), glm.vec3(0.0, 1.0, 0.0));
        }

        updateables.forEach(updateable => {
            updateable.update(dt);
        })

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const renderScene = () => {
            objectShader.use();
            objectShader.setUniformMat4("u_view", view.array);
            objectShader.setUniformVec3("u_view_pos", viewPos.array);
            objectRendering.render();

            gl.depthMask(false);
            objectShadowShader.use();
            objectShadowShader.setUniformMat4("u_view", view.array);
            objectShadowShader.setUniformVec3("u_view_pos", viewPos.array);
            objectShadowRendering.render();
            gl.depthMask(true);
            heroDiffuse.bind();
            gl.activeTexture(gl.TEXTURE0);
            skinningShader.use();
            skinningShader.setUniformMat4("u_view", view.array);
            skinningShader.setUniformVec3("u_view_pos", viewPos.array);
            skinningRendering.render();
            grassDiffuse.bind();
            gl.depthMask(false);
            instShadowShader.use();
            instShadowShader.setUniformMat4("u_view", view.array);
            instShadowShader.setUniformVec3("u_view_pos", viewPos.array);
            instShadowShader.setUniformFloat("u_shadow_radius", 0.7);
            planeMesh.draw();
            instShadowShader.setUniformFloat("u_shadow_radius", 4.0);
            rockShadowMesh.draw();
            gl.depthMask(true);
            instShader.use();
            instShader.setUniformMat4("u_view", view.array);
            instShader.setUniformVec3("u_view_pos", viewPos.array);
            instShader.setUniformVec4("u_color", [1.0, 1.0, 1.0, 1.0]);
            //grassVAO.draw();
            grass2VAO.draw();
            srockDiffuse.bind();
            rock2VAO.draw();

            markerShader.use();
            markerShader.setUniformMat4("u_view", view.array);
            markerObj.shade(markerShader);
            markerObj.draw();
        };

        let useMsaa = true;
        depthFBO.bind();
        {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            depthShader.use();
            depthShader.setUniformMat4("u_view", view.array);
            depthShader.setUniformVec3("u_view_pos", viewPos.array);
            terrainObjects.forEach((terrainObj:Object) => {
                terrainObj.shade(depthShader);
                terrainObj.draw();
            });
            if(canvas && clicked)
            {
                const matProjection = projection["*"](view);
                const matInverse = glm.inverse(matProjection);

                const pixelX = mouseX * canvas.width / canvas.clientWidth;
                const pixelY = canvas.height - mouseY * canvas.height / canvas.clientHeight - 1;
                const data = new Float32Array(4);
                gl.readPixels(
                    pixelX,            // x
                    pixelY,            // y
                    1,                 // width
                    1,                 // height
                    gl.RGBA,           // format
                    gl.FLOAT,  // type
                    data);             // typed array to hold result
                //const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
                /*let vIn = glm.vec4(2.0 * mouseX / gl.drawingBufferWidth - 1.0,
                    1.0 - (2.0 * mouseY / gl.drawingBufferHeight),
                    2.0 * data[0] - 1.0,
                    1.0
                )*/
                //let pos = vIn["*"](matInverse);
                /*pos.w = 1.0 / pos.w;
                pos.x *= pos.w;
                pos.y *= pos.w;
                pos.z *= pos.w;*/
                //console.log(data[0]);

                const depth = data[0];

                const n = 0.1;
                const f = 1000.0;

                const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
                const tanFov = Math.tan( glm.radians(45.0) / 2 );

                const z_ndc = 2.0 * depth - 1.0;
                const z_eye = 2.0 * n * f / (f + n - z_ndc * (f - n));
                
                const x_ndc = 2.0 * mouseX / gl.drawingBufferWidth - 1.0;
                const y_ndc = 1.0 - (2.0 * mouseY / gl.drawingBufferHeight);

                const inversePrjMat = glm.inverse(projection["*"](view["*"](glm.mat4(1.0))));
                const inverseView = glm.inverse(view);

                /*let pos = glm.vec4(z_eye * x_ndc * aspect * tanFov,
                    z_eye * y_ndc * tanFov,
                    -z_eye, 1.0);

                pos = inverseView["*"](pos);*/

                const pos = inversePrjMat["*"](glm.vec4(x_ndc, y_ndc, z_ndc, 1.0));
                pos.x /= pos.w;
                pos.y /= pos.w;
                pos.z /= pos.w;


                targetPosition = glm.vec3(pos.x, 0.0, pos.z);

                markerObj.setPosition(targetPosition);

                //wsconsole.log(`x_ndc=${x_ndc}, y_ndc=${y_ndc}, z_ndc=${z_ndc}`);
                //console.log(`pos.x=${pos.x}, pos.y=${pos.y}, pos.z=${pos.z}`);
            }
        }
        depthFBO.unbind();
        if(useMsaa)
        {
            msaaFBO.bind();
            {
                gl.clearColor(0.64, 0.04, 0.04, 1.0);
                //gl.clearDepth(1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.activeTexture(gl.TEXTURE0);
                renderScene();
            }
            msaaFBO.unbind();
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msaaFBO.internal);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, screenFBO.internal);
            gl.clearBufferfv(gl.COLOR, 0, [1.0, 1.0, 1.0, 1.0]);
            gl.blitFramebuffer(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
                                0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
                                gl.COLOR_BUFFER_BIT, gl.LINEAR);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
            gl.activeTexture(gl.TEXTURE0);
            screenFBO.bindTexture(gl.COLOR_ATTACHMENT0);
            screenShader.use();
            screenVAO.draw();
        }
        else
        {
            renderScene();
        }

        

        requestAnimationFrame(drawScene);
        lastTime = time;
    };
    drawScene(0);
}
