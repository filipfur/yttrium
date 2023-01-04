import { ShaderProgram } from "./gen/core/shaderprogram"

const vertSrc = `#version 300 es
precision highp float;
layout (location=0) in vec3 aPos;
layout (location=1) in vec3 aNormal;
layout (location=2) in vec2 aTexCoord;
out vec3 FragPos;
out vec2 TexCoord;
out vec3 Normal;
uniform mat4 u_model;
uniform mat4 u_projection;
uniform mat4 u_view;
void main() {
  vec4 pos = u_model * vec4(aPos.xyz, 1.0);
  pos.y += 0.02;
  FragPos = pos.rgb;
  TexCoord = aTexCoord;
  
  mat3 normalMatrix = transpose(inverse(mat3(u_model)));
  Normal = normalize(normalMatrix * aNormal);
  gl_Position = u_projection * u_view * pos;
}
`;

const fragSrc = `#version 300 es
precision highp float;
in vec3 FragPos;
in vec2 TexCoord;
in vec3 Normal;
out vec4 FragColor;

void main() 
{
  float len = pow(length(0.5 - TexCoord.xy), 2.0);
  FragColor = vec4(0.7, 0.0, 0.7, (smoothstep(0.85, 0.86, 1.0 - len) - smoothstep(0.85, 1.0, 1.0 - len)) * 0.5);
}
`;

export class MarkerShader extends ShaderProgram
{
    constructor(projection:any)
    {
        super(vertSrc, fragSrc)
        this.use();
        this.setUniformMat4("u_projection", projection.array);
        this.setUniformInteger("u_texture_0", 0);
    }
};