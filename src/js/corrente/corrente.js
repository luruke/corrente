import {
  Object3D,
  BoxBufferGeometry,
  Mesh,
  RawShaderMaterial,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Matrix4,
} from 'three';

import {
  component
} from 'bidello';
// import MagicShader from 'magicshader';
// import trail from '/js/utils/trail';

import Capsule from './Capsule';

export default class extends component(Object3D) {
  init() {
    this.geometry = new Capsule(1, 0.8, 6.6, 5, 2, 5, 3)
    this.material = new MeshStandardMaterial({
      // wireframe: true,
      color: 0xff0000,
      emissive: 0x000
    })
    // this.material = new RawShaderMaterial({
    //   vertexShader: `
    //     precision highp float;

    //     // attribute vec3 normal;
    //     attribute vec3 position;

    //     // uniform mat3 normalMatrix;
    //     uniform mat4 modelMatrix;
    //     uniform mat4 viewMatrix;
    //     uniform mat4 modelViewMatrix;
    //     uniform mat4 projectionMatrix;

    //     void main() {
    //       vec4 pos = modelViewMatrix * vec4(position, 1.0);

    //       gl_Position = projectionMatrix * viewMatrix * pos;
    //     }
    //   `,
    //   fragmentShader: `
    //     precision highp float;

    //     void main() {
    //       gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    //     }
    //   `
    // })


    // this.geometry = new InstancedBufferGeometry()

    // // var attribute = new THREE.BufferAttribute(new Float32Array(blueprint), 3);
    // this.geometry.setAttribute('position', capsule.getAttribute('position'));

    // const t = new Float32Array(3)
    // t[0] = 0
    // t[1] = 0
    // t[2] = 0
    // this.geometry.setAttribute('translation', new InstancedBufferAttribute(t, 3));


    const count = 128 * 128;
    const matrix = new Matrix4();
    this.mesh = new InstancedMesh(this.geometry, this.material, count);


    let radius = 3
    let n = 5
    let tmp = 0

    for (let i = 0; i < count; i++) {
      const x = radius * Math.cos(i * (2 * Math.PI / n))
      const y = radius * Math.sin(i * (2 * Math.PI / n))

      matrix.setPosition(x, 0, y);
      this.mesh.setMatrixAt(i, matrix)

      tmp++;
      if (tmp > n) {
        radius += 4;
        n = radius * 0.9;
        tmp = 0;
      }
    }


    // this.mesh = new Mesh(this.geometry, this.material);

    this.add(this.mesh);
  }

  onRaf({
    delta
  }) {
    // this.mesh.rotation.x += 0.3 * delta;
    // this.mesh.rotation.y += 0.3 * delta;
    // this.material.uniforms.uTrail.value = trail.target;
  }
}