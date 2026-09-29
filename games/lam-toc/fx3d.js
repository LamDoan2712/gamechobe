// fx3d.js — hiệu ứng 3D dùng InstancedMesh (giới hạn số lượng, không cấp phát khi đang chơi):
// bọt xà phòng dính trên tóc, giọt nước, hơi nước, mẩu tóc vụn, và mẩu tóc bị cắt rơi xuống rồi mờ dần.

import { THREE, toon, toonGradient } from '../../kit/three-kit.js';
import { makeLockGeometry } from './hair.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();

/* ——— hạt rơi/bay chung ——— */
export class Particles {
  // o: { grav, drag, grow (tỉ lệ phồng theo tuổi), spin, colored }
  constructor(parent, geo, mat, max, o = {}) {
    this.o = Object.assign({ grav: -9, drag: 0.6, grow: 0, spin: 0 }, o);
    this.max = max; this.n = 0;
    const mesh = this.mesh = new THREE.InstancedMesh(geo, mat, max);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.frustumCulled = false;
    if (o.colored) { mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage); }
    this.p = new Float32Array(max * 3); this.v = new Float32Array(max * 3); this.r = new Float32Array(max * 3); this.vr = new Float32Array(max * 3);
    this.age = new Float32Array(max); this.ttl = new Float32Array(max); this.size = new Float32Array(max);
    parent.add(mesh);
  }
  spawn(x, y, z, vx, vy, vz, ttl, size, hex) {
    const i = this.n < this.max ? this.n++ : Math.floor(Math.random() * this.max);
    const i3 = i * 3;
    this.p[i3] = x; this.p[i3 + 1] = y; this.p[i3 + 2] = z; this.v[i3] = vx; this.v[i3 + 1] = vy; this.v[i3 + 2] = vz;
    this.age[i] = 0; this.ttl[i] = ttl; this.size[i] = size;
    const sp = this.o.spin;
    this.r[i3] = Math.random() * 6; this.r[i3 + 1] = Math.random() * 6; this.r[i3 + 2] = Math.random() * 6;
    this.vr[i3] = (Math.random() - 0.5) * sp; this.vr[i3 + 1] = (Math.random() - 0.5) * sp; this.vr[i3 + 2] = (Math.random() - 0.5) * sp;
    if (this.mesh.instanceColor) {
      if (hex != null) _c.set(hex); else _c.setRGB(1, 1, 1);
      const a = this.mesh.instanceColor.array; a[i3] = _c.r; a[i3 + 1] = _c.g; a[i3 + 2] = _c.b; this.mesh.instanceColor.needsUpdate = true;
    }
  }
  update(dt) {
    if (!this.n && !this.mesh.count) return;
    const o = this.o, P = this.p, V = this.v, R = this.r, VR = this.vr, drag = Math.max(0, 1 - o.drag * dt);
    let i = 0;
    while (i < this.n) {
      this.age[i] += dt;
      if (this.age[i] >= this.ttl[i]) { this._kill(i); continue; }
      const i3 = i * 3;
      V[i3 + 1] += o.grav * dt; V[i3] *= drag; V[i3 + 1] *= drag; V[i3 + 2] *= drag;
      P[i3] += V[i3] * dt; P[i3 + 1] += V[i3 + 1] * dt; P[i3 + 2] += V[i3 + 2] * dt;
      R[i3] += VR[i3] * dt; R[i3 + 1] += VR[i3 + 1] * dt; R[i3 + 2] += VR[i3 + 2] * dt;
      const k = this.age[i] / this.ttl[i];
      // phồng lên rồi teo lại ở cuối đời để "mờ dần"
      const sc = this.size[i] * (1 + o.grow * k) * Math.min(1, (1 - k) * 4) * Math.min(1, this.age[i] * 12 + 0.2);
      _e.set(R[i3], R[i3 + 1], R[i3 + 2]); _q.setFromEuler(_e); _p.set(P[i3], P[i3 + 1], P[i3 + 2]); _s.set(sc, sc, sc);
      _m.compose(_p, _q, _s); this.mesh.setMatrixAt(i, _m);
      i++;
    }
    this.mesh.count = this.n; this.mesh.instanceMatrix.needsUpdate = true;
  }
  _kill(i) {
    const j = --this.n;
    if (i !== j) {
      const i3 = i * 3, j3 = j * 3;
      for (let q = 0; q < 3; q++) { this.p[i3 + q] = this.p[j3 + q]; this.v[i3 + q] = this.v[j3 + q]; this.r[i3 + q] = this.r[j3 + q]; this.vr[i3 + q] = this.vr[j3 + q]; }
      this.age[i] = this.age[j]; this.ttl[i] = this.ttl[j]; this.size[i] = this.size[j];
      if (this.mesh.instanceColor) { const a = this.mesh.instanceColor.array; a[i3] = a[j3]; a[i3 + 1] = a[j3 + 1]; a[i3 + 2] = a[j3 + 2]; this.mesh.instanceColor.needsUpdate = true; }
    }
  }
  clear() { this.n = 0; this.mesh.count = 0; }
}

/* ——— bọt xà phòng dính trên tóc (con của doll.head để quay theo đầu) ——— */
export class Foam {
  constructor(parent, max = 150) {
    this.max = max; this.n = 0; this.t = 0;
    const geo = new THREE.SphereGeometry(1, 14, 10);
    const mat = toon('#FFFFFF', { emissive: '#DDF1FF', emissiveIntensity: 0.35 });
    const mesh = this.mesh = new THREE.InstancedMesh(geo, mat, max);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; mesh.frustumCulled = false; mesh.renderOrder = 1;
    this.p = new Float32Array(max * 3); this.size = new Float32Array(max); this.age = new Float32Array(max);
    this.lock = new Int16Array(max); this.s = new Float32Array(max);
    parent.add(mesh);
  }
  get count() { return this.n; }
  add(x, y, z, size, lock, s) {
    if (this.n >= this.max) {
      // đầy rồi: làm một bong bóng bất kỳ phồng to thêm chút
      const i = Math.floor(Math.random() * this.n); this.size[i] = Math.min(0.2, this.size[i] * 1.06); return false;
    }
    const i = this.n++, i3 = i * 3;
    this.p[i3] = x; this.p[i3 + 1] = y; this.p[i3 + 2] = z; this.size[i] = size; this.age[i] = 0; this.lock[i] = lock; this.s[i] = s;
    return true;
  }
  _kill(i) {
    const j = --this.n;
    if (i !== j) {
      const i3 = i * 3, j3 = j * 3;
      this.p[i3] = this.p[j3]; this.p[i3 + 1] = this.p[j3 + 1]; this.p[i3 + 2] = this.p[j3 + 2];
      this.size[i] = this.size[j]; this.age[i] = this.age[j]; this.lock[i] = this.lock[j]; this.s[i] = this.s[j];
    }
  }
  // Xoá bọt gần điểm p (và dọc tia o→d); cb(x,y,z) được gọi cho mỗi bong bóng bị xoá (toạ độ đầu)
  removeNear(p, r, o, d, rRay, maxN, cb) {
    let k = 0, i = 0;
    while (i < this.n && k < maxN) {
      const i3 = i * 3, x = this.p[i3], y = this.p[i3 + 1], z = this.p[i3 + 2];
      let hit = p && (x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) + (z - p.z) * (z - p.z) < r * r;
      if (!hit && o) {
        const wx = x - o.x, wy = y - o.y, wz = z - o.z, t = wx * d.x + wy * d.y + wz * d.z;
        hit = wx * wx + wy * wy + wz * wz - t * t < rRay * rRay;
      }
      if (hit) { if (cb) cb(x, y, z); this._kill(i); k++; } else i++;
    }
    return k;
  }
  removeRandom(cb) {
    if (!this.n) return false;
    const i = Math.floor(Math.random() * this.n), i3 = i * 3;
    if (cb) cb(this.p[i3], this.p[i3 + 1], this.p[i3 + 2]);
    this._kill(i); return true;
  }
  // bỏ bọt nằm trên phần tóc vừa bị cắt
  removeLockBeyond(lock, s, cb) {
    let i = 0;
    while (i < this.n) { if (this.lock[i] === lock && this.s[i] > s) { const i3 = i * 3; if (cb) cb(this.p[i3], this.p[i3 + 1], this.p[i3 + 2]); this._kill(i); } else i++; }
  }
  clear() { this.n = 0; this.mesh.count = 0; }
  update(dt) {
    this.t += dt;
    if (!this.n && !this.mesh.count) return;
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      const i3 = i * 3, pop = Math.min(1, this.age[i] * 6), wob = 1 + 0.07 * Math.sin(this.t * 4 + i * 1.7);
      const sc = this.size[i] * (pop < 1 ? pop * (1.25 - 0.25 * pop) : 1) * wob;
      _p.set(this.p[i3], this.p[i3 + 1], this.p[i3 + 2]); _s.set(sc, sc * (2 - wob), sc);
      _m.compose(_p, _q.identity(), _s); this.mesh.setMatrixAt(i, _m);
    }
    this.mesh.count = this.n; this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/* ——— mẩu tóc bị cắt: rơi theo trọng lực, xoay nhẹ, mờ dần ——— */
export class Pieces {
  constructor(scene, hair, n = 4) {
    this.hair = hair; this.list = [];
    for (let i = 0; i < n; i++) {
      const geo = makeLockGeometry();
      const mat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGradient(), transparent: true, emissive: 0xffffff, emissiveIntensity: 0.14, emissiveMap: hair.shine });
      const mesh = new THREE.Mesh(geo, mat); mesh.visible = false; mesh.frustumCulled = false;
      scene.add(mesh);
      this.list.push({ mesh, geo, mat, t: 1, vel: new THREE.Vector3(), spin: new THREE.Vector3() });
    }
    this.k = 0; this._ref = new THREE.Vector3(); this._m2 = new THREE.Matrix4();
  }
  spawn(lk, oldLen, sCutAxis, head) {
    const pc = this.list[this.k]; this.k = (this.k + 1) % this.list.length;
    this.hair.buildPiece(lk, oldLen, sCutAxis, pc.geo, this._ref);
    _m.copy(head.matrixWorld).multiply(this._m2.makeTranslation(this._ref.x, this._ref.y, this._ref.z));
    _m.decompose(pc.mesh.position, pc.mesh.quaternion, pc.mesh.scale);
    pc.mat.color.copy(lk.mat.color); pc.mat.opacity = 1; pc.mesh.visible = true; pc.t = 0;
    pc.vel.set((Math.random() - 0.5) * 1.2, 0.6 + Math.random() * 0.6, 0.8 + Math.random() * 0.6);
    pc.spin.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 5);
    return pc.mesh.position;
  }
  update(dt) {
    for (const pc of this.list) {
      if (!pc.mesh.visible) continue;
      pc.t += dt;
      pc.vel.y -= 7 * dt;
      pc.mesh.position.addScaledVector(pc.vel, dt);
      pc.mesh.rotation.x += pc.spin.x * dt; pc.mesh.rotation.y += pc.spin.y * dt; pc.mesh.rotation.z += pc.spin.z * dt;
      pc.mat.opacity = Math.max(0, 1 - Math.max(0, pc.t - 0.5) / 0.7);
      if (pc.t > 1.2) pc.mesh.visible = false;
    }
  }
  clear() { this.list.forEach(pc => { pc.mesh.visible = false; }); }
}
