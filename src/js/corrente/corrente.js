import {
  Object3D,
  InstancedMesh,
  ShaderMaterial,
  Matrix4,
  InstancedBufferAttribute,
  LinearFilter,
  MeshStandardMaterial,
  Plane,
  Vector3,
  Raycaster,
  MeshDepthMaterial,
  RGBADepthPacking,
} from "three";

import {
  component
} from "bidello";
// import MagicShader from 'magicshader';
// import trail from '/js/utils/trail';

import settings from '../settings'

import FBO from "../utils/fbo";
import Capsule from "./Capsule";
import camera from "../camera";

const GRID = settings.count;

export default class extends component(Object3D) {
  init() {
    this.initPlane();
    this.initFBO();

    this.geometry = new Capsule(
      0.25, // radius top
      0.2, // radius bottom
      6.6, // height
      7, // radial segments
      6, // height segment
      4, // cap top segments
      1 // cap bottom segments
    );

    // this.uniforms = {};

    this.material = new MeshStandardMaterial({
      // transparent: true,
      color: 0x2194ce,
      emissive: 0x000000,
      roughness: 0,
      metalness: 0,
      onBeforeCompile: (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          "#include <common>",
          `
            #include <common>
            uniform highp sampler2D uWind;
            attribute vec2 ids;

            varying vec2 vUv;

            mat4 rotationMatrix(vec3 axis, float angle) {
              axis = normalize(axis);
              float s = sin(angle);
              float c = cos(angle);
              float oc = 1.0 - c;
              
              return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                          oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                          oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                          0.0,                                0.0,                                0.0,                                1.0);
          }

          #ifndef HALF_PI
            # define HALF_PI 1.5707963267948966
          # endif

          float sineOut(float t) {
            return sin(t * HALF_PI);
          }
        `
        );

        shader.vertexShader = shader.vertexShader.replace(
          "#include <project_vertex>",
          `

            vUv = uv;

            vec4 data = texture2D(uWind, ids);
            float force = data.r * (3.14 / 2.0);
            float forcePointer = data.g;

            force += sineOut(uv.y) * 0.5;

            transformed.y += 3.3;
            transformed.xyz = (rotationMatrix(vec3(1.0, 1.0, 1.0), force) * vec4(transformed, 1.0)).xyz;
            transformed.xyz = (rotationMatrix(vec3(1.0, 1.0, 0.0), forcePointer) * vec4(transformed, 1.0)).xyz;
            transformed.y -= 3.3;

            #include <project_vertex>
          `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `
            #include <common>
            varying vec2 vUv;
        `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          "	#include <dithering_fragment>",
          `
            #include <dithering_fragment>
            gl_FragColor.a *= smoothstep(0.0, 0.35, vUv.y);
            gl_FragColor.rgb *= smoothstep(0.0, 0.95, vUv.y);
        `
        );


        shader.uniforms.uWind = {
          value: this.fbo.target
        };
        this.shader = shader;

        // this.uniforms = shader.uniforms;
        // this.asda = shader.uniforms.uWind;
      },
    });

    const count = GRID * GRID;
    const ids = [];

    for (let j = 0; j < GRID; j++) {
      for (let k = 0; k < GRID; k++) {
        ids.push(j / GRID);
        ids.push(k / GRID);
      }
    }

    this.geometry.setAttribute(
      "ids",
      new InstancedBufferAttribute(new Float32Array(ids), 2)
    );

    this.mesh = new InstancedMesh(this.geometry, this.material, count);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new MeshDepthMaterial({
      depthPacking: RGBADepthPacking,
      onBeforeCompile: (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          "#include <common>",
          `
            #include <common>
            uniform highp sampler2D uWind;
            attribute vec2 ids;

            varying vec2 vUv;

            mat4 rotationMatrix(vec3 axis, float angle) {
              axis = normalize(axis);
              float s = sin(angle);
              float c = cos(angle);
              float oc = 1.0 - c;

              return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                          oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                          oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                          0.0,                                0.0,                                0.0,                                1.0);
          }

          #ifndef HALF_PI
            # define HALF_PI 1.5707963267948966
          # endif

          float sineOut(float t) {
            return sin(t * HALF_PI);
          }
        `
        );

        shader.vertexShader = shader.vertexShader.replace(
          "#include <project_vertex>",
          `

            vUv = uv;

            vec4 data = texture2D(uWind, ids);
            float force = data.r * (3.14 / 2.0);
            float forcePointer = data.g;

            force += sineOut(uv.y) * 0.5;

            transformed.y += 3.3;
            transformed.xyz = (rotationMatrix(vec3(1.0, 1.0, 1.0), force) * vec4(transformed, 1.0)).xyz;
            transformed.xyz = (rotationMatrix(vec3(1.0, 1.0, 0.0), forcePointer) * vec4(transformed, 1.0)).xyz;
            transformed.y -= 3.3;

            #include <project_vertex>
          `
        );

        shader.uniforms.uWind = {
          value: this.fbo.target
        };
        this.shaderShadow = shader;
      }
    });

    const matrix = new Matrix4();

    let i = 0;
    for (let j = 0; j < GRID; j++) {
      for (let k = 0; k < GRID; k++) {
        matrix.setPosition(j + Math.random(), 0, k + Math.random());
        this.mesh.setMatrixAt(i, matrix);
        i++;
      }
    }

    this.add(this.mesh);
    this.mesh.position.x -= GRID / 2;
    this.mesh.position.z -= GRID / 2;
  }

  initFBO() {
    this.fbo = new FBO({
      width: GRID,
      height: GRID,
      name: "wind",
      // debug: true,
      uniforms: {
        uTime: {
          value: 0
        },
        uPointer: {
          value: this.target
        },
      },
      shader: /* glsl */ `
        precision highp float;
        uniform sampler2D texture;
        uniform float uTime;
        uniform vec3 uPointer;

        //	Simplex 3D Noise 
        //	by Ian McEwan, Ashima Arts
        //
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        
        float snoise(vec3 v){ 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        
        // First corner
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;
        
        // Other corners
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
        
          //  x0 = x0 - 0. + 0.0 * C 
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1. + 3.0 * C.xxx;
        
        // Permutations
          i = mod(i, 289.0 ); 
          vec4 p = permute( permute( permute( 
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        
        // Gradients
        // ( N*N points uniformly over a square, mapped onto an octahedron.)
          float n_ = 1.0/7.0; // N=7
          vec3  ns = n_ * D.wyz - D.xzx;
        
          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)
        
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
        
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
        
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
        
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
        
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
        
        //Normalise gradients
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
        
        // Mix final noise value
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
          uv -= disc_center;
          float dist = sqrt(dot(uv, uv));
          return smoothstep(disc_radius+border_size, disc_radius-border_size, dist);
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / RESOLUTION.xy;
          vec4 old = texture2D(texture, uv);
          vec4 new = old;

          uv *= RESOLUTION.x * 0.02;
          float noise = snoise(vec3(uv.x, uv.y, uTime * 0.1));
          
          new.r += noise * 0.1;
          new.g += circle(gl_FragCoord.xy, vec2(uPointer.x, uPointer.z) + (vec2(RESOLUTION) / 2.0), RESOLUTION.x * 0.1, RESOLUTION.x * 0.06) * 0.5;

          new.r = mix(new.r, 0.0, .1);
          new.g = mix(new.g, 0.0, .04);
          new.w = 1.0;

          gl_FragColor = new;
        }
      `,
      rtOptions: {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
      },
    });
  }

  initPlane() {
    this.plane = new Plane(new Vector3(0, 1, 0), 0);
    this.raycaster = new Raycaster();
    this.target = new Vector3(10000, 10000, 10000);
  }

  onPointerMove({
    pointer
  }) {
    this.raycaster.setFromCamera(pointer.normalized, camera);
    this.raycaster.ray.intersectPlane(this.plane, this.target);
  }

  onRaf({
    delta
  }) {
    if (this.fbo) {
      this.fbo.uniforms.uTime.value += delta;
      this.fbo.update();

      if (this.shader) {
        this.shader.uniforms.uWind.value = this.fbo.target;
      }
      if (this.shaderShadow) {
        this.shaderShadow.uniforms.uWind.value = this.fbo.target;
      }
    }
  }
}