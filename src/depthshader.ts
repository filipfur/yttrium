import { ShaderProgram } from "./gen/core/shaderprogram"

const vertSrc = `#version 300 es
precision highp float;
layout (location=0) in vec3 aPos;
layout (location=1) in vec3 aNormal;
layout (location=2) in vec2 aTexCoord;
out vec3 FragPos;
out vec2 TexCoord;
uniform mat4 u_model;
uniform mat4 u_projection;
uniform mat4 u_view;
void main() {
  FragPos = vec3(u_model * vec4(aPos.xyx, 1.0));
  TexCoord = aTexCoord;
  TexCoord.y = 1.0 - TexCoord.y;
  gl_Position = u_projection * u_view * u_model * vec4(aPos, 1.0);
}
`;

const fragSrc = `#version 300 es
precision highp float;
in vec3 FragPos;
in vec2 TexCoord;
out vec4 FragColor;

float stylize(float f, float segments)
{
    return max(0.16, floor(f * segments + 0.3) / segments);
}

float near = 0.1; 
float far  = 1000.0; 
  
float LinearizeDepth(float depth) 
{
    float z = depth * 2.0 - 1.0; // back to NDC 
    return (2.0 * near * far) / (far + near - z * (far - near));	
}

void main() 
{
  FragColor = vec4(vec3(LinearizeDepth(gl_FragCoord.z) / far), 1.0);
  FragColor = vec4(vec3(gl_FragCoord.z), 1.0);
}
`;

export class DepthShader extends ShaderProgram
{
    constructor(projection:any)
    {
        super(vertSrc, fragSrc)
        this.use();
        this.setUniformMat4("u_projection", projection.array);
        this.setUniformInteger("u_texture_0", 0);
    }
};