import { VertexArray } from "./gen/core/vertexarray";
import { Skin } from "./gen/render/skin";
import { Node } from "./gen/render/node";
import { Object } from "./gen/render/object";
import { TRS } from "./gen/render/trs";
import { SkinnedObject } from "./gen/render/skinnedobject";
import { Animation } from "./gen/render/animation";

/*const fs = require('fs');

function toArrayBuffer(buf: Buffer) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

function parseGLTF(filepath: string) {
    let rawdata = fs.readFileSync(filepath);
    let gltf = JSON.parse(rawdata);

    gltf.buffers = gltf.buffers.map((buffer: any) => {
        let data = Buffer.from(buffer.uri.substring(buffer.uri.indexOf(',') + 1), 'base64');
        return toArrayBuffer(data)
    })
    return gltf;
}*/

   
  async function loadFile(url:any, typeFunc:any) {
    const response:any = await fetch(url);
    if (!response.ok) {
      throw new Error(`could not load: ${url}`);
    }
    return await response[typeFunc]();
  }
   
  async function loadBinary(url:any) {
    return loadFile(url, 'arrayBuffer');
  }
   
  async function loadJSON(url:any) {
    return loadFile(url, 'json');
  }

function createBuffer(vertexArray:VertexArray, gltf: any, accessorIndex: any) {
    const accessor = gltf.accessors[accessorIndex];
    const bufferView = gltf.bufferViews[accessor.bufferView];
    const arrayBuffer = gltf.buffers[bufferView.buffer];
    const data = new Uint8Array(arrayBuffer, bufferView.byteOffset, bufferView.byteLength);
    let type = accessorTypeToNumComponents(accessor.type);
    console.log(`type=${type}`)
    if(bufferView.target === gl.ARRAY_BUFFER)
    {
        console.log("accessor.componentType: " + accessor.componentType);
        console.log(vertexArray.createVertexBuffer([type], data, accessor.count, accessor.componentType, accessorIndex, 0).count)
    }
    else if(bufferView.target === gl.ELEMENT_ARRAY_BUFFER)
    {
        vertexArray.createElementBuffer(data, accessor.count)
    }
}

function throwNoKey(key: any) {
    throw new Error(`no key: ${key}`);
}

const accessorTypeToNumComponentsMap:any = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16,
};

function accessorTypeToNumComponents(type:any) {
    return accessorTypeToNumComponentsMap[type] || throwNoKey(type);
}

const glTypeToTypedArrayMap:any = {
    '5120': Int8Array,    // gl.BYTE
    '5121': Uint8Array,   // gl.UNSIGNED_BYTE
    '5122': Int16Array,   // gl.SHORT
    '5123': Uint16Array,  // gl.UNSIGNED_SHORT
    '5124': Int32Array,   // gl.INT
    '5125': Uint32Array,  // gl.UNSIGNED_INT
    '5126': Float32Array, // gl.FLOAT
  }
   
  // Given a GL type return the TypedArray needed
  function glTypeToTypedArray(type:any) {
    return glTypeToTypedArrayMap[type] || throwNoKey(type);
  }

  function getDataByAccessor(gltf:any, accessorIndex:number) {
    const accessor = gltf.accessors[accessorIndex];
    const bufferView = gltf.bufferViews[accessor.bufferView];
    const TypedArray = glTypeToTypedArray(accessor.componentType);
    const buffer = gltf.buffers[bufferView.buffer];
    return new TypedArray(
          buffer,
          bufferView.byteOffset + (accessor.byteOffset || 0),
          accessor.count * accessorTypeToNumComponents(accessor.type));
  }

export async function readGLTF(url:string) {

    const gltf = await loadJSON(url);

    let skinnedObject:SkinnedObject|null = null;
   
    // load all the referenced files relative to the gltf file
    const baseURL = new URL(url, location.href);
    gltf.buffers = await Promise.all(gltf.buffers.map((buffer:any) => {
      const url = new URL(buffer.uri, baseURL.href);
      return loadBinary(url.href);
    }));


    gltf.meshes.forEach((mesh: any) => {
        mesh.primitives.forEach((primitive: any) => {
            /*for (const [attribName, index] of Object.entries(primitive.attributes)) {
                createBuffer(vertexArray, gltf, index);
            }*/
            let vertexArray = new VertexArray();
            for(let attribName in primitive.attributes)
            {
                createBuffer(vertexArray, gltf, primitive.attributes[attribName]);
            }

            if (primitive.indices !== undefined) {
                createBuffer(vertexArray, gltf, primitive.indices);
            }
            primitive.vertexArray = vertexArray;
        });
    });

    const origNodes = gltf.nodes;
    gltf.nodes = gltf.nodes.map((n:any) => {
        const {name, skin, mesh, translation, rotation, scale} = n;
        const trs = new TRS(translation ? glm.vec3(...translation) : glm.vec3(0.0),
            rotation ? glm.quat(rotation[3], rotation[0], rotation[1], rotation[2]) : glm.quat(1.0, 0.0, 0.0, 0.0),
            scale ? glm.vec3(...scale) : glm.vec3(1.0, 1.0, 1.0));
        //obj.setRotation(glm.vec3(...rotation));
        //obj.setScale(glm.vec3(...scale));
        const node = new Node(name, trs);
        const realMesh = gltf.meshes[mesh];
        if (realMesh) {
            //node.drawables.push(new MeshRenderer(realMesh));
            console.log("Real mesh: " + name);
            skinnedObject = new SkinnedObject(realMesh.primitives[0].vertexArray, null);
            skinnedObject.hasStructure = node;
        }
        return node;
    });

    const addChildren = (nodes:Array<Node>, node:Node, childIndices:Array<number>) => {
        childIndices.forEach((childNdx) => {
            const child = nodes[childNdx];
            child.setParent(node);
        });
    }

    gltf.nodes.forEach((node:Node, ndx:number) => {
        const children = origNodes[ndx].children;
        if (children) {
            addChildren(gltf.nodes, node, children);
        }
    });

    for (const scene of gltf.scenes) {
        scene.root = new Node(scene.name, new TRS(glm.vec3(0.0), glm.quat(1.0, 0.0, 0.0, 0.0), glm.vec3(1.0, 1.0, 1.0)));
        addChildren(gltf.nodes, scene.root, scene.nodes);

        if(skinnedObject)
        {
            skinnedObject.hasRoot = scene.root;
        }

        const iterateFn = (node:Node, indentation:string) => {
            node.hasChildren.forEach((child:Node) => {
                console.log(indentation + child.name + (child.hasSource ? (child.hasSource.hasRenderable != null ? "(render)" : "(trs)") : ""));
                iterateFn(child, indentation + "  ");
            });
        }
        console.log(scene.root.name);
        iterateFn(scene.root, "  ");
    }

    let skin;
    gltf.skins = gltf.skins.map((skin:any) => {
        //const joints = skin.joints.map((ndx:number) => gltf.nodes[ndx]);
        const joints = new Map();
        skin.joints.forEach((ndx:number) => {
            joints.set(ndx, gltf.nodes[ndx]);
        })
        const inverseBindMatrixData = getDataByAccessor(gltf, skin.inverseBindMatrices)
        const s = new Skin(joints, inverseBindMatrixData);
        if(skinnedObject)
        {
            skinnedObject.storesBoneData = s;
        }
        return s;
    })

    gltf.animations = gltf.animations.map((animation:any) => {
        console.log("animation: " + animation.name);
        let inputs = new Map();
        let outputs = new Map();
        animation.samplers = animation.samplers.map((sampler:any) => {
            console.log(sampler.input);
            if(!inputs.has(sampler.input))
            {
                inputs.set(sampler.input, getDataByAccessor(gltf, sampler.input));
                animation.minTime = gltf.accessors[sampler.input].min[0];
                animation.maxTime = gltf.accessors[sampler.input].max[0];
                animation.frames = inputs.get(sampler.input).length;
                animation.sPerFrame = animation.maxTime / animation.frames;
                animation.fps = 1.0 / animation.sPerFrame;
                console.log(`minTime=${animation.minTime}, maxTime=${animation.maxTime}, frames=${animation.frames},
                    sPerFrame=${sampler.sPerFrame} fps=${sampler.fps}`)
            }
            if(!outputs.has(sampler.output))
            {
                outputs.set(sampler.output, getDataByAccessor(gltf, sampler.output));
            }
            sampler.inputBuffer = inputs.get(sampler.input);
            sampler.outputBuffer = outputs.get(sampler.output);
            return sampler;
        });
        animation.matrices = new Map();
        animation.translations = new Map();
        animation.rotations = new Map();
        animation.channels = animation.channels.map((channel:any) => {
            channel.sampler = animation.samplers[channel.sampler];
            if(channel.target.path === "translation")
            {
                let matrices = new Array(animation.frames);
                let translations = new Array(animation.frames);
                for(let i = 0; i < animation.frames; ++i)
                {
                    let I = i * 3;
                    let pos = glm.vec3(channel.sampler.outputBuffer[I], channel.sampler.outputBuffer[I + 1], channel.sampler.outputBuffer[I + 2]);
                    translations[i] = pos;
                    matrices[i] = glm.translate(glm.mat4(1.0), pos);
                }
                animation.matrices.set(channel.target.node, matrices);
                animation.translations.set(channel.target.node, translations);
            }
            else if(channel.target.path === "rotation")
            {
                let matrices = animation.matrices.get(channel.target.node);
                let rotations = new Array(animation.frames);
                for(let i = 0; i < animation.frames; ++i)
                {
                    let I = i * 4;
                    let rot = glm.quat(channel.sampler.outputBuffer[I + 3], channel.sampler.outputBuffer[I], channel.sampler.outputBuffer[I + 1], channel.sampler.outputBuffer[I + 2]);

                    rotations[i] = rot;
                    matrices[i]["*="](glm.toMat4(rot));
                }
                animation.rotations.set(channel.target.node, rotations);
            }
            channel.target.node = gltf.nodes[channel.target.node];
            return channel;
        })
        console.log(animation.matrices);
        if(skinnedObject)
        {
            let anim = new Animation(animation.name, animation.frames, animation.sPerFrame, animation.translations, animation.rotations);
            skinnedObject.animatedBy.set(animation.name, anim);
        }
        return animation;
    })

    return skinnedObject;
}