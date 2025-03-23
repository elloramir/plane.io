// Copyright 2025 Elloramir.
// All rights over the code are reserved.

import { mat4, vec3 } from "./math.js";
import Model from "./model.js";
import Texture from "./texture.js";

export default
class GLTFLoader {
    static async loadFromFile(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            
            // Check if it's a GLB file
            if (url.toLowerCase().endsWith('.glb')) {
                return this.parseGLB(arrayBuffer);
            } else {
                // Handle regular GLTF JSON files
                const gltfData = JSON.parse(new TextDecoder().decode(arrayBuffer));
                return this.parseGLTFMesh(gltfData);
            }
        } catch (error) {
            console.error("Error loading model:", error);
            throw error;
        }
    }
    
    static async parseGLB(arrayBuffer) {
        const header = new DataView(arrayBuffer, 0, 12);
        const magic = header.getUint32(0, true);
        if (magic !== 0x46546C67) {
            throw new Error('Invalid GLB file, magic number mismatch');
        }
        const version = header.getUint32(4, true);
        if (version !== 2) {
            throw new Error(`Unsupported GLB version: ${version}`);
        }
        
        const jsonChunkHeader = new DataView(arrayBuffer, 12, 8);
        const jsonChunkLength = jsonChunkHeader.getUint32(0, true);
        const jsonChunkType = jsonChunkHeader.getUint32(4, true);
        
        if (jsonChunkType !== 0x4E4F534A) { // "JSON"
            throw new Error('Invalid GLB file, first chunk must be JSON');
        }
        
        const jsonChunk = arrayBuffer.slice(20, 20 + jsonChunkLength);
        const gltfData = JSON.parse(new TextDecoder().decode(jsonChunk));

        // Parse BIN chunk if present
        let binChunk = null;
        if (20 + jsonChunkLength < arrayBuffer.byteLength) {
            const binChunkHeader = new DataView(arrayBuffer, 20 + jsonChunkLength, 8);
            const binChunkLength = binChunkHeader.getUint32(0, true);
            const binChunkType = binChunkHeader.getUint32(4, true);
            
            if (binChunkType === 0x004E4942) { // "BIN"
                binChunk = arrayBuffer.slice(28 + jsonChunkLength, 28 + jsonChunkLength + binChunkLength);
            }
        }
        
        return this.parseGLTFMesh(gltfData, [binChunk]);
    }
    
    static async parseGLTFMesh(gltfData, binBuffers = null) {
        const model = new Model();
        const buffers = binBuffers || await this.loadBuffers(gltfData.buffers);
        const globalMatrices = this.calculateGlobalMatrices(gltfData);
        const nodes = gltfData.nodes;
        const scene = gltfData.scenes[gltfData.scene];

        const processNode = async (nodeIndex) => {
            const node = nodes[nodeIndex];

            if (node.mesh !== undefined) {
                const mesh = model.createMesh();
                const gltfMesh = gltfData.meshes[node.mesh];
                
                if (!gltfMesh.primitives || gltfMesh.primitives.length === 0) {
                    throw new Error("No primitives found in GLTF mesh");
                }
                
                const primitive = gltfMesh.primitives[0];

                if (primitive.material !== undefined) {
                    const material = gltfData.materials[primitive.material];
                    if (material && material.pbrMetallicRoughness) {
                        if (material.pbrMetallicRoughness) {

                            // Default pbr materials
                            mesh.roughness = material.pbrMetallicRoughness.roughnessFactor ?? 1.0;
                            mesh.metallic = material.pbrMetallicRoughness.metallicFactor ?? 0.0;

                             // Load texture if avaible
                            if (material.pbrMetallicRoughness.baseColorTexture) {
                                const textureInfo = material.pbrMetallicRoughness.baseColorTexture;
                                const textureIndex = textureInfo.index;
                                const gltfTexture = gltfData.textures[textureIndex];
                                const imageIndex = gltfTexture.source;
                                const gltfImage = gltfData.images[imageIndex];

                                mesh.texture = await this.loadTexture(gltfImage, gltfData, buffers);
                            }

                            // Load base color from material
                            if (material.pbrMetallicRoughness.baseColorFactor) {
                                mesh.baseColor = [...material.pbrMetallicRoughness.baseColorFactor];
                                // If the alpha channel is 0 let's just ignore that mesh
                                if (mesh.baseColor.pop() == 0.0) {
                                    model.destroyMesh(mesh);
                                    return;
                                } 
                            }

                            // Emissive factor
                            if (material.emissiveFactor) {
                                this.emissive = [...material.emissiveFactor];
                            }
                        }
                    }
                }
                
                // Get data accessors to populate our mesh
                const positionAccessor = gltfData.accessors[primitive.attributes.POSITION];
                const normalAccessor = primitive.attributes.NORMAL !== undefined ? 
                    gltfData.accessors[primitive.attributes.NORMAL] : null;
                const texcoordAccessor = primitive.attributes.TEXCOORD_0 !== undefined ? 
                    gltfData.accessors[primitive.attributes.TEXCOORD_0] : null;
                const indicesAccessor = gltfData.accessors[primitive.indices];
                
                // Get buffer views
                const positionBufferView = gltfData.bufferViews[positionAccessor.bufferView];
                const normalBufferView = normalAccessor ? 
                    gltfData.bufferViews[normalAccessor.bufferView] : null;
                const texcoordBufferView = texcoordAccessor ? 
                    gltfData.bufferViews[texcoordAccessor.bufferView] : null;
                const indicesBufferView = gltfData.bufferViews[indicesAccessor.bufferView];
                
                // Extract attribute data
                const positions = this.extractBufferData(
                    buffers[positionBufferView.buffer],
                    positionBufferView,
                    positionAccessor
                );
                const normals = normalBufferView ? 
                    this.extractBufferData(
                        buffers[normalBufferView.buffer],
                        normalBufferView,
                        normalAccessor
                    ) : null;
                const texcoords = texcoordBufferView ? 
                    this.extractBufferData(
                        buffers[texcoordBufferView.buffer],
                        texcoordBufferView,
                        texcoordAccessor
                    ) : null;
                const indices = this.extractBufferData(
                    buffers[indicesBufferView.buffer],
                    indicesBufferView,
                    indicesAccessor
                );
                
                // Apply the global transform matrix to the vertices nodes
                const globalMatrix = globalMatrices[nodeIndex];
                const transformedPositions = this.transformVertices(positions, globalMatrix);
                
                // Add vertices to mesh
                const vertexCount = positionAccessor.count;

                // Mesh boundaries
				let minX = Infinity, minY = Infinity, minZ = Infinity;
				let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

                for (let v = 0; v < vertexCount; v++) {
                    const posIdx = v * 3;
                    const x = transformedPositions[posIdx];
                    const y = transformedPositions[posIdx + 1];
                    const z = transformedPositions[posIdx + 2];

					if (x < minX) minX = x;
					if (y < minY) minY = y;
					if (z < minZ) minZ = z;
					if (x > maxX) maxX = x;
					if (y > maxY) maxY = y;
					if (z > maxZ) maxZ = z;

                    let nx = 0, ny = 0, nz = 1;
                    if (normals) {
                        nx = normals[posIdx];
                        ny = normals[posIdx + 1];
                        nz = normals[posIdx + 2];
                    }

                    let u = 0, vCoord = 0;
                    if (texcoords) {
                        const texIdx = v * 2;
                        u = texcoords[texIdx];
                        vCoord = texcoords[texIdx + 1];
                    }

                    mesh.vertex(x, y, z, nx, ny, nz, u, vCoord);
                }

                mesh.setBoundaries(minX, minY, minZ, maxX, maxY, maxZ);
                
                // Add indices to mesh
                for (let i = 0; i < indices.length; i += 3) {
                    mesh.indices.push(indices[i], indices[i + 1], indices[i + 2]);
                    mesh.numIndices += 3;
                }
                
                // Upload mesh to GPU and append it to model
                mesh.upload();
            }
            
            // Process children nodes (recursive)
            if (node.children) {
                for (const childIndex of node.children) {
                    await processNode(childIndex);
                }
            }
        };

        for (const nodeIndex of scene.nodes) {
            await processNode(nodeIndex);
        }

        return model;
    }

    static calculateGlobalMatrices(gltfData) {
        const globalMatrices = [];
        const nodes = gltfData.nodes;
        const scene = gltfData.scenes[gltfData.scene];

        const traverseNode = (nodeIndex, parentMatrix) => {
            const node = nodes[nodeIndex];
            let localMatrix = mat4.create();

            if (node.matrix) {
                mat4.copy(localMatrix, node.matrix);
            } else {
                const translationMatrix = mat4.create();
                const rotationMatrix = mat4.create();
                const scaleMatrix = mat4.create();

                if (node.translation) {
                    mat4.fromTranslation(translationMatrix, node.translation);
                }
                if (node.rotation) {
                    mat4.fromQuat(rotationMatrix, node.rotation);
                }
                if (node.scale) {
                    mat4.fromScaling(scaleMatrix, node.scale);
                }

                // Multiply on order: T * R * S
                mat4.multiply(localMatrix, translationMatrix, rotationMatrix);
                mat4.multiply(localMatrix, localMatrix, scaleMatrix);
            }

            const globalMatrix = mat4.create();
            mat4.multiply(globalMatrix, parentMatrix, localMatrix);
            globalMatrices[nodeIndex] = globalMatrix;

            if (node.children) {
                for (const childIndex of node.children) {
                    traverseNode(childIndex, globalMatrix);
                }
            }
        };

        for (const nodeIndex of scene.nodes) {
            traverseNode(nodeIndex, mat4.create());
        }

        return globalMatrices;
    }

    static transformVertices(positions, matrix) {
        const transformedPositions = new Float32Array(positions.length);

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            const transformed = vec3.transformMat4(vec3.create(), [x, y, z], matrix);

            transformedPositions[i] = transformed[0];
            transformedPositions[i + 1] = transformed[1];
            transformedPositions[i + 2] = transformed[2];
        }

        return transformedPositions;
    }
    
    static async loadTexture(gltfImage, gltfData, buffers) {
        if (gltfImage.bufferView !== undefined) {
            const bufferView = gltfData.bufferViews[gltfImage.bufferView];
            const buffer = buffers[bufferView.buffer];
            const byteOffset = bufferView.byteOffset || 0;
            const byteLength = bufferView.byteLength;
            
            const imageData = buffer.slice(byteOffset, byteOffset + byteLength);
            const blob = new Blob([imageData], { type: gltfImage.mimeType });
            const imageUrl = URL.createObjectURL(blob);
            
            return await Texture.loadFromFile(imageUrl).finally(() => {
                URL.revokeObjectURL(imageUrl);
            });
        } else if (gltfImage.uri) {
            if (gltfImage.uri.startsWith('data:')) {
                return await Texture.loadFromFile(gltfImage.uri);
            } else {
                return await Texture.loadFromFile(gltfImage.uri);
            }
        }
        
        throw new Error('Unsupported texture format');
    }
    
    static async loadBuffers(bufferDefs) {
        const buffers = [];
        
        for (const bufferDef of bufferDefs) {
            if (bufferDef.uri) {
                if (bufferDef.uri.startsWith('data:')) {
                    const base64 = bufferDef.uri.split(',')[1];
                    const binaryString = atob(base64);
                    const bytes = new Uint8Array(binaryString.length);
                    
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    buffers.push(bytes.buffer);
                } else {
                    const response = await fetch(bufferDef.uri);
                    const buffer = await response.arrayBuffer();
                    buffers.push(buffer);
                }
            }
        }
        
        return buffers;
    }
    
    static extractBufferData(buffer, bufferView, accessor) {
        const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
        const count = accessor.count;
        
        let componentSize;
        let numComponents;
        
        switch (accessor.componentType) {
            case 5120: // BYTE
                componentSize = 1;
                break;
            case 5121: // UNSIGNED_BYTE
                componentSize = 1;
                break;
            case 5122: // SHORT
                componentSize = 2;
                break;
            case 5123: // UNSIGNED_SHORT
                componentSize = 2;
                break;
            case 5125: // UNSIGNED_INT
                componentSize = 4;
                break;
            case 5126: // FLOAT
                componentSize = 4;
                break;
            default:
                throw new Error(`Unsupported component type: ${accessor.componentType}`);
        }
        
        switch (accessor.type) {
            case 'SCALAR':
                numComponents = 1;
                break;
            case 'VEC2':
                numComponents = 2;
                break;
            case 'VEC3':
                numComponents = 3;
                break;
            case 'VEC4':
                numComponents = 4;
                break;
            case 'MAT2':
                numComponents = 4;
                break;
            case 'MAT3':
                numComponents = 9;
                break;
            case 'MAT4':
                numComponents = 16;
                break;
            default:
                throw new Error(`Unsupported accessor type: ${accessor.type}`);
        }
        
        let TypedArray;
        switch (accessor.componentType) {
            case 5120:
                TypedArray = Int8Array;
                break;
            case 5121:
                TypedArray = Uint8Array;
                break;
            case 5122:
                TypedArray = Int16Array;
                break;
            case 5123:
                TypedArray = Uint16Array;
                break;
            case 5125:
                TypedArray = Uint32Array;
                break;
            case 5126:
                TypedArray = Float32Array;
                break;
            default:
                throw new Error(`Unsupported component type: ${accessor.componentType}`);
        }
        
        return new TypedArray(
            buffer, 
            byteOffset, 
            count * numComponents
        );
    }
}
