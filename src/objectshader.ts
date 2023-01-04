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
  FragPos = vec3(u_model * vec4(aPos.xyx, 1.0));
  TexCoord = aTexCoord;
  TexCoord.y = 1.0 - TexCoord.y;
  mat3 normalMatrix = transpose(inverse(mat3(u_model)));
  Normal = normalize(normalMatrix * aNormal);
  gl_Position = u_projection * u_view * u_model * vec4(aPos, 1.0);
}
`;

const fragSrc = `#version 300 es
precision highp float;
in vec3 FragPos;
in vec2 TexCoord;
in vec3 Normal;
out vec4 FragColor;
uniform sampler2D u_texture_0;
uniform vec3 u_view_pos;
uniform vec4 u_color;

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
  vec4 diffuse = texture(u_texture_0, TexCoord) * u_color;
  vec3 lightPos = vec3(16.0, 23.0, 0.0);
  
  vec3 lightDir = normalize(vec3(0.1,1,0.1));

  float diff = max(dot(lightDir, Normal.xyz), 0.0);

  vec3 viewDir = normalize(u_view_pos - FragPos);
  vec3 halfwayDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(Normal, halfwayDir), 0.0), 8.0);
  float fresnel = pow(1.0 - max(dot(halfwayDir, viewDir), 0.0), 2.0);

  FragColor = vec4(diffuse.rgb * stylize(diff, 2.0) + diffuse.rgb * fresnel, 1.0);
  float depth = LinearizeDepth(gl_FragCoord.z) * 1.5 / far;
  FragColor.rgb = mix(FragColor.rgb, vec3(0.75, 0.65, 0.30), vec3(pow(depth, 2.0)) * (1.0 - smoothstep(0.0, 48.0, FragPos.y)));
}
`;

export class ObjectShader extends ShaderProgram
{
    constructor(projection:any)
    {
        super(vertSrc, fragSrc)
        this.use();
        this.setUniformMat4("u_projection", projection.array);
        this.setUniformInteger("u_texture_0", 0);
    }
};