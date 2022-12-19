
/*
https://humbletim.github.io/glm-js/
*/

import { Mesh_block } from "./assets/block";
import { Mesh_grass2 } from "./assets/grass2";
import { Mesh_plane } from "./assets/plane";
import { Mesh_rabbit } from "./assets/rabbit";
import { ImageTexture } from "./gen/core/imagetexture";
import { ShaderProgram } from "./gen/core/shaderprogram"
import { VertexArray } from "./gen/core/vertexarray";
import { Object } from "./gen/render/object"

//const glm = require('glm-js');

console.log('glm-js version: ', glm.version);
console.log('glm.vec3 example: ', glm.vec3(1,2,3));

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

const instVert = `#version 300 es
precision highp float;
layout (location=0) in vec3 aPos;
layout (location=1) in vec2 aTexCoord;
layout (location=2) in vec3 aNormal;
layout (location=3) in mat4 aInstance;
out vec3 FragPos;
out vec2 TexCoord;
out vec3 Normal;
uniform mat4 u_model;
uniform mat4 u_projection;
uniform mat4 u_view;
void main() {
  FragPos = vec3(aInstance * vec4(aPos.xyx, 1.0));
  TexCoord = aTexCoord;
  TexCoord.y = 1.0 - TexCoord.y;
  mat3 normalMatrix = transpose(inverse(mat3(aInstance)));
  Normal = normalize(normalMatrix * aNormal);
  gl_Position = u_projection * u_view * aInstance * vec4(aPos, 1.0);
}
`;

const instFrag = `#version 300 es
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

  const cubeShader = new ShaderProgram(cubeVert, cubeFrag);
  cubeShader.use();
  cubeShader.setUniformMat4("u_projection", projection.array);
  cubeShader.setUniformInteger("u_texture_0", 0);

  const instShader = new ShaderProgram(instVert, instFrag);
  instShader.use();
  instShader.setUniformMat4("u_projection", projection.array);
  instShader.setUniformInteger("u_texture_0", 0);

  const rabbitDiffuse = new ImageTexture("assets/rabbit.png");
  const dirtDiffuse = new ImageTexture("assets/dirt.png");
  const grassDiffuse = new ImageTexture("assets/grass2.png");

  const planeMesh = new Mesh_plane();
  const planeObj = new Object(planeMesh, [dirtDiffuse]);
  planeObj.setScale(glm.vec3(100.0));

  const rabbitMesh = new Mesh_rabbit();
  const rabbitObj = new Object(rabbitMesh, [rabbitDiffuse]);
  rabbitObj.setUpdateCallback((obj, time, dt) => {
    obj.setPosition(obj.position.add(glm.vec3(0.0, 0.0, dt)));
  });

  const grass2VAO = new Mesh_grass2();

  const createInstance = (position:any) => {
    let inst = glm.mat4(1.0);
    inst = glm.translate(inst, position);
    inst = glm.scale(inst, glm.vec3(2.0 * (Math.random() * 0.5 + 1.2)));
    return inst;
  }

  let instData:any = [];
  let X = 30;
  let Y = 30;
  for(let y = 0; y < Y; y++)
  {
    for(let x = 0; x < X; x++)
    {
      instData = instData.concat(createInstance(glm.vec3((x - X * 0.5) * 4.0 + Math.random(), 0.0, (y - Y * 0.5) * 4.0 + Math.random())).array);
    }
  }
  
  grass2VAO.setInstanceAttributes([4, 4, 4, 4], instData)

  let lastTime = 0;

  //gl.viewport(0, 0, 720, 180);

  const drawScene = (time:number) => {
    time *= 0.001; 
    let dt = time - lastTime; 

    //console.log(dt);
    let cameraAngle = (time * 0.2) % Math.PI * 2;
    let camX = Math.sin(cameraAngle) * 32.0;
    let camZ = Math.cos(cameraAngle) * 32.0;
    let viewPos = rabbitObj.position.add(glm.vec3(camX, 32.0, camZ));
    let view = glm.lookAt(viewPos, rabbitObj.position, glm.vec3(0.0, 1.0, 0.0));
    let model;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    cubeShader.use();
    cubeShader.setUniformMat4("u_view", view.array);
    cubeShader.setUniformVec3("u_view_pos", viewPos.array);


    planeObj.shade(cubeShader);
    planeObj.draw();
    
    rabbitObj.update(dt);
    rabbitObj.shade(cubeShader);
    rabbitObj.draw();
    
    gl.activeTexture(gl.TEXTURE0);
    grassDiffuse.bind();
    instShader.use();
    instShader.setUniformMat4("u_view", view.array);
    instShader.setUniformVec3("u_view_pos", viewPos.array);
    /*model = glm.mat4(1.0);
    model = glm.translate(model, glm.vec3(0.0, 0.0, 0.0))
    model = glm.scale(model, glm.vec3(4.0));
    instShader.setUniformMat4("u_model", model.array);*/
    grass2VAO.draw();

    requestAnimationFrame(drawScene);
    lastTime = time;
  };
  drawScene(0);
}
