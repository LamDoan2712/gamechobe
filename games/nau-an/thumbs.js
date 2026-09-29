// thumbs.js — chụp ảnh các món đã nấu xong (final()) bằng một bộ vẽ 3D phụ, nền trong suốt, dùng cho sổ món & thẻ giới thiệu.

import { THREE } from '../../kit/three-kit.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const cache = {};
export function dishThumbs(list, size = 320) {
  const todo = list.filter(d => !cache[d.id]);
  if (todo.length) {
    let r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
    catch (e) { return cache; }
    r.setPixelRatio(1); r.setSize(size, size, false); r.outputColorSpace = THREE.SRGBColorSpace; r.setClearColor('#FFF4E6', 1);
    const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(r);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
    scene.add(new THREE.HemisphereLight('#FFF3E6', '#E8B894', 0.9));
    const sun = new THREE.DirectionalLight('#FFF1DC', 2.1); sun.position.set(4, 9, 6); scene.add(sun);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const box = new THREE.Box3(), sph = new THREE.Sphere();
    todo.forEach(d => {
      let obj;
      try { obj = d.make(); } catch (e) { console.error(e); return; }
      scene.add(obj); obj.updateMatrixWorld(true);
      box.setFromObject(obj); box.getBoundingSphere(sph);
      const dist = sph.radius / Math.sin(THREE.MathUtils.degToRad(15)) * 0.82, el = 0.72;
      cam.position.set(sph.center.x, sph.center.y + Math.sin(el) * dist, sph.center.z + Math.cos(el) * dist); cam.lookAt(sph.center);
      r.render(scene, cam);
      cache[d.id] = r.domElement.toDataURL('image/jpeg', 0.88);
      scene.remove(obj); obj.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    });
    scene.environment.dispose(); pm.dispose(); r.dispose(); try { r.forceContextLoss(); } catch (e) {}
  }
  return cache;
}
