
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

//const glm = require('glm-js');

console.log('glm-js version: ', glm.version);
console.log('glm.vec3 example: ', glm.vec3(1, 2, 3));

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
    let projection = glm.perspective(glm.radians(45.0), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 2000.0);

    const ext = gl.getExtension('EXT_color_buffer_float');

    const objectShader = new ObjectShader(projection);
    const skinningShader = new SkinningShader(projection);
    const instShader = new InstanceShader(projection);
    const screenShader = new ScreenShader();

    const objectRendering = new Rendering(objectShader);
    const skinningRendering = new Rendering(skinningShader);

    const rabbitDiffuse = new ImageTexture("assets/rabbit.png", gl.SRGB8_ALPHA8, gl.RGBA);
    const dirtDiffuse = new ImageTexture("assets/dirt.png", gl.SRGB8_ALPHA8, gl.RGBA);
    const grassDiffuse = new ImageTexture("assets/grass2.png", gl.SRGB8_ALPHA8, gl.RGBA);
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

    let testObj:Object|null = null;
    let testSkin:any = null;
    let gltf:any = null;
    readGLTF('assets/duck.gltf').then((data) => {
        gltf = data;
        //gltf.scenes[0].root.hasSource.position = glm.vec3(4.0, 0.0, 4.0);
        //gltf.scenes[0].root.hasSource.scale = glm.vec3(4.0);
    });

    const planeMesh = new Mesh_plane();
    const planeObj = new Object(planeMesh, [dirtDiffuse]);
    planeObj.setScale(glm.vec3(100.0));

    const blockMesh = new Mesh_block();
    //const swagbotMesh = new Mesh_swagbot();
    //const duckMesh = new Mesh_duck();
    const blockObj = new Object(blockMesh, [duckDiffuse]);
    blockObj.setPosition(glm.vec3(0.0, 0.0, 0.0));
    blockObj.setRotation(glm.vec3(Math.PI * 0.25, 0.0, 0.0))
    blockObj.setScale(glm.vec3(1.0));

    const rabbitMesh = new Mesh_rabbit();
    const rabbitObj = new Object(rabbitMesh, [rabbitDiffuse]);
    rabbitObj.setUpdateCallback((obj: any, time: number, dt: number) => {
        obj.setPosition(glm.vec3(0.0, Math.cos(time * 10.0) + 1.0, 0.0));
    });

    rabbitObj.setScale(glm.vec3(0.5));

    objectRendering.setRenderables([planeObj, rabbitObj]);


    const updateables = [planeObj, rabbitObj];

    const grass2VAO = new Mesh_grass2();

    const createInstance = (position: any) => {
        let inst = glm.mat4(1.0);
        inst = glm.translate(inst, position);
        inst = glm.scale(inst, glm.vec3(1.0 * (Math.random() * 0.5 + 1.2)));
        return inst;
    }

    let instData: any = [];
    let X = 30;
    let Y = 10;
    for (let y = 0; y < Y; y++) {
        for (let x = 0; x < X; x++) {
            instData = instData.concat(createInstance(glm.vec3((x - X * 0.5) * 2.0, 0.0, (y - Y * 0.5) * 2.0)).array);
        }
    }

    grass2VAO.setInstanceAttributes([4, 4, 4, 4], instData)

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
    
    const drawScene = (time: number) => {
        time *= 0.001;
        let dt = time - lastTime;

        /*let cameraAngle = (time * 0.2) % Math.PI * 2;
        let camX = Math.sin(cameraAngle) * 32.0;
        let camZ = Math.cos(cameraAngle) * 32.0;
        let viewPos = rabbitObj.position.add(glm.vec3(camX, 32.0, camZ));
        let view = glm.lookAt(viewPos, rabbitObj.position, glm.vec3(0.0, 1.0, 0.0));*/

        const cameraRadius = 10.0;
        let viewPos = glm.vec3(Math.cos(time * .4) * cameraRadius, 0, Math.sin(time * .4) * cameraRadius);
        let view = glm.lookAt(viewPos, glm.vec3(0.0, 0.0, -2.0), glm.vec3(0.0, 1.0, 0.0));
        //view = glm.inverse(view);

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
            //objectRendering.render();
            duckDiffuse.bind();
            gl.activeTexture(gl.TEXTURE0);
            skinningShader.use();
            skinningShader.setUniformMat4("u_view", view.array);
            skinningShader.setUniformVec3("u_view_pos", viewPos.array);
            if(gltf)
            {
                const renderDrawables = (node:Node) => {
                    if(node.hasSource && node.hasSource.hasRenderable)
                    {
                        gltf.skins.forEach((skin:Skin) => {
                            skin.update(node);
                            for(let i=0; i < skin.jointMatrices.length; ++i)
                            {
                                skinningShader.setUniformMat4(`u_jointMatrix[${i}]`, skin.jointMatrices[i].array);
                            }
                        })
                        
                        //console.log(node.worldMatrix.array);
                        node.hasSource.hasRenderable.model = node.worldMatrix;
                        node.hasSource.hasRenderable.modelInvalidated = false;
                        node.hasSource.hasRenderable.shade(skinningShader);
                        node.hasSource.hasRenderable.draw();
                    }
                    if(node.hasSource)
                    {
                        if(false && node.name == "Head")
                        {
                            console.log(node.name);
                            node.hasSource.position.y += dt * 0.5;
                        }
                    }
                };
                gltf.skins.forEach((skin:Skin) => {
                    skin.joints.forEach((joint:any) => {
                        if(joint.name == "Bone" || joint.name == "Bone.001" || joint.name == "Bone.002" || joint.name == "Bone.002" || joint.name == "Bone.005")
                        {
                            //glm.decompose(joint.worldMatrix, joint.hasSource.position, joint.hasSource.rotation, joint.hasSource.scale)
                            joint.hasSource.rotation["*="](glm.angleAxis((Math.cos(time * 3.0)) * Math.PI * dt * 0.2, glm.vec3(1,0,0)));
                        }
                        else if(joint.name == "Head")
                        {
                            joint.hasSource.rotation["*="](glm.angleAxis((Math.cos(time * 3.0)) * Math.PI * dt * 0.4, glm.vec3(1,0,0)));
                        }
                        else if(joint.name == "LegA.L.001")
                        {
                            joint.hasSource.rotation["*="](glm.angleAxis((Math.cos(time * 16.0)) * Math.PI * dt * 1.4, glm.vec3(1,0,0)));
                        }
                        else if(joint.name == "LegA.R.001")
                        {
                            joint.hasSource.rotation["*="](glm.angleAxis((Math.sin(time * 16.0)) * Math.PI * dt * 1.4, glm.vec3(1,0,0)));
                        }
                        else if(joint.name == "Root")
                        {
                            joint.hasSource.rotation["*="](glm.angleAxis((Math.sin(time * 3.0)) * Math.PI * dt * 0.4, glm.vec3(0,1,0)));
                        }
                    })
                })
                for (const scene of gltf.scenes) {
                    // updatte all world matices in the scene.
                    scene.root.updateWorldMatrix();
                    // walk the scene and render all renderables
                    scene.root.traverse(renderDrawables);
                }
            }
            /*if(testSkin)
            {
                for(let i=0; i < testSkin.jointData.length; ++i)
                {
                    skinningShader.setUniformMat4(`u_jointMatrix[${i}]`, testSkin.jointData[i]);
                }
            }*/
            skinningRendering.render();
            grassDiffuse.bind();
            instShader.use();
            instShader.setUniformMat4("u_view", view.array);
            instShader.setUniformVec3("u_view_pos", viewPos.array);
            //grass2VAO.draw();
        };

        let useMsaa = true;
        if(useMsaa)
        {
            msaaFBO.bind();
            {
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
