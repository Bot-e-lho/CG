"use strict";
// usar a função perlin noise para posicionamento de arvores
// Arrumar texturas
// Adicionar mais tipos de objetos

async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  resizeCanvasToDisplaySize(canvas);

  // Tell the twgl to match position with a_position etc..
  twgl.setAttributePrefix("a_");

  const vs = `#version 300 es
  in vec4 a_position;
  in vec3 a_normal;
  in vec2 a_texcoord;
  in vec4 a_color;
  in float a_size;
  in float a_type;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;
  uniform vec3 u_viewWorldPosition;
  uniform float u_time;

  out vec3 v_normal;
  out vec3 v_surfacetoView;
  out vec2 v_texcoord;
  out vec4 v_color;

  void main() {
    vec4 worldPosition = u_world * a_position;
    gl_Position = u_projection * u_view * worldPosition;
    v_surfacetoView = u_viewWorldPosition - worldPosition.xyz;
    v_normal = mat3(u_world) * a_normal;
    v_texcoord = a_texcoord;
    v_color = a_color;
    gl_PointSize = a_size;
  }
  `;

  const fs = `#version 300 es
  precision highp float;

  in vec3 v_normal;
  in vec3 v_surfacetoView;
  in vec2 v_texcoord;
  in vec4 v_color;

  uniform vec3 diffuse;
  uniform sampler2D diffuseMap;
  uniform vec3 ambient;
  uniform vec3 emissive;
  uniform vec3 specular;
  uniform sampler2D specularMap;
  uniform float shininess;
  uniform float opacity;
  uniform sampler2D normalMap;
  uniform vec3 u_viewWorldPosition;
  uniform float u_time;
  uniform vec3 u_lightDirection;
  uniform vec3 u_ambientLight;

  out vec4 outColor;

  void main () {
    vec3 normal = normalize(v_normal);

    vec3 surfaceToViewDirection = normalize(v_surfacetoView);
    vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);
    vec4 specularMapColor = texture(specularMap, v_texcoord);
    vec3 effectiveSpecular = specular * specularMapColor.rgb;

    vec4 diffuseMapColor = texture(diffuseMap, v_texcoord);
    vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
    float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;
    vec3 effectiveAmbient = ambient * u_ambientLight * v_color.rgb;
    vec3 effectiveEmissive = emissive * v_color.rgb;
    
    outColor = vec4(
      emissive +
      ambient * u_ambientLight +
      effectiveDiffuse * fakeLight +
      effectiveSpecular * pow(specularLight, shininess),
      effectiveOpacity);
  }
  `;
  // compiles and links the shaders, looks up attribute and uniform locations
  const meshProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);

  const models = {
    grass: { obj: 'models/grass.obj', mtl: 'models/grass.mtl', png: 'models/oak_leaf.png' },
    tree: { obj: 'models/Tree.obj', mtl: 'models/Tree.mtl', png: 'models/birch_leaf.png' },
    tree_2: { obj: 'models/tree_2.obj', mtl: 'models/tree_2.mtl', png: 'models/birch_leaf.png' },
    tree_3: { obj: 'models/tree_3.obj', mtl: 'models/tree_3.mtl', png: 'models/fir_leaf.png' },
    tree_4: { obj: 'models/tree_4.obj', mtl: 'models/tree_4.mtl', png: 'models/fir_bark.png' },
    rock: { obj: 'models/rock.obj', mtl: 'models/rock.mtl', png: 'models/rock.png' }//,
    //shrub: { obj: 'models/shrub.obj', mtl: 'models/shrub.mtl', png: 'models/shrub.png'}
    //branch: { obj: 'models/branch.obj', mtl: 'models/branch.mtl', png: 'models/branch.png'}
  };

  async function loadFile(file) {
    try {
        const response = await fetch(file);

        if (!response.ok) {
            throw new Error('Network Error');
        }

        const text = await response.text();
        // const obj = parseOBJ(text);

        return text;
    } catch (error) {
        console.error(`Failed to load file: ${file}`, error);
        throw error;
    }
}


  const loadmodels = async (model) => {
    const [objText, mtlText] = await Promise.all([
        loadFile(model.obj),
        loadFile(model.mtl)
    ]);
    return { objText, mtlText };
  };

  const [
    grassmodels, treemodels, tree_2models, rockmodels, tree_3models, tree_4models//, shrubmodels, branchmodels
  ] = await Promise.all([
    loadmodels(models.grass), loadmodels(models.tree), loadmodels(models.tree_2),
    loadmodels(models.rock), loadmodels(models.tree_3), loadmodels(models.tree_4)
    //, loadmodels(models.shrub), loadmodels(models.branch)
  ]);

  const grassObj = parseOBJ(grassmodels.objText);
  const grassMaterials = parseMTL(grassmodels.mtlText);
  const treeObj = parseOBJ(treemodels.objText);
  const treeMaterials = parseMTL(treemodels.mtlText);
  const tree_2Obj = parseOBJ(tree_2models.objText);
  const tree_2Materials = parseMTL(tree_2models.mtlText);
  const rockObj = parseOBJ(rockmodels.objText);
  const rockMaterials = parseMTL(rockmodels.mtlText);
  const tree_3Obj = parseOBJ(tree_3models.objText);
  const tree_3Materials = parseMTL(tree_3models.mtlText);
  //const shrubObj = parseOBJ(shrubmodels.objText);
  //const shrubMaterials = parseMTL(shrubmodels.mtlText);
  //const branchObj = parseOBJ(branchmodels.objText);
  //const branchMaterials = parseMTL(branchmodels.mtlText);
  const tree_4Obj = parseOBJ(tree_4models.objText);
  const tree_4Materials = parseMTL(tree_4models.mtlText);

  const textures = {
    defaultWhite: twgl.createTexture(gl, {src: [255, 255, 255, 255]}),
    defaultNormal: twgl.createTexture(gl, {src: [127, 127, 255, 0]}),
    defaultGreen: twgl.createTexture(gl, {src: [3, 46, 15, 255]}),
    grass: twgl.createTexture(gl, {src: grassmodels.png}),
    tree: twgl.createTexture(gl, {src: treemodels.png}),
    tree_2: twgl.createTexture(gl, {src: tree_2models.png}),
    tree_3: twgl.createTexture(gl, {src: tree_3models.png}),
    rock: twgl.createTexture(gl, {src: rockmodels.png}),
    //shrub: twgl.createTexture(gl, {src: shrubmodels.png}),
    //branch: twgl.createTexture(gl, {src: branchmodels.png}),
    tree_4: twgl.createTexture(gl, {src: tree_4models.png})
  };


  const modelMaterials = [grassMaterials, treeMaterials, tree_2Materials, rockMaterials, tree_3Materials, tree_4Materials];//, shrubMaterials, branchMaterials
  const modelTextures = [textures.grass, textures.tree, textures.tree_2, textures.rock, textures.tree_3, textures.tree_4];//, textures.shrub, textures.branch
  const modelNames = ['grass', 'tree', 'tree_2', 'rock', 'tree_3', 'tree_4'];
  //const modelNames = ['grass', 'tree', 'tree_2', 'rock', 'tree_3', 'shrub', 'branch'];

  for (let i = 0; i < modelMaterials.length; i++) {
    loadTextureForMaterials(gl, modelMaterials[i], models[modelNames[i]].png, modelTextures[i]);
  }


   const defaultMaterial = {
    diffuse: [1, 1, 1],
    diffuseMap: textures.grass,
    normalMap: textures.defaultGreen,
    ambient: [0, 0, 0],
    specular: [1, 1, 1],
    specularMap: textures.grass,
    shininess: 400,
    opacity: 1,    
  };

  function createGroundTexture(gl, textureOptions = {}) {
    const defaultOptions = {
        diffuse: [1, 1, 1],
        diffuseMapSrc: 'models/ground.png',
        ambient: [0, 0, 0],
        specular: [1, 1, 1],
        shininess: 1,
        opacity: 1,
    };

    const options = { ...defaultOptions, ...textureOptions };

    const texture = twgl.createTexture(gl, { src: options.diffuseMapSrc }, (err, texture) => {
        if (err) {
            console.error('Failed to load texture:', options.diffuseMapSrc);
            twgl.createTexture(gl, { src: defaultGreen });
        }
    });

    return {
        diffuse: options.diffuse,
        diffuseMap: texture,
        ambient: options.ambient,
        specular: options.specular,
        shininess: options.shininess,
        opacity: options.opacity,
    };
}

const groundTexture = createGroundTexture(gl, {
    diffuseMapSrc: 'models/ground.png',
});


  function genGround(gl, program, width, height) {
    const positions = [
        -width / 2, 0, -height / 2,
        width / 2, 0, -height / 2,
        width / 2, 0, height / 2,
        -width / 2, 0, height / 2

    ];

    const texcoords = [
        0, 0,   // vértice 1
        250, 0, // vértice 2
        250, 250, // vértice 3
        0, 250  // vértice 4
    ];

    const normals = [
        0.0, 1.0, 0.0, // vértice 1
        0.0, 1.0, 0.0, // vértice 2
        0.0, 1.0, 0.0, // vértice 3
        0.0, 1.0, 0.0  // vértice 4
    ];

    const indices = [
        0, 1, 2, // primeiro triângulo
        0, 2, 3  // segundo triângulo
    ];

    const groundMatrix = {
        position: { numComponents: 3, data: new Float32Array(positions) },
        texcoord: { numComponents: 2, data: new Float32Array(texcoords) },
        normal: { numComponents: 3, data: new Float32Array(normals) },
        indices: { numComponents: 3, data: new Uint16Array(indices) },
    };

    // Create a buffer
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, groundMatrix);

    // Create a vertex array object (attribute state)
    const vao = twgl.createVAOFromBufferInfo(gl, program, bufferInfo);

    return {
        bufferInfo: bufferInfo,
        vao: vao
    };
}


  const groundObj = genGround(gl, meshProgramInfo, 2500, 2500);

  function genObj(gl, programInfo, obj, materials) {
    return obj.geometries.map(({material, data}) => {
      if (data.color) {
        if (data.position.length === data.color.length) {
          // it's 3. The our helper library assumes 4 so we need
          // to tell it there are only 3.
          data.color = {numComponents: 3, data: data.color};
        }
      } else {
        data.color = {value: [1, 1, 1, 1]};
      }
      /*// generate tangents if we have the data to do so.
      if (data.texcoord && data.normal) {
        data.tangent = generateTangents(data.position, data.texcoord);
      } else {
        // There are no tangents
        data.tangent = { value: [1, 0, 0] };
      }

      if (!data.texcoord) {
        data.texcoord = { value: [0, 0] };
      }

      if (!data.normal) {
        // we probably want to generate normals if there are none
        data.normal = { value: [0, 0, 1] };
      }*/
      // create a buffer for each array by calling
      // gl.createBuffer, gl.bindBuffer, gl.bufferData
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, data);
      const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);
  
      return {
        material: {
          ...defaultMaterial, 
          ...materials[material]},
        bufferInfo,
        vao,
      };
    });
  }

  const objects = [
    { name: 'grass', obj: grassObj, materials: grassMaterials },
    { name: 'tree', obj: treeObj, materials: treeMaterials },
    { name: 'tree_2', obj: tree_2Obj, materials: tree_2Materials },
    { name: 'tree_3', obj: tree_3Obj, materials: tree_3Materials },
    { name: 'rock', obj: rockObj, materials: rockMaterials },
    //{ name: 'shrub', obj: shrubObj, materials: shrubMaterials },
    //{ name: 'branch', obj: branchObj, materials: branchMaterials},
    { name: 'tree_4', obj: tree_4Obj, materials: tree_4Materials},
  ];
  
  const material = {};
  
  for (const { name, obj, materials } of objects) {
    material[name] = genObj(gl, meshProgramInfo, obj, materials);
  }
  
  const grass = material.grass;
  const tree = material.tree;
  const tree_2 = material.tree_2;
  const rock = material.rock;
  const tree_3 = material.tree_3;
  //const shrub = material.shrub;
  //const branch = material.branch;
  const tree_4 = material.tree_4;

  var eye = [0, 200, 450]; // exemplo para mostrar o efeito da iluminação: [0, 300, 300];
  var target = [0, -0.3, -1]; // perspectiva horizontal - [0, 0, 1]; efeito da iluminação na camera
  const fovRad = degToRad(90);

  document.getElementById('genRandom').addEventListener('click', function() {
    const seed = document.getElementById('input').value;
    grass_density = getSliderValue('grassSlider');
    forest_size = getSliderValue('forestSlider');
    obj_Scale = getSliderValue('objSlider');
    obj_pos = genForest(seed, forest_size, obj_Scale);
  });


  function degToRad(deg) {
    return deg * Math.PI / 180;
  }
  function radToDeg(rad){
    return rad * 180 / Math.PI;
  }

  let then = performance.now();
  // Compute the matrix
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var zNear = 0.1;
  var zFar = 5000; 
  var projectionMatrix = m4.perspective(fovRad, aspect, zNear, zFar);
  //projectionMatrix = m4.translate(projectionMatrix, translation[0], translation[1], translation[2]);
  //projectionMatrix = m4.xRotate(projectionMatrix, rotation[0]);
  //projectionMatrix = m4.yRotate(projectionMatrix, rotation[1]);
  //projectionMatrix = m4.zRotate(projectionMatrix, rotation[2]);

  // Draw the scene.
  function drawScene() {
    const now = performance.now();
    const deltaTime = (now - then) * 0.001; // Convertendo para segundos
    then = now;

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.cullFace(gl.BACK);
    gl.depthFunc(gl.LESS); 
    gl.frontFace(gl.CCW);


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(174/255, 198/255, 207/255, 1);
    
    eye = updateCamera(deltaTime, target, eye);
  
    var up = [0, 1, 0]; 
    // Compute the camera's matrix using look at.
    var camera = m4.lookAt(eye, m4.addVectors(eye, target), up); // const camera = m4.lookAt(eye, target, up); efeito de ilumninação
    // Make a view matrix from the camera matrix
    var viewMatrix = m4.inverse(camera);
    // move the projection space to view space (the space in front of
    // the camera)
    //const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
    
    const sharedUniforms = {
      u_lightDirection: m4.normalize([5, -5, 5]), // vetor define a direção da luz - usar como exemplo: m4.normalize([-1, -1, -1]), 
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_viewWorldPosition: eye,
      u_time: now * 0.001,
      u_size: 1,
      u_diffuseMap: textures.grass,
      u_normalMap: textures.defaultNormal,
      u_ambientLight: [0.5, 0.5, 0.5]
    };
  
    gl.useProgram(meshProgramInfo.program);
    
    // calls gl.uniform
    twgl.setUniforms(meshProgramInfo, sharedUniforms);
  
    let u_world = m4.identity();
    u_world = m4.xRotate(u_world, degToRad(180));
    //const extents = getGeometriesExtents(obj.geometries);
    //const range = m4.subtractVectors(extents.max, extents.min);
    //const objOffset = m4.scaleVector(
    //  m4.addVectors(
    //    extents.min,
    //    m4.scaleVector(range, 0.5)),
    //  -1);
  
    gl.bindVertexArray(groundObj.vao);
  
    twgl.setUniforms(meshProgramInfo, {
      u_world: u_world,
    }, groundTexture);
    
    twgl.drawBufferInfo(gl, groundObj.bufferInfo);
    /*
    const typeToParts = {
      0: grass,
      1: tree,
      2: tree_2,
      3: tree_3,
      // 4: tree_4,
      // 5: shrub,
      // 6: branch,
      4: rock
    };
    for (const { position, scale, type } of obj_pos) {
      let parts = typeToParts[type];

      if (typeToParts.hasOwnProperty(type)) {
        parts = typeToParts[type];
      }
      else {
        console.log('Not mapping type');
        continue;
      }*/
        for (const { position, scale, type } of obj_pos) {
          let parts;
      
          if (type === 1) {
            parts = tree;
          } else if (type === 2) {
            parts = tree_2;
          } else if (type === 3) {
            parts = tree_3;
          } else if (type === 4) {
            parts = tree_4;
          } else if (type === 5) {
            parts = rock;
            //parts = shrub;
          //} else if (type === 6) {
            //parts = branch;
          //
          } else {
            parts = grass;
          }

      //const adjustedPosition = m4.addVectors(position.slice(0, 3), objOffset);
      let u_world = m4.identity();
      u_world = m4.translate(u_world, ...position.slice(0, 3));
      u_world = m4.scale(u_world, scale, scale, scale);

      for (const {bufferInfo, vao, material} of parts) {
        // set the attributes for this part.
        gl.bindVertexArray(vao);
        // calls gl.uniform
        twgl.setUniforms(meshProgramInfo, {
          u_world,
        }, material);
        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }
    requestAnimationFrame(drawScene);
  }
  
  requestAnimationFrame(drawScene);
}  

let seed, forest_size, grass_density, obj_Scale, obj_pos;
seed = Math.random();
forest_size = 300;
grass_density = 10;
obj_Scale = 50;
obj_pos = genForest(seed, forest_size, obj_Scale);

main();

function getSliderValue(id) {
  const slider = document.getElementById(id);
  return parseInt(slider.value, 10);
}
// Mecanismos da camera
let up = [0, 1, 0];
let keysPressed = {};
const SPEED = 25;

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

function updateCamera(deltaTime, target, eye) {
  const right = m4.normalize(m4.cross(up, target));

  const horizontalDirection = m4.normalize([target[0], 0, target[2]]);
  

  if (keysPressed['w']) {
      eye = m4.addVectors(eye, m4.scaleVector(horizontalDirection, SPEED * deltaTime));
      target = m4.addVectors(target, m4.scaleVector(horizontalDirection, SPEED * deltaTime));
  }
  if (keysPressed['s']) {
      eye = m4.addVectors(eye, m4.scaleVector(horizontalDirection, -SPEED * deltaTime));
      target = m4.addVectors(target, m4.scaleVector(horizontalDirection, -SPEED * deltaTime));
  }
  if (keysPressed['d']) {
      eye = m4.addVectors(eye, m4.scaleVector(right, -SPEED * deltaTime));
      target = m4.addVectors(target, m4.scaleVector(right, -SPEED * deltaTime));
  }
  if (keysPressed['a']) {
      eye = m4.addVectors(eye, m4.scaleVector(right, SPEED * deltaTime));
      target = m4.addVectors(target, m4.scaleVector(right, SPEED * deltaTime));
  }
  return eye;
}

function degToRad(deg) {
    return deg * Math.PI / 180;
  }

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

// Funções de geração de objetos na floresta
function genForest(seed, forest_size, obj_Scale) {
  const random = RandomGen(seed);
  const scene = [];
  //const perlin = new Noise(seed);
  /** 
   * const gridSize = 5;
   * for (let x = -forest_size / 2; x < forest_size / 2; x += gridSize) {
        for (let z = -forest_size / 2; z < forest_size / 2; z += gridSize) {
            const noiseValue = perlin.noise(x / 100, z / 100);
            const probability = (noiseValue + 1) / 2;

            if (probability < 0.3) {
                const isValid = isValidPosition(x, z, scene);
                if (isValid) {
                    const position = genPosition(forest_size, random);
                    const scale = getRandomScale(0.8, 1.2, random);
                    const rotation = getRandomRotation(random);
                    const type = getRandomInt(1, 4);

                    scene.push({ position, scale, rotation, type });
                }
            }
        }*/
  genObjects(scene, forest_size, obj_Scale, random);
  genGrass(scene, random);
  return scene;
}

function genObjects(scene, forest_size, obj_Scale, random) {

  for (let i = 0; i < obj_Scale; i++) {
    let type = -1, position, scale, rotation;
    let max = 0;

    while (type === -1 && max < obj_Scale) {
      const temp = random();
      if (temp < 0.30) {
        type = 1;
      } else if (temp < 0.55) {
        type = 2;
      } else if (temp < 0.70) {
        type = 3;
      } else if (temp < 0.90) {
        type = 4;
      } else {
        type = 5;
      }
      /* if (temp < 0.23) {
      //   type = 1;
      } else if (temp < 46) {
        type = 2;
      } else if (temp < 60) {
        type = 3;
    } 
      // type = 4; tree_4
      // type = 5; shrub
      // type = 6; branch
      // type = 7; rock
      */
      position = genPosition(forest_size, random);

      if ([1, 2, 3].includes(type)) { // if([1, 2, 3, 4]).includes(type)
        scale = getRandomScale(5, 10, random);
      } else if ([4].includes(type)) {
        scale = getRandomScale(2, 4, random);
      } else {
        scale = getRandomScale(0.5, 2, random);
      }
      rotation = getRandomRotation(random);
      if ([1, 2, 3].includes(type) && !isValidPosition(position[0], position[2], scene)) {//if([1, 2, 3, 4]).includes(type)
        type = -1;
      }

      max++;
    }

    if (type === -1) {
      console.log(`Failed to place object`);
    } else {
      scene.push({ position, scale, rotation, type });
    }
  }
}


function genPosition(forest_size, random) {
  const x = (random() - 0.5) * forest_size;
  const z = (random() - 0.5) * forest_size;
  return [x, 0, z];
}

function isValidPosition(x, z, scene) {
  const minDistance = 50;

  for (const obj of scene) {
    const dx = obj.position[0] - x;
    const dz = obj.position[2] - z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < minDistance) {
      return false;
    }
  }
  return true;
}


function genGrass(scene, random) {
  const type = 0;
  for (let i = 0; i < grass_density * 100; i++) {
    let x = (Math.random(random) - 0.5) * forest_size;
    let z = (Math.random(random) - 0.5) * forest_size;
    let scale = getRandomScale(1, 1.5, random);
    let rotation = getRandomRotation(random);

    scene.push({ position: [x, 0, z], scale, rotation, type});
  }
}

function getRandomScale(min, max, random) {
  return Math.random(random) * (max - min) + min;
}

function getRandomRotation(random) {
  return Math.random(random) * Math.PI * 2;
}

function RandomGen(seed) {
  let x = Math.sin(seed++) * 10000;
  return function() {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
}


// Código abaixo baseado no código: https://webgl2fundamentals.org/webgl/lessons/webgl-load-obj-w-mtl.html
function resizeCanvasToDisplaySize(canvas) {
  const resizeCanvasToDisplaySize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    resizeCanvasToDisplaySize();
    window.addEventListener('resize', resizeCanvasToDisplaySize)
    
}

  // load texture for materials
function loadTextureForMaterials(gl, objMtl, src, textures) {
    for (const material of Object.values(objMtl)) {
      Object.entries(material)
        .filter(([key]) => key.endsWith('Map'))
        .forEach(([key, filename]) => {
          let texture = textures[filename];
          if (!texture) {
            texture = twgl.createTexture(gl, {src: src, flipY: true});
            textures[filename] = texture;
          }
          material[key] = texture;
        });
    }
}

function parseOBJ(text) {
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];
  const objColors = [[0, 0, 0]];

  // Estrutura de dados para armazenar os vértices
  const objVertexData = [objPositions, objTexcoords, objNormals, objColors];
  let webglVertexData = [[], [], [], []]; // Armazena dados para WebGL


  const materialLibs = [];
  const geometries = [];
  let geometry = null;
  let material = 'default';
  let object = 'default';
  let groups = ['default'];

  const noop = () => {};

  // Cria uma nova geometria se a atual não estiver vazia
  function newGeometry() {
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  // Inicializa uma nova geometria se não existir uma atual
  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      const color = [];

      webglVertexData = [position, texcoord, normal, color];

      geometry = {
        object,
        groups,
        material,
        data: { position, texcoord, normal, color }
      };

      geometries.push(geometry);
    }
  }

  // Adiciona um vértice processando seu index
  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
      // if this is the position index (index 0) and we parsed
      // vertex colors then copy the vertex colors to the webgl vertex color data
      if (i === 0 && objColors.length > 1) {
        geometry.data.color.push(...objColors[index]);
      }
    });
  }
  // Manipuladores de palavras-chave do arquivo OBJ
  const keywords = {
    v(parts) {
      // if there are more than 3 values here they are vertex colors
      if (parts.length > 3) {
        objPositions.push(parts.slice(0, 3).map(parseFloat));
        objColors.push(parts.slice(3).map(parseFloat));
      } else {
        objPositions.push(parts.map(parseFloat));
      }
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,    // smoothing group
    mtllib(parts) {
      materialLibs.push(parts.join(' '));
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);
      continue;
    }
    handler(parts, unparsedArgs);
  }

  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}

function parseMapArgs(unparsedArgs) {
  return unparsedArgs;
}

function parseMTL(text) {
  const materials = {};
  let material;

  const keywords = {
    newmtl(parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },
    Ns(parts)       { material.shininess      = parseFloat(parts[0]); },
    Ka(parts)       { material.ambient        = parts.map(parseFloat); },
    Kd(parts)       { material.diffuse        = parts.map(parseFloat); },
    Ks(parts)       { material.specular       = parts.map(parseFloat); },
    Ke(parts)       { material.emissive       = parts.map(parseFloat); },
    map_Kd(parts, unparsedArgs)   { material.diffuseMap = parseMapArgs(unparsedArgs); },
    map_Ns(parts, unparsedArgs)   { material.specularMap = parseMapArgs(unparsedArgs); },
    map_Bump(parts, unparsedArgs) { material.normalMap = parseMapArgs(unparsedArgs); },
    Ni(parts)       { material.opticalDensity = parseFloat(parts[0]); },
    d(parts)        { material.opacity        = parseFloat(parts[0]); },
    illum(parts)    { material.illum          = parseInt(parts[0]); },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword); 
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return materials;
}