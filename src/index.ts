/**
 * This file is just a silly example to show everything working in the browser.
 * When you're ready to start on your site, clear the file. Happy hacking!
 **/

/*import confetti from 'canvas-confetti';

confetti.create(document.getElementById('canvas') as HTMLCanvasElement, {
  resize: true,
  useWorker: true,
})({ particleCount: 200, spread: 200 });*/

//import './webglcontext'
import { ShaderProgram } from "./gen/core/shaderprogram"
import { VertexArray } from "./gen/core/vertexarray";

console.log('glm-js version: ', glm.version);
console.log('glm.vec3 example: ', glm.vec3(1,2,3));

const cubePos = [
  // Front face
  -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

  // Back face
  -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

  // Top face
  -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

  // Bottom face
  -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

  // Right face
  1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

  // Left face
  -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
];


const cubeIndices = [
  0,
  1,
  2,
  0,
  2,
  3, // front
  4,
  5,
  6,
  4,
  6,
  7, // back
  8,
  9,
  10,
  8,
  10,
  11, // top
  12,
  13,
  14,
  12,
  14,
  15, // bottom
  16,
  17,
  18,
  16,
  18,
  19, // right
  20,
  21,
  22,
  20,
  22,
  23, // left
];

const cubeVert = `#version 300 es
precision highp float;
layout (location=0) in vec3 aPos;
out vec3 FragPos;
uniform mat4 u_model;
uniform mat4 u_projection;
uniform mat4 u_view;
void main() {
  FragPos = vec3(u_model * vec4(aPos.xyx, 1.0));
  gl_Position = u_projection * u_view * u_model * vec4(aPos, 1.0);
}
`;

const cubeFrag = `#version 300 es
precision highp float;
in vec3 FragPos;
out vec4 FragColor;
void main() 
{
  vec3 lightPos = vec3(16.0, 23.0, 0.0);
  
  float lightning = pow(1.0 - length(lightPos - FragPos) / 16.0, 4.0);

  FragColor = vec4(vec3(1.0, 0.0, 0.0) + vec3(lightning) * 1.5, 1.0);
}
`;


window.onload = () => {
  const vsSource = `#version 300 es
  precision highp float;
  layout (location=0) in vec3 aPos;
  layout (location=1) in vec3 aColor;
  out vec3 FragPos;
  out vec3 Color;
  void main() {
    FragPos = aPos.xyx;
    Color = aColor;
    gl_Position = vec4(aPos, 1.0);
  }
  `;

  const fsSource = `#version 300 es
  precision highp float;
  in vec3 FragPos;
  out vec4 FragColor;
  in vec3 Color;
  uniform float u_time;
  void main() 
  {
    FragColor = vec4(mix(vec3(cos(u_time * 2.0) * 0.2 + 0.7), Color, 0.5), 1.0);
  }
  `;

  const canvas = document.querySelector<HTMLCanvasElement>('#glCanvas');
  if(canvas)
  {
    const glContext = canvas.getContext('webgl2');
    if (glContext === null) {
      alert(
        'Unable to initialize WebGL. Your browser or machine may not support it.'
      );
      return;
    }
    globalThis.gl = glContext;
  }
  const shaderProgram = new ShaderProgram(vsSource, fsSource);
  const cubeShader = new ShaderProgram(cubeVert, cubeFrag);

  const vertexArray = new VertexArray([3, 3], [
    -1.0, -1.0, 0.0, 1.0, 0.0, 0.0,
    -1.0,  1.0, 0.0,  0.0, 1.0, 0.0,
    1.0,  1.0, 0.0, 0.0, 0.0, 1.0,
    1.0, -1.0, 0.0, 1.0, 1.0, 0.0],
    [0, 2, 1,
      0, 3, 2]);

  const cubeVAO = new VertexArray([3], cubePos, cubeIndices);

  let lastTime = 0;

  //gl.viewport(0, 0, 720, 180);

  const drawScene = (time:number) => {
    time *= 0.001;
    let dt = time - lastTime;

    //console.log(dt);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shaderProgram.use();
    shaderProgram.setUniform1f('u_time', time);
    //vertexArray.draw();

    cubeShader.use();

    let model = glm.mat4(1.0);
    model = glm.scale(model, glm.vec3(1.0));
    model = glm.rotate(model, time % 3.14, glm.vec3(0.0, 1.0, 0.0));

    let projection = glm.perspective(glm.radians(45.0), 4.0 / 3.0, 0.1, 100.0);

    let view = glm.lookAt(glm.vec3(4.0, 4.0, 2.0), glm.vec3(0.0, 0.0, 0.0), glm.vec3(0.0, 1.0, 0.0));

    cubeShader.setUniformMatrix4f("u_model", model.array);
    cubeShader.setUniformMatrix4f("u_projection", projection.array);
    cubeShader.setUniformMatrix4f("u_view", view.array);
    cubeVAO.draw();
    requestAnimationFrame(drawScene);
    lastTime = time;
  };
  drawScene(0);
}
