// salon.js — cảnh 3D của tiệm tóc: tường pastel, gương tròn có bóng đèn, kệ đồ, dây cờ, ghế xoay, áo choàng,
// khách hàng (búp bê dùng chung createDoll) với tóc, tai thú, phụ kiện; khung máy quay và chụp ảnh.

import { THREE, toon, canvasTexture, shadowCatcher, createDoll, RoundedBoxGeometry } from '../../kit/three-kit.js';
import { Hair, CAPE, HEAD_Y } from './hair.js';
import { Accessories, AnimalEars } from './accessories.js';
import { Foam, Particles, Pieces } from './fx3d.js';
import { CUSTOMERS } from './data.js';

const basic = (color, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color }, o));

function buildRoom(scene) {
  const room = new THREE.Group(); room.name = 'room'; scene.add(room);
  // tường sọc kẹo hồng
  const wallTex = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#FFE6F0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFD9E8'; g.fillRect(0, 0, w / 2, h);
    g.fillStyle = 'rgba(255,255,255,.7)';
    [[w * 0.25, h * 0.25], [w * 0.75, h * 0.75]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); });
  });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(16, 7);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 18), basic(0xffffff, { map: wallTex })); wall.position.set(0, 7, -6); room.add(wall);
  const wain = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.5), basic('#CFF0E7')); wain.position.set(0, 1.0, -5.97); room.add(wain);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(40, 0.2, 0.12), basic('#FFFFFF')); trim.position.set(0, 2.25, -5.94); room.add(trim);
  // sàn ca rô
  const floorTex = canvasTexture(64, 64, (g, w, h) => { g.fillStyle = '#FFF4F8'; g.fillRect(0, 0, w, h); g.fillStyle = '#FFDDEB'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(14, 14); floorTex.magFilter = THREE.NearestFilter;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), basic(0xffffff, { map: floorTex })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.01, 8); room.add(floor);
  const sc = shadowCatcher(14, 0.16); sc.position.y = 0.005; room.add(sc);

  // gương tròn có viền bóng đèn (như vầng hào quang sau đầu khách)
  const mirror = new THREE.Group(); mirror.position.set(0, 3.6, -4.8); room.add(mirror);
  const glassTex = canvasTexture(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w * 0.4, h); gr.addColorStop(0, '#EAF6FF'); gr.addColorStop(1, '#F6E8FF'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.save(); g.translate(w * 0.3, h * 0.28); g.rotate(-0.7);
    g.beginPath(); g.roundRect(-70, -9, 140, 18, 9); g.fill(); g.beginPath(); g.roundRect(-40, 18, 80, 10, 5); g.fill(); g.restore();
  });
  const glass = new THREE.Mesh(new THREE.CircleGeometry(3.05, 64), basic(0xffffff, { map: glassTex })); mirror.add(glass);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.24, 16, 90), toon('#FFB3CF')); frame.position.z = 0.02; mirror.add(frame);
  const bulbGeo = new THREE.SphereGeometry(0.15, 14, 10), bulbMat = basic('#FFF1A0');
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const b = new THREE.Mesh(bulbGeo, bulbMat); b.position.set(Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0.22); mirror.add(b); }

  // kệ đồ hai bên với chai dầu gội và chậu cây
  const shelfGeo = new RoundedBoxGeometry(2.2, 0.16, 0.7, 2, 0.06), shelfMat = toon('#FFFFFF');
  const bottleGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.62, 18), capGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.16, 12), pumpGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8);
  const cols = ['#FF9EC4', '#9FDCEB', '#FFD37A', '#C9B3F5', '#8FE0C4', '#FFB38A'];
  const potGeo = new THREE.CylinderGeometry(0.32, 0.24, 0.5, 18), leafGeo = new THREE.SphereGeometry(0.3, 14, 10);
  [-1, 1].forEach(side => {
    const x0 = side * 5.4;
    [1.9, 3.5, 5.1].forEach((y, row) => {
      const sh = new THREE.Mesh(shelfGeo, shelfMat); sh.position.set(x0, y, -5.4); room.add(sh);
      if (row === 2) {
        const pot = new THREE.Mesh(potGeo, toon('#FFB38A')); pot.position.set(x0 + side * 0.3, y + 0.33, -5.3); room.add(pot);
        [[0, 0.55, 0], [-0.25, 0.42, 0.05], [0.25, 0.45, -0.05], [0, 0.8, 0]].forEach(([dx, dy, dz], k) => {
          const lf = new THREE.Mesh(leafGeo, toon(k % 2 ? '#7FD8A0' : '#62CC7A')); lf.position.set(x0 + side * 0.3 + dx, y + dy + 0.2, -5.3 + dz); lf.scale.set(1, 0.8, 1); room.add(lf);
        });
        return;
      }
      for (let k = 0; k < 3; k++) {
        const c = cols[(k + row * 3 + (side > 0 ? 1 : 0)) % cols.length], bx = x0 - 0.65 + k * 0.65;
        const b = new THREE.Mesh(bottleGeo, toon(c)); b.position.set(bx, y + 0.39, -5.3); b.scale.y = 0.8 + ((k + row) % 3) * 0.18; room.add(b);
        const cp = new THREE.Mesh(capGeo, toon('#FFFFFF')); cp.position.set(bx, y + 0.39 + 0.31 * b.scale.y + 0.06, -5.3); room.add(cp);
        if (k === 1) { const pm = new THREE.Mesh(pumpGeo, toon('#FFFFFF')); pm.position.set(bx, cp.position.y + 0.16, -5.3); room.add(pm); }
      }
    });
  });

  // dây cờ đuôi nheo
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = -9 + 18 * t; pts.push(new THREE.Vector3(x, 7.6 - Math.sin(t * Math.PI) * 0.9, -4.4)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  room.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.03, 5), basic('#FFFFFF')));
  const flagGeo = new THREE.ConeGeometry(0.34, 0.62, 3); flagGeo.rotateX(Math.PI); flagGeo.rotateY(Math.PI / 6);
  const flagCols = ['#FF9EC4', '#FFD37A', '#9FDCEB', '#C9B3F5', '#8FE0C4'].map(c => basic(c));
  for (let i = 0; i < 24; i++) {
    const t = (i + 0.5) / 24, p = curve.getPoint(t);
    const f = new THREE.Mesh(flagGeo, flagCols[i % flagCols.length]); f.position.set(p.x, p.y - 0.3, p.z); f.scale.z = 0.25; room.add(f);
  }
  return room;
}

function buildChair() {
  const g = new THREE.Group(); g.name = 'chair';
  const pink = toon('#FFA6C9'), dark = toon('#F07AAA'), light = toon('#FFC2DA');
  const back = new THREE.Mesh(new RoundedBoxGeometry(4.1, 2.2, 0.4, 5, 0.2), pink); back.position.set(0, 1.6, -1.85); back.castShadow = true; g.add(back);
  const roll = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 3.7, 8, 20), light); roll.rotation.z = Math.PI / 2; roll.position.set(0, 2.75, -1.8); roll.castShadow = true; g.add(roll);
  const btn = new THREE.SphereGeometry(0.075, 12, 8);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
    const b = new THREE.Mesh(btn, dark); b.position.set(-1.6 + c * 0.8 + (r % 2) * 0.4, 1.95 - r * 0.6, -1.64); b.scale.z = 0.5; g.add(b);
  }
  return g;
}

function dotsTexture() {
  const t = canvasTexture(64, 64, (g, w, h) => {
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0)';
    g.fillStyle = '#E4E4E4'; [[16, 16], [48, 48]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); });
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 3);
  return t;
}

export function buildSalon(stage) {
  const { scene, camera } = stage;
  buildRoom(scene);
  const turn = new THREE.Group(); turn.name = 'turn'; scene.add(turn);
  scene.add(buildChair());
  const doll = createDoll({ face: { lashes: true } });
  turn.add(doll.root);
  // áo choàng làm tóc (hình chuông, chấm bi)
  const capeMat = toon('#9FDCEB', { map: dotsTexture() });
  const lathe = new THREE.LatheGeometry(CAPE.slice().reverse().map(([r, y]) => new THREE.Vector2(r, y)), 56);
  const cape = new THREE.Mesh(lathe, capeMat); cape.castShadow = true; doll.body.add(cape);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.07, 10, 40), toon('#FFFFFF')); collar.rotation.x = Math.PI / 2; collar.position.y = 2.24; doll.body.add(collar);
  // tai người (ẩn khi khách có tai thú)
  doll.legs.forEach(l => { l.pivot.visible = false; }); // luôn ngồi dưới áo choàng
  const humanEars = doll.head.children.filter(o => o.isMesh && o !== doll.skull && Math.abs(Math.abs(o.position.x) - 1.04) < 0.01);

  const hair = new Hair(); doll.head.add(hair.group);
  const acc = new Accessories(doll.head);
  const ears = new AnimalEars(doll.head);
  const foam = new Foam(doll.head, 150);
  const water = new Particles(scene, new THREE.SphereGeometry(1, 8, 6), toon('#8FD0FF', { transparent: true, opacity: 0.85, emissive: '#5FB0F0', emissiveIntensity: 0.3 }), 90, { grav: -11, drag: 0.4 });
  const steam = new Particles(scene, new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.55, depthWrite: false }), 40, { grav: 1.2, drag: 1.6, grow: 1.4 });
  const bitGeo = new THREE.CapsuleGeometry(0.04, 0.16, 3, 6);
  const bits = new Particles(scene, bitGeo, toon('#FFFFFF'), 60, { grav: -8, drag: 0.5, spin: 10, colored: true });
  const pieces = new Pieces(scene, hair, 5);

  const targets = [...hair.meshes, doll.skull];
  const S = {
    stage, scene, camera, turn, doll, hair, acc, ears, foam, water, steam, bits, pieces, cape, capeMat, targets, cust: null, custId: null,
    setCustomer(id, o = {}) {
      const c = CUSTOMERS[id]; S.cust = c; S.custId = id;
      doll.setSkin(c.skin);
      doll.face.set(Object.assign({ eyes: 'open', mouth: 'smile', blushAmt: 0.45, lipsAmt: 0, shadowAmt: 0 }, c.face));
      humanEars.forEach(e => { e.visible = !c.ears; });
      ears.set(c.ears || null, c.earColor);
      capeMat.color.set(c.cape);
      hair.reset(c, o);
      acc.reset(); foam.clear(); water.clear(); steam.clear(); bits.clear(); pieces.clear();
      turn.rotation.y = 0;
    },
    // Khung máy quay: nhìn từ ngực trở lên; tự lùi xa khi màn hình hẹp
    frame(opt = {}) {
      const W = stage.width, H = stage.height, asp = W / Math.max(1, H);
      const bunny = S.cust && S.cust.ears === 'bunny';
      const top = (opt.top || 4.75) + (bunny ? 0.55 : 0), bottom = opt.bottom || 1.45, halfW = opt.halfW || 1.75;
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const d = Math.max((top - bottom) / 2 / t, halfW / (t * asp)) + 1.0;
      // màn hình dọc cao: giữ đáy khung ngay dưới áo choàng, phần dư dành cho phía trên đầu (thẻ yêu cầu, bong bóng lời)
      const hv = (d - 0.3) * t;
      let cy = (top + bottom) / 2;
      if (cy - hv < (opt.floor || 0.62)) cy = (opt.floor || 0.62) + hv;
      camera.position.set(0, cy + 0.3, d); camera.lookAt(0, cy, 0); camera.updateMatrixWorld();
      S.cy = cy;
    },
    // Chụp ảnh: vẽ khung hình ngay rồi cắt một ô vuông quanh khách (cùng một lượt, không cần preserveDrawingBuffer)
    capture(size = 320, quality = 0.82) {
      stage.renderer.render(scene, camera);
      const cv = stage.canvas, cw = cv.width, ch = cv.height;
      const bunny = S.cust && S.cust.ears === 'bunny', cy = HEAD_Y - 0.25 + (bunny ? 0.35 : 0), hs = bunny ? 2.3 : 1.95;
      const c = S._v1.set(0, cy, 0).project(camera), u = S._v2.set(0, cy + hs, 0).project(camera);
      const px = (c.x + 1) / 2 * cw, py = (1 - c.y) / 2 * ch, half = Math.abs(u.y - c.y) / 2 * ch;
      const side = Math.min(2 * half, cw, ch);
      const sx = Math.max(0, Math.min(cw - side, px - side / 2)), sy = Math.max(0, Math.min(ch - side, py - side / 2));
      const out = S._shot || (S._shot = document.createElement('canvas'));
      out.width = out.height = size;
      const g = out.getContext('2d'); g.fillStyle = '#FFE6F0'; g.fillRect(0, 0, size, size);
      g.drawImage(cv, sx, sy, side, side, 0, 0, size, size);
      return out.toDataURL('image/jpeg', quality);
    },
    _v1: new THREE.Vector3(), _v2: new THREE.Vector3(),
  };
  return S;
}
