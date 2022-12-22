
/*
https://humbletim.github.io/glm-js/
*/

import { Mesh_block } from "./assets/block";
import { Mesh_grass2 } from "./assets/grass2";
import { Mesh_plane } from "./assets/plane";
import { Mesh_rabbit } from "./assets/rabbit";
import { FrameBuffer } from "./gen/core/framebuffer";
import { ImageTexture } from "./gen/core/imagetexture";
import { ShaderProgram } from "./gen/core/shaderprogram"
import { VertexArray } from "./gen/core/vertexarray";
import { Object } from "./gen/render/object"
import { Rendering } from "./gen/render/rendering";
import { InstanceShader } from "./instanceshader";
import { ObjectShader } from "./objectshader";
import { ScreenShader } from "./screenshader";

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
    let projection = glm.perspective(glm.radians(45.0), 4.0 / 3.0, 0.1, 500.0);

    const ext = gl.getExtension('EXT_color_buffer_float');

    const objectShader = new ObjectShader(projection);

    const instShader = new InstanceShader(projection);

    const screenShader = new ScreenShader();

    const rabbitDiffuse = new ImageTexture("assets/rabbit.png");
    const dirtDiffuse = new ImageTexture("assets/dirt.png");
    const grassDiffuse = new ImageTexture("assets/grass2.png");

    const screenVAO = new VertexArray([2, 2], [
        -1.0, -1.0, 0.0, 0.0,
        -1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, -1.0, 1.0, 0.0], [
            0, 2, 1,
            0, 3, 2
        ])

    const planeMesh = new Mesh_plane();
    const planeObj = new Object(planeMesh, [dirtDiffuse]);
    planeObj.setScale(glm.vec3(100.0));

    const rabbitMesh = new Mesh_rabbit();
    const rabbitObj = new Object(rabbitMesh, [rabbitDiffuse]);
    rabbitObj.setUpdateCallback((obj: any, time: number, dt: number) => {
        obj.setPosition(glm.vec3(0.0, Math.cos(time * 10.0) + 1.0, 0.0));
    });

    const objectRendering = new Rendering(objectShader);
    objectRendering.setRenderables([planeObj, rabbitObj]);

    const updateables = [planeObj, rabbitObj];

    const grass2VAO = new Mesh_grass2();

    const createInstance = (position: any) => {
        let inst = glm.mat4(1.0);
        inst = glm.translate(inst, position);
        inst = glm.scale(inst, glm.vec3(2.0 * (Math.random() * 0.5 + 1.2)));
        return inst;
    }

    let instData: any = [];
    let X = 30;
    let Y = 30;
    for (let y = 0; y < Y; y++) {
        for (let x = 0; x < X; x++) {
            instData = instData.concat(createInstance(glm.vec3((x - X * 0.5) * 4.0 + Math.random(), 0.0, (y - Y * 0.5) * 4.0 + Math.random())).array);
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
        let viewPos = glm.vec3(24.0, 50.0, 24.0);
        let view = glm.lookAt(viewPos, glm.vec3(0.0), glm.vec3(0.0, 1.0, 0.0));

        updateables.forEach(updateable => {
            updateable.update(dt);
        })

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        objectShader.use();
        objectShader.setUniformMat4("u_view", view.array);
        objectShader.setUniformVec3("u_view_pos", viewPos.array);

        const renderScene = () => {
            objectRendering.render();
            grassDiffuse.bind();
            instShader.use();
            instShader.setUniformMat4("u_view", view.array);
            instShader.setUniformVec3("u_view_pos", viewPos.array);
            grass2VAO.draw();
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
