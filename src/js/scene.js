// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  Scene,
  AmbientLight,
  AmbientLightProbe,
  PointLight,
  DirectionalLight,
  CameraHelper
} from "three";
import {
  component
} from "bidello";
// import Cube from './cube/cube';
import Corrente from "./corrente/corrente";
import camera from "./camera";
import settings from './settings'

const c = settings.count;

class Stage extends component(Scene) {
  init() {
    // this.add(new Cube());
    this.add(new AmbientLightProbe());

    const directional = new DirectionalLight(0xfff, 20);
    directional.castShadow = true;
    directional.position.set((c / 2) + 10, 10, 0)
    directional.shadow.mapSize.width = settings.shadowmap; // default
    directional.shadow.mapSize.height = settings.shadowmap; // default
    directional.shadow.camera.near = 1; // default
    directional.shadow.camera.far = c + 13; // default
    directional.shadow.camera.left = -((c / 2) + 5); // default
    directional.shadow.camera.right = (c / 2) + 5; // default
    directional.shadow.camera.top = 13; // default
    directional.shadow.camera.bottom = -13; // default
    // directional.shadow.bias = 0.001;
    // directional.shadow.normalBias = 0.01;


    // var helper = new CameraHelper(directional.shadow.camera);
    // this.add(helper);

    // directional.target.position.set(100, 5, 0);

    this.add(directional);
    // this.add(directional.target);

    // const point = new PointLight(0xfff, 30, 100);
    // point.position.y = 30;
    // this.add(point);
    this.add(new Corrente());
    this.add(camera);
  }
}

export default new Stage();