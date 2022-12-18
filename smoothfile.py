import modeltosrc
import reflect

import os;

PATH_MODELS_CORE = os.path.join("models","core")
PATH_GEN = os.path.join("src", "gen")

def _default(*args):
    return True

def _reflect():
    return reflect.reflectSource(PATH_MODELS_CORE, os.path.join(PATH_GEN, "core"))

def _translatecpp():
    return modeltosrc.translatecpp(PATH_MODELS_CORE, PATH_GEN, "core")

def _translatets():
    return modeltosrc.translatets(PATH_MODELS_CORE, PATH_GEN, "core")

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

    #print("len(vertices) :" + str(len(vertices)))

    for i in range(len(indices)):
        #print(f"index={index}")
        outVertices.append(vertices[indices[i][0] - 1]) # Positions
        outVertices.append(uvs[indices[i][1] - 1]) # UVs
        outVertices.append(normals[indices[i][2] - 1]) # Normals


    #indices.append(len(indices))
    name = os.path.basename(filepath)
    name = name[0:name.find(".")]

    content = ['import { VertexArray } from "../gen/core/vertexarray"',
        f"export class Asset_{name} extends VertexArray",
        '{',
        '    constructor() {',
        '        super([3, 2, 3],',
        '            [' + ", ".join([", ".join(x) for x in outVertices]) + '],',
        '            [' + ", ".join([str(x) for x in []]) + ']);',
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
    if dataDir == None:
        return False
    return reflect.reflectFile(dataDir, os.path.abspath(filePath))

def _gen():
    if _reflect():
        return _translatets()
    return False