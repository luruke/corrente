// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Scene, AmbientLight, PointLight } from "three";
import { component } from "bidello";
// import Cube from './cube/cube';
import Corrente from "./corrente/corrente";
import camera from "./camera";

class Stage extends component(Scene) {
  init() {
    // this.add(new Cube());
    this.add(new AmbientLight());
    const point = new PointLight(0xfff, 30, 100);
    point.position.y = 30;
    this.add(point);
    this.add(new Corrente());
    this.add(camera);
  }
}

export default new Stage();
