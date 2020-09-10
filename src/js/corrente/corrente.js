import {
  Object3D,
  InstancedMesh,
  ShaderMaterial,
  Matrix4,
  InstancedBufferAttribute,
  LinearFilter,
  MeshStandardMaterial,
} from "three";

import { component } from "bidello";
// import MagicShader from 'magicshader';
// import trail from '/js/utils/trail';

import FBO from "../utils/fbo";
import Capsule from "./Capsule";

export default class extends component(Object3D) {
  init() {
    this.initFBO();

    this.geometry = new Capsule(
      0.3, // radius top
      0.3, // radius bottom
      6.6, // height
      7, // radial segments
      4, // height segment
      8, // cap top segments
      1 // cap bottom segments
    );

    this.uniforms = {};

    this.material = new MeshStandardMaterial({
      color: 0x2194ce,
      emissive: 0x000000,
      onBeforeCompile: (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          "#include <common>",
          `
            #include <common>
            uniform highp sampler2D uWind;
            attribute vec2 ids;

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
          
        `
        );

        shader.vertexShader = shader.vertexShader.replace(
          "#include <project_vertex>",
          `

            // transformed.y += texture2D(uWind, ids).r * 20.0;
            // transformed.y += ids.x * 1.0;

            float force = texture2D(uWind, ids).r * 3.14;

            force += transformed.y * 0.01;

            transformed.y += 3.3;
            transformed.xyz = (rotationMatrix(vec3(1.0, 1.0, 0.0), force) * vec4(transformed, 1.0)).xyz;
            transformed.y -= 3.3;

            #include <project_vertex>
          `
        );

        this.uniforms = shader.uniforms;
        shader.uniforms.uWind = { value: this.fbo.target };
      },
    });

    const count = 128 * 128;
    const ids = [];

    for (let j = 0; j < 128; j++) {
      for (let k = 0; k < 128; k++) {
        ids.push(j / 128);
        ids.push(k / 128);
      }
    }

    this.geometry.setAttribute(
      "ids",
      new InstancedBufferAttribute(new Float32Array(ids), 2)
    );

    this.mesh = new InstancedMesh(this.geometry, this.material, count);

    const matrix = new Matrix4();

    let i = 0;
    for (let j = 0; j < 128; j++) {
      for (let k = 0; k < 128; k++) {
        matrix.setPosition(j + Math.random(), 0, k + Math.random());
        this.mesh.setMatrixAt(i, matrix);
        i++;
      }
    }

    // let radius = 1;
    // let n = 5;
    // let tmp = 0;

    // for (let i = 0; i < count; i++) {
    //   const matrix = new Matrix4();
    //   const x = radius * Math.cos(i * ((2 * Math.PI) / n));
    //   const y = radius * Math.sin(i * ((2 * Math.PI) / n));

    //   matrix.setPosition(x, 0, y);
    //   this.mesh.setMatrixAt(i, matrix);

    //   tmp++;
    //   if (tmp > n) {
    //     radius += 1;
    //     n = parseInt(radius * 1.0);
    //     tmp = 0;
    //   }
    // }

    // this.mesh = new Mesh(this.geometry, this.material);

    this.add(this.mesh);
    this.mesh.position.x -= 64;
    this.mesh.position.z -= 64;
  }

  initFBO() {
    this.fbo = new FBO({
      width: 256,
      height: 256,
      name: "wind",
      // debug: true,
      uniforms: {
        uTime: { value: 0 },
      },
      shader: /* glsl */ `
        precision highp float;
        uniform sampler2D texture;
        uniform float uTime;

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

        void main() {
          vec2 uv = gl_FragCoord.xy / RESOLUTION.xy;
          vec4 old = texture2D(texture, uv);
          vec4 new = old;

          uv *= 1.5;
          float noise = snoise(vec3(uv.x, uv.y, uTime * 0.1));
          
          new.r += noise * 0.1;
          new = mix(new, vec4(0.0), .1);
          new.w = 1.0;

          gl_FragColor = new;
        }
      `,
      // rtOptions: {
      //   minFilter: LinearFilter,
      //   magFilter: LinearFilter,
      // },
    });
  }

  onRaf({ delta }) {
    if (this.fbo) {
      this.fbo.uniforms.uTime.value += delta;
      this.fbo.update();

      // if (this.uniforms.uWind) {
      //   this.uniforms.uWind.value = this.fbo.target;
      //   this.uniforms.uWind.value.needsUpdate = true;
      // }
    }
  }
}
