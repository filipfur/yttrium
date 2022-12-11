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
import { Asset_block } from "./assets/block";
import { Asset_plane } from "./assets/plane";
import { Asset_rabbit } from "./assets/rabbit";
import { ImageTexture } from "./gen/core/imagetexture";
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
layout (location=1) in vec2 aTexCoord;
layout (location=2) in vec3 aNormal;
out vec3 FragPos;
out vec2 TexCoord;
out vec3 Normal;
uniform mat4 u_model;
uniform mat4 u_projection;
uniform mat4 u_view;
void main() {
  FragPos = vec3(u_model * vec4(aPos.xyx, 1.0));
  TexCoord = aTexCoord;
  TexCoord.y = 1.0 - TexCoord.y;
  mat3 normalMatrix = transpose(inverse(mat3(u_model)));
  Normal = normalize(normalMatrix * aNormal);
  gl_Position = u_projection * u_view * u_model * vec4(aPos, 1.0);
}
`;

const cubeFrag = `#version 300 es
precision highp float;
in vec3 FragPos;
in vec2 TexCoord;
in vec3 Normal;
out vec4 FragColor;
uniform sampler2D u_texture_0;
uniform vec3 u_view_pos;

float stylize(float f, float segments)
{
    return max(0.16, floor(f * segments + 0.3) / segments);
}

void main() 
{
  vec4 diffuse = texture(u_texture_0, TexCoord);
  vec3 lightPos = vec3(16.0, 23.0, 0.0);
  
  vec3 lightDir = normalize(vec3(0.1,1,0.1));

  float diff = max(dot(lightDir, Normal.xyz), 0.0);

  float rim = 1.0 - max(dot(u_view_pos, Normal.xyz), 0.0);
  rim = smoothstep(0.0, 1.0, rim);

  FragColor = vec4(diffuse.rgb * stylize(diff, 2.0) + diffuse.rgb * stylize(rim * 0.5, 2.0), 1.0);
  FragColor.rgb = pow(FragColor.rgb, vec3(1.0 / 2.2));
}
`;


window.onload = () => {
  const vsSource = `#version 300 es
  precision highp float;
  layout (location=0) in vec3 aPos;
  layout (location=1) in vec3 aColor;
  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_model;
  out vec3 FragPos;
  out vec3 Color;
  void main() {
    FragPos = vec3(u_model * vec4(aPos.xyx, 1.0));
    Color = aColor;
    gl_Position = u_projection * u_view * u_model * vec4(aPos, 1.0);
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
  let projection = glm.perspective(glm.radians(45.0), 4.0 / 3.0, 0.1, 100.0);

  const shaderProgram = new ShaderProgram(vsSource, fsSource);
  shaderProgram.use();
  shaderProgram.setUniformMatrix4f("u_projection", projection.array);

  const cubeShader = new ShaderProgram(cubeVert, cubeFrag);
  cubeShader.use();
  cubeShader.setUniformMatrix4f("u_projection", projection.array);
  cubeShader.setUniform1i("u_texture_0", 0);

  const rabbitDiffuse = new ImageTexture("assets/rabbit.png");
  const dirtDiffuse = new ImageTexture("assets/dirt.png");

  const vertexArray = new VertexArray([3, 3], [
    -1.0, -1.0, 0.0, 1.0, 0.0, 0.0,
    -1.0,  1.0, 0.0,  0.0, 1.0, 0.0,
    1.0,  1.0, 0.0, 0.0, 0.0, 1.0,
    1.0, -1.0, 0.0, 1.0, 1.0, 0.0],
    [0, 2, 1,
      0, 3, 2]);

  const planeVAO = new Asset_plane();

  //const cubeVAO = new VertexArray([3], cubePos, cubeIndices);

  const rabbitVAO = new Asset_rabbit();

  let lastTime = 0;

  //gl.viewport(0, 0, 720, 180);

  const drawScene = (time:number) => {
    time *= 0.001;
    let dt = time - lastTime;

    //console.log(dt);
    let cameraAngle = (time * 0.3) % Math.PI * 2;
    let camX = Math.sin(cameraAngle) * 32.0;
    let camZ = Math.cos(cameraAngle) * 32.0;
    let viewPos = glm.vec3(camX, 32.0, camZ);
    let view = glm.lookAt(viewPos, glm.vec3(0.0, 0.0, 0.0), glm.vec3(0.0, 1.0, 0.0));
    let model;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /*shaderProgram.use();
    shaderProgram.setUniformMatrix4f("u_model", model.array);
    shaderProgram.setUniformMatrix4f("u_view", view.array);
    shaderProgram.setUniform1f('u_time', time);
    vertexArray.draw();*/

    cubeShader.use();

    

    cubeShader.setUniformMatrix4f("u_view", view.array);
    cubeShader.setUniform3f("u_view_pos", viewPos.array);
    model = glm.mat4(1.0);
    model = glm.translate(model, glm.vec3(0.0, 0.0, 0.0));
    //model = glm.rotate(model, Math.PI * 0.5, glm.vec3(1.0, 0.0, 0.0));
    model = glm.scale(model, glm.vec3(100.0));
    cubeShader.setUniformMatrix4f("u_model", model.array);
    dirtDiffuse.bind();
    planeVAO.draw();
    model = glm.mat4(1.0);
    model = glm.scale(model, glm.vec3(1.0));
    //model = glm.rotate(model, time % Math.PI * 2, glm.vec3(0.0, 1.0, 0.0));
    cubeShader.setUniformMatrix4f("u_model", model.array);
    rabbitDiffuse.bind();
    rabbitVAO.draw();
    requestAnimationFrame(drawScene);
    lastTime = time;
  };
  drawScene(0);
}
