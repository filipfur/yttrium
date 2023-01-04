import { ShaderProgram } from "./gen/core/shaderprogram"

const vertSrc = `#version 300 es
precision highp float;
layout (location=0) in vec3 aPos;
layout (location=1) in vec3 aNormal;
layout (location=2) in vec2 aTexCoord;
layout (location=3) in mat4 aInstance;
out vec3 FragPos;
out vec2 TexCoord;
out vec3 Normal;
uniform mat4 u_model;
uniform mat4 u_projection;
uniform mat4 u_view;
uniform float u_shadow_radius;

void main() {
  vec4 pos = aInstance * vec4(aPos.xyz * u_shadow_radius, 1.0);
  pos.y += 0.01;
  FragPos = pos.rgb;
  TexCoord = aTexCoord;
  mat3 normalMatrix = transpose(inverse(mat3(aInstance)));
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
  FragColor = vec4(0.0, 0.0, 0.0, smoothstep(0.64, 1.0, 1.0 - len) * 0.7);
}
`;

export class InstanceShadowShader extends ShaderProgram
{
    constructor(projection:any)
    {
        super(vertSrc, fragSrc)
        this.use();
        this.setUniformMat4("u_projection", projection.array);
        this.setUniformInteger("u_texture_0", 0);
    }
};