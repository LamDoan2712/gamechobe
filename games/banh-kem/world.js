// world.js — căn bếp dễ thương: bàn trải khăn caro hồng, đĩa bánh, tường giấy sọc, cửa sổ, dây cờ và mây bay trên cao

import { THREE, toon, canvasTexture, shadowCatcher } from '../../kit/three-kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const PLATE_TOP = 0.1;      // mặt đĩa — đáy tầng bánh đầu tiên
export const TABLE_HW = 6;         // nửa chiều ngang bàn
const TABLE_D = 7, FLOOR_Y = -3.4, WALL_Z = -7, WALL_TOP = 11;

export function createKitchen() {
  const own = [];
  const keep = x => (own.push(x), x);
  const group = new THREE.Group(); group.name = 'kitchen';
  const basic = (o) => keep(new THREE.MeshBasicMaterial(o));

  /* ——— khăn trải bàn caro ——— */
  const gingham = keep(canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,128,172,.42)'; g.fillRect(0, 0, w / 2, h); g.fillRect(0, 0, w, h / 2);
    g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 4; i < w; i += 16) g.fillRect(i, 0, 2, h);
  }));
  gingham.wrapS = gingham.wrapT = THREE.RepeatWrapping;
  const clothMat = keep(toon('#FFFFFF', { map: gingham }));
  const topGeo = keep(new THREE.PlaneGeometry(TABLE_HW * 2, TABLE_D));
  scaleUv(topGeo, TABLE_HW * 2 * 1.1, TABLE_D * 1.1);
  const tableTop = new THREE.Mesh(topGeo, clothMat);
  tableTop.rotation.x = -Math.PI / 2; group.add(tableTop);

  // vạt khăn phía trước có mép lượn sóng
  const sk = new THREE.Shape(), hw = TABLE_HW + 0.05, drop = 1.25, n = 16, sw = (hw * 2) / n;
  sk.moveTo(-hw, 0); sk.lineTo(-hw, -drop);
  for (let i = 0; i < n; i++) { const x = -hw + i * sw; sk.quadraticCurveTo(x + sw / 2, -drop - 0.34, x + sw, -drop); }
  sk.lineTo(hw, 0); sk.lineTo(-hw, 0);
  const skirtGeo = keep(new THREE.ShapeGeometry(sk, 6));
  scaleUv(skirtGeo, 1.1, 1.1);
  const skirt = new THREE.Mesh(skirtGeo, clothMat); skirt.position.set(0, 0.001, TABLE_D / 2); group.add(skirt);
  const edge = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.06, 0.06, hw * 2, 10)), keep(toon('#FF9CC0')));
  edge.rotation.z = Math.PI / 2; edge.position.set(0, 0, TABLE_D / 2 + 0.02); group.add(edge);

  // chân bàn (một lần vẽ cho cả 4 chân)
  const legs = new THREE.InstancedMesh(keep(new THREE.CylinderGeometry(0.2, 0.16, -FLOOR_Y, 14)), keep(toon('#FFE1EC')), 4);
  const m4 = new THREE.Matrix4();
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => legs.setMatrixAt(i, m4.makeTranslation(sx * (TABLE_HW - 0.6), FLOOR_Y / 2, sz * (TABLE_D / 2 - 0.6))));
  group.add(legs);

  // bóng đổ màu hồng nhạt trên mặt bàn
  const catcher = shadowCatcher(1, 0.2); catcher.scale.set(TABLE_HW * 2, TABLE_D, 1); catcher.position.y = 0.004; group.add(catcher);

  /* ——— đĩa bánh ——— */
  const plate = new THREE.Mesh(keep(new THREE.LatheGeometry([
    new THREE.Vector2(0, 0.005), new THREE.Vector2(1.7, 0.005), new THREE.Vector2(1.96, 0.03), new THREE.Vector2(2.02, 0.06),
    new THREE.Vector2(1.99, 0.085), new THREE.Vector2(1.9, PLATE_TOP - 0.004), new THREE.Vector2(1.75, PLATE_TOP), new THREE.Vector2(0, PLATE_TOP),
  ], 56)), keep(toon('#FFFFFF')));
  plate.castShadow = true; plate.receiveShadow = true; group.add(plate);
  const plateRim = new THREE.Mesh(keep(new THREE.TorusGeometry(2.0, 0.022, 6, 56)), keep(toon('#9ED2FF')));
  plateRim.rotation.x = Math.PI / 2; plateRim.position.y = 0.062; group.add(plateRim);

  /* ——— sàn nhà ——— */
  const floorTex = keep(canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#FFE9D2'; g.fillRect(0, 0, w, h); g.fillStyle = '#FFDDBE'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2);
  }));
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  const floorGeo = keep(new THREE.PlaneGeometry(60, 30)); scaleUv(floorGeo, 30, 15);
  const floor = new THREE.Mesh(floorGeo, basic({ map: floorTex }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR_Y, 5); group.add(floor);

  /* ——— tường giấy sọc ——— */
  const paper = keep(canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#FFF3EA'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFE3EC'; g.fillRect(0, 0, w * 0.34, h); g.fillRect(w * 0.5, 0, w * 0.06, h);
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(w * 0.75, h * 0.25, 5, 0, Math.PI * 2); g.arc(w * 0.75, h * 0.75, 5, 0, Math.PI * 2); g.fill();
  }));
  paper.wrapS = paper.wrapT = THREE.RepeatWrapping;
  const wallH = WALL_TOP - FLOOR_Y;
  const wallGeo = keep(new THREE.PlaneGeometry(60, wallH)); scaleUv(wallGeo, 60 / 1.6, wallH / 1.6);
  const wall = new THREE.Mesh(wallGeo, basic({ map: paper }));
  wall.position.set(0, FLOOR_Y + wallH / 2, WALL_Z); group.add(wall);
  const lowGeo = keep(new THREE.PlaneGeometry(60, 1.8 - FLOOR_Y));
  const low = new THREE.Mesh(lowGeo, basic({ color: '#FFD6E6' })); low.position.set(0, (1.8 + FLOOR_Y) / 2, WALL_Z + 0.02); group.add(low);
  const railGeo = keep(new THREE.BoxGeometry(60, 0.22, 0.2)), railMat = keep(toon('#FFFFFF'));
  const rail = new THREE.Mesh(railGeo, railMat); rail.position.set(0, 1.8, WALL_Z + 0.1); group.add(rail);
  const crown = new THREE.Mesh(railGeo, railMat); crown.scale.set(1, 2, 1.6); crown.position.set(0, WALL_TOP, WALL_Z + 0.1); group.add(crown);

  /* ——— cửa sổ vòm nhìn ra trời xanh ——— */
  const winTex = keep(canvasTexture(256, 320, (g, w, h) => {
    const arch = (inset) => { const r = w / 2 - inset; g.beginPath(); g.moveTo(inset, h - inset); g.lineTo(inset, r + inset); g.arc(w / 2, r + inset, r, Math.PI, 0); g.lineTo(w - inset, h - inset); g.closePath(); };
    g.fillStyle = '#FFFFFF'; arch(0); g.fill();
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#8FD0FF'); sky.addColorStop(1, '#DDF2FF');
    g.fillStyle = sky; arch(18); g.fill();
    g.save(); arch(18); g.clip();
    g.fillStyle = '#FFE58A'; g.beginPath(); g.arc(w * 0.72, h * 0.3, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFFFFF'; [[0.3, 0.52, 26], [0.42, 0.48, 32], [0.55, 0.53, 24], [0.2, 0.8, 22], [0.33, 0.78, 28]].forEach(([x, y, r]) => { g.beginPath(); g.arc(w * x, h * y, r, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#A8E6A3'; g.beginPath(); g.ellipse(w * 0.5, h * 1.02, w * 0.7, h * 0.16, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    g.fillStyle = '#FFFFFF'; g.fillRect(w / 2 - 6, 18, 12, h - 36); g.fillRect(18, h * 0.55 - 6, w - 36, 12);
    g.fillStyle = '#FFB3CF'; g.fillRect(0, h - 22, w, 22);
  }));
  const winMat = basic({ map: winTex, transparent: true });
  const winGeo = keep(new THREE.PlaneGeometry(2.6, 3.25));
  [-1, 1].forEach(sx => { const wm = new THREE.Mesh(winGeo, winMat); wm.position.set(sx * 4.4, 4.6, WALL_Z + 0.05); group.add(wm); });

  /* ——— dây cờ đuôi nheo ——— */
  const flagShape = new THREE.Shape(); flagShape.moveTo(-0.26, 0); flagShape.lineTo(0.26, 0); flagShape.lineTo(0, -0.55); flagShape.closePath();
  const FLAGS = 19, flags = new THREE.InstancedMesh(keep(new THREE.ShapeGeometry(flagShape)), basic({ color: '#FFFFFF' }), FLAGS);
  const flagCols = ['#FF8FB8', '#FFD66B', '#8FD3FF', '#9FE3B8', '#C9A8F5'].map(c => new THREE.Color(c));
  const pts = [];
  const sag = x => 8.4 - 0.9 * (1 - (x / 9.5) * (x / 9.5));
  for (let i = 0; i < FLAGS; i++) {
    const x = -9 + (i * 18) / (FLAGS - 1);
    flags.setMatrixAt(i, m4.makeTranslation(x, sag(x), WALL_Z + 0.3)); flags.setColorAt(i, flagCols[i % flagCols.length]);
  }
  for (let i = 0; i <= 24; i++) { const x = -9.6 + (i * 19.2) / 24; pts.push(new THREE.Vector3(x, sag(x) + 0.02, WALL_Z + 0.31)); }
  group.add(flags, new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints(pts)), keep(new THREE.LineBasicMaterial({ color: '#E6A1BE' }))));

  /* ——— mây bồng bềnh phía trên tường (hiện ra khi tháp cao) ——— */
  const puffs = [[0, 0, 0, 0.9], [0.8, -0.15, 0.1, 0.7], [-0.85, -0.2, 0.05, 0.65], [0.35, 0.35, -0.1, 0.62], [-0.4, 0.3, 0, 0.55]].map(([x, y, z, r]) => new THREE.SphereGeometry(r, 16, 12).translate(x, y, z));
  const cloudGeo = keep(mergeGeometries(puffs)); puffs.forEach(g => g.dispose());
  const cloudMat = keep(toon('#FFFFFF'));
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(cloudGeo, cloudMat);
    const sc = 0.7 + Math.random() * 0.6; c.scale.set(sc * 1.3, sc * 0.8, sc);
    c.position.set(-10 + Math.random() * 20, 12.5 + i * 3.2, -5 + Math.random() * 1.5);
    c.userData.v = (0.15 + Math.random() * 0.25) * (Math.random() < 0.5 ? -1 : 1);
    group.add(c); clouds.push(c);
  }

  return {
    group, plate,
    // mây trôi ngang; mây lọt xuống dưới tầm nhìn thì được đưa lên trên (không tạo vật mới)
    update(dt, focusY) {
      const lo = Math.max(12, focusY - 9);
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        c.position.x += c.userData.v * dt;
        if (c.position.x > 12) c.position.x = -12; else if (c.position.x < -12) c.position.x = 12;
        if (c.position.y < lo) c.position.y += 28.8; else if (c.position.y > lo + 28.8) c.position.y -= 28.8;
      }
    },
    dispose() { for (const x of own) x.dispose(); own.length = 0; },
  };
}

function scaleUv(geo, sx, sy) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
  uv.needsUpdate = true;
}
