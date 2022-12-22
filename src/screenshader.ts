import { ShaderProgram } from "./gen/core/shaderprogram"

const vertSrc = `#version 300 es
precision highp float;
layout (location=0) in vec2 aPos;
layout (location=1) in vec2 aTexCoord;
out vec2 TexCoord;
void main() {
  TexCoord = aTexCoord;
  //TexCoord.y = 1.0 - TexCoord.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const fragSrc = `#version 300 es
precision highp float;
in vec2 TexCoord;
out vec4 FragColor;
uniform sampler2D u_texture_0;

void main() 
{
  vec4 diffuse = texture(u_texture_0, TexCoord);
  
  //FragColor = vec4(diffuse.rgb * (1.0 - length((TexCoord.xy - 0.5) * 0.5)), 1.0);
  FragColor = vec4(diffuse.rgb, 1.0);
  //FragColor = vec4(TexCoord, 0.0 , 1.0);
}
`;

export class ScreenShader extends ShaderProgram
{
    constructor()
    {
        super(vertSrc, fragSrc)
        this.use();
        this.setUniformInteger("u_texture_0", 0);
    }
};