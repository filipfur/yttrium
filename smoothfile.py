import modeltosrc
import reflect

import os;

PATH_MODELS_CORE = os.path.join("models","core")
PATH_MODELS_RENDER = os.path.join("models","render")
PATH_GEN = os.path.join("src", "gen")

def _default(*args):
    return True

def _reflect():
    result = True
    result = reflect.reflectSource(PATH_MODELS_CORE, os.path.join(PATH_GEN, "core")) and result
    result = reflect.reflectSource(PATH_MODELS_RENDER, os.path.join(PATH_GEN, "render")) and result
    return result

def _translatecore():
    return modeltosrc.translatets(PATH_MODELS_CORE, PATH_GEN, "core")

def _translaterender():
    return modeltosrc.translatets(PATH_MODELS_RENDER, PATH_GEN, "render")

def _allmesh():
    for name in os.listdir('assets/'):
        if name.endswith(".obj"):
            #print(os.path.join("assets", name))
            _mesh(os.path.join("assets", name))

def _mesh(filepath, uvx=1):
    file = open(filepath, 'r')
    lines = file.readlines()
    vertices = []
    uvs = []
    normals = []
    indices = []
    outVertices = []
    outIndices = []

    for line in lines:
        if line.startswith("v "):
            line = line.strip()
            arr = line.split()
            arr = arr[1:]
            vertices.append(arr)
        elif line.startswith("vt "):
            line = line.strip()
            arr = line.split()
            arr = arr[1:]
            uvs.append([str(float(x) * float(uvx)) for x in arr])
        elif line.startswith("vn "):
            line = line.strip()
            arr = line.split()
            arr = arr[1:]
            normals.append(arr)
        elif line.startswith("f "):
            line = line.strip()
            arr = line.split()
            arr = arr[1:]
            for x in arr:
                indices.append([int(x) for x in x.split("/")])
            outIndices.append(len(outIndices))

    print("len(vertices) :" + str(len(vertices)))
    print("len(uvs) :" + str(len(uvs)))
    print("len(normals) :" + str(len(normals)))

    for i in range(len(indices)):
        #print(f"index={index}")
        outVertices.append(vertices[indices[i][0] - 1]) # Positions
        outVertices.append(normals[indices[i][2] - 1]) # Normals
        outVertices.append(uvs[indices[i][1] - 1]) # UVs



    #indices.append(len(indices))
    name = os.path.basename(filepath)
    name = name[0:name.find(".")]

    count = len(indices) * 8

    content = ['import { VertexArray } from "../gen/core/vertexarray"',
        f"export class Mesh_{name} extends VertexArray",
        '{',
        '    constructor() {',
        '        super();',
        '        this.createVertexBuffer([3, 3, 2], new Float32Array([' + ", ".join([", ".join(x) for x in outVertices]) + f']), {count}, gl.FLOAT, 0, 0);',
#        '            [' + ", ".join([str(x) for x in []]) + ']);',
        '    }',
        '}']


    outstr = "\n".join(content)
    #print(outstr)

    assetDir = os.path.join("src", "assets")
    if(not os.path.exists(assetDir)):
        os.makedirs(assetDir)

    with open(os.path.join(assetDir, name + ".ts"), "w") as f:
        f.write(outstr)

    return True

def _reflectfile(filePath):
    dataDir = None
    if os.path.dirname(filePath) == os.path.join("src", "gen", "core"):
        dataDir = PATH_MODELS_CORE
    elif os.path.dirname(filePath) == os.path.join("src", "gen", "render"):
        dataDir = PATH_MODELS_RENDER
    if dataDir == None:
        return False
    return reflect.reflectFile(dataDir, os.path.abspath(filePath))

def _gen():
    if _reflect():
        result = True
        result = _translatecore() and result
        result = _translaterender() and result
        return result
    return False