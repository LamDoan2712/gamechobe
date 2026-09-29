// anim.js — chuyển động dùng chung cho các công thức: bay vòng cung, hiện ra/biến mất, dao ba mẹ cắt, dòng nước rót.
// Mọi hàm trả về Promise để công thức viết tuần tự bằng await.

import { THREE, Tweens, Ease, wait } from '../../kit/three-kit.js';
import { Sound } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import * as MD from './models.js';
import { liquid } from './mats.js';

export { wait };

// Bay theo vòng cung tới vị trí mới (toạ độ trong cùng parent)
export function arc(obj, to, dur = 0.6, height = 1, rot) {
  const from = obj.position.clone(), p = { t: 0 };
  const r0 = obj.rotation.clone();
  return Tweens.to(p, { t: 1 }, dur, {
    ease: Ease.inOutSine,
    onUpdate: () => {
      obj.position.lerpVectors(from, to, p.t); obj.position.y += Math.sin(p.t * Math.PI) * height;
      if (rot) { obj.rotation.x = r0.x + (rot.x ?? 0) * Math.sin(p.t * Math.PI); obj.rotation.z = r0.z + (rot.z ?? 0) * Math.sin(p.t * Math.PI); }
    },
  });
}
export function popIn(obj, dur = 0.4, scale = 1) { obj.visible = true; obj.scale.setScalar(0.01); return Tweens.to(obj.scale, { x: scale, y: scale, z: scale }, dur, { ease: Ease.outBack }); }
export function popOut(obj, dur = 0.3) { return Tweens.to(obj.scale, { x: 0.01, y: 0.01, z: 0.01 }, dur, { ease: Ease.inQuad }).then(() => { obj.visible = false; }); }
export function moveTo(obj, to, dur = 0.5) { return Tweens.to(obj.position, { x: to.x, y: to.y, z: to.z }, dur, { ease: Ease.inOutSine }); }
export function squash(obj, k = 0.8, dur = 0.12) { const y = obj.scale.y; return Tweens.to(obj.scale, { y: y * k }, dur).then(() => Tweens.to(obj.scale, { y }, dur * 2, { ease: Ease.outBack })); }

// Dao của ba mẹ chặt xuống vài lần trên vị trí `at` (toạ độ thế giới trong ws)
export async function chop(K, at, times = 3, spread = 0.5) {
  const knife = MD.knife(); knife.position.set(at.x - 0.3, at.y + 1.4, at.z + 0.25); knife.rotation.set(0, -0.2, 0);
  K.ws.add(knife); await popIn(knife, 0.25);
  for (let i = 0; i < times; i++) {
    const x = at.x - spread / 2 + (spread * i) / Math.max(1, times - 1) - 0.3;
    await Tweens.to(knife.position, { x, y: at.y + 0.35 }, 0.12, { ease: Ease.inQuad });
    Sound.fx.chop(); const s = K.toScreen(new THREE.Vector3(x + 0.3, at.y + 0.2, at.z)); FX.sparkle(s.x, s.y, '#FFFFFF', 3);
    await Tweens.to(knife.position, { y: at.y + 1.1 }, 0.16, { ease: Ease.outCubic });
  }
  await popOut(knife, 0.2); K.ws.remove(knife); knife.traverse(o => o.geometry && o.geometry.dispose());
}

// Dòng nước/nước cam rót từ điểm a xuống điểm b (thế giới)
export function pourStream(K, color = '#BFE6FF') {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1, 10, 1, true), liquid(color, 0.75)); m.visible = false; m.castShadow = false; K.ws.add(m);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  return {
    mesh: m,
    set(on, from, to) {
      m.visible = on; if (!on) return;
      a.copy(from); b.copy(to); const len = a.distanceTo(b);
      mid.addVectors(a, b).multiplyScalar(0.5); m.position.copy(mid); m.scale.set(1, len, 1);
      m.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize().negate());
    },
  };
}

// Toạ độ thế giới của một điểm trong vật (để đặt dòng nước, hơi nước…)
export const worldOf = (obj, x = 0, y = 0, z = 0) => obj.localToWorld(new THREE.Vector3(x, y, z));
