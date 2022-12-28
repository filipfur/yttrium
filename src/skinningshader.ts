import { ShaderProgram } from "./gen/core/shaderprogram"

const vertSrc = `#version 300 es
precision highp float;
layout (location=0) in vec3 aPos;
layout (location=1) in vec3 aNormal;
layout (location=2) in vec2 aTexCoord;
layout (location=3) in uvec4 aJoints;
layout (location=4) in vec4 aWeights;
out vec3 FragPos;
out vec2 TexCoord;
out vec3 Normal;
out vec4 Joints;
out vec4 Weights;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_jointMatrix[16];

void main() {
  FragPos = vec3(u_model * vec4(aPos.xyx, 1.0));
  TexCoord = aTexCoord;
  //mat3 normalMatrix = transpose(inverse(mat3(u_model)));
  //Normal = normalize(normalMatrix * aNormal);
  Normal = mat3(u_model) * aNormal;
  mat4 skinMatrix = u_jointMatrix[int(aJoints.x)] * aWeights.x
    + u_jointMatrix[int(aJoints.y)] * aWeights.y
    + u_jointMatrix[int(aJoints.z)] * aWeights.z
    + u_jointMatrix[int(aJoints.w)] * aWeights.w;
  //skinMatrix = mat4(1.0);

  Joints = vec4(aJoints);
  Weights = aWeights;

  mat4 world = u_model * skinMatrix;

  gl_Position = u_projection * u_view * world * vec4(aPos, 1.0);
}
`;

const fragSrc = `#version 300 es
precision highp float;
in vec3 FragPos;
in vec2 TexCoord;
in vec3 Normal;
in vec4 Joints;
in vec4 Weights;
out vec4 FragColor;
uniform sampler2D u_texture_0;
uniform vec3 u_view_pos;
uniform mat4 u_jointMatrix[16];

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
  //FragColor = vec4(diffuse.rgb, 1.0);
  //FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  //FragColor = vec4(Normal, 1.0);
  //FragColor = vec4(Weights.rgb, 1.0);
  //FragColor = vec4(Joints.rrr, 1.0);
}
`;

export class SkinningShader extends ShaderProgram
{
    constructor(projection:any)
    {
        super(vertSrc, fragSrc)
        this.use();
        this.setUniformMat4("u_projection", projection.array);
        this.setUniformInteger("u_texture_0", 0);
    }
};