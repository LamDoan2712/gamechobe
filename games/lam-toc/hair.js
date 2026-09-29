// hair.js — tóc 3D kiểu đất nặn: một "mũ tóc" phủ đỉnh + sau đầu, và ~34 lọn tóc dày (ống dẹt quét theo đường cong
// Catmull-Rom, đầu lọn bo tròn). Mỗi lọn có trạng thái: dài (len), xoăn (curl), màu, ướt (wet), nhuộm (dye).
// Hình học của một lọn chỉ dựng lại khi len/curl của lọn đó đổi, và ghi thẳng vào bộ đệm có sẵn (không cấp phát mới).
// Toạ độ: tất cả tính trong hệ toạ độ của doll.head (tâm đầu ở gốc, mặt nhìn về +z).

import { THREE, toonGradient, canvasTexture } from '../../kit/three-kit.js';
import { RAINBOW } from './data.js';

export const LEN_MIN = 0.25, LEN_MAX = 3.2, CURLED = 0.6;
// "ngắn" / "dài" tính theo phần tóc rủ xuống dưới da đầu (ngắn: ngọn trên vai; dài: xuống quá vai)
export const SHORT_HANG = 1.1, LONG_HANG = 1.5;
export const HEAD_Y = 3.15;                 // tâm đầu (thế giới) khi búp bê đứng ở gốc
export const EX = 1.06, EY = 0.98, EZ = 1.0; // bán kính hộp sọ (ellipsoid)
export const CAP_H = 0.07;                   // độ dày mũ tóc
const SEG = 10, VPR = SEG + 1, RB = 40, RT = 4, RINGS = RB + RT, NV = RINGS * VPR;
const PITCH = 0.44, CURL_SHRINK = 0.3, TAU = Math.PI * 2;
export const LOCK_VERTS = NV;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ——— áo choàng làm tóc (hình chuông) — dùng chung cho salon.js và để tóc dài phủ lên ——— */
export const CAPE = [[0.24, 2.34], [0.42, 2.25], [0.62, 2.11], [0.8, 1.94], [0.95, 1.7], [1.04, 1.42], [1.09, 1.1], [1.12, 0.72]];
export function capeR(wy) {
  if (wy > CAPE[0][1]) return 0;
  for (let i = 1; i < CAPE.length; i++) {
    if (wy >= CAPE[i][1]) { const r0 = CAPE[i - 1][0], y0 = CAPE[i - 1][1], r1 = CAPE[i][0], y1 = CAPE[i][1]; return r0 + (r1 - r0) * (y0 - wy) / (y0 - y1); }
  }
  return CAPE[CAPE.length - 1][0];
}

/* ——— hình dạng đầu ——— */
// Đường chân tóc của mũ tóc: phía trước cao (để lộ trán), hai bên ngang tai, phía sau xuống gáy
export function capEdge(a) {
  const x = Math.abs(a);
  return 0.66 + 0.62 * sstep(0.42, 0.95, x) + 0.72 * sstep(1.3, Math.PI, x);
}
function capH(a, th) { const e = capEdge(a); return Math.max(0, CAP_H - (CAP_H + 0.03) * sstep(e * 0.86, e, th)); }
export function ellPoint(a, th, h, out) {
  const s = Math.sin(th);
  out.x = s * Math.sin(a) * (EX + h); out.y = Math.cos(th) * (EY + h); out.z = s * Math.cos(a) * (EZ + h);
  return out;
}
function ellR(a) { const s = Math.sin(a), c = Math.cos(a); return 1 / Math.sqrt((s * s) / (EX * EX) + (c * c) / (EZ * EZ)); }
// chừa chỗ cho tai người (±1.04, -0.08, 0)
function earClear(a, y) { const s = Math.abs(Math.sin(a)); return 0.13 * Math.exp(-((y + 0.08) * (y + 0.08)) / 0.07) * s * s * s * s; }
function rMin(y, a, hl) {
  let r = 0;
  if (y > -EY) { const k = y / EY; r = Math.sqrt(1 - k * k) * ellR(a) + hl + earClear(a, y); }
  const c = capeR(y + HEAD_Y);
  if (c > 0) r = Math.max(r, c + hl + 0.02);
  return r;
}

/* ——— bố cục các lọn tóc ——— */
function makeLayout() {
  const L = [];
  const nA = 18, aMin = 0.8;
  for (let i = 0; i < nA; i++) {
    let a = aMin + (TAU - 2 * aMin) * i / (nA - 1); if (a > Math.PI) a -= TAU;
    const x = Math.abs(a);
    // lọn hai bên má mọc cao hơn để che thái dương
    const th = x < 1.2 ? 0.62 + (x - 0.8) * 0.5 : capEdge(a) - 0.32;
    L.push({ kind: 'A', a, th, extra: 0, rw: 0.25, rt: 0.1 });
  }
  const nB = 9, bMin = 1.45;
  for (let i = 0; i < nB; i++) {
    let a = bMin + (TAU - 2 * bMin) * i / (nB - 1); if (a > Math.PI) a -= TAU;
    L.push({ kind: 'B', a, th: 0.55 + 0.3 * sstep(1.45, Math.PI, Math.abs(a)), extra: 0.11, rw: 0.27, rt: 0.1 });
  }
  [-0.6, -0.3, 0, 0.3, 0.6].forEach(a => L.push({ kind: 'bang', a, th: 0.28, extra: 0.015, rw: 0.23, rt: 0.08, side: a < -0.01 ? -1 : 1 }));
  return L;
}
// điểm mốc (a, θ) trên da đầu mà lọn tóc đi qua trước khi rủ xuống
function waypoints(lk) {
  const W = lk.wp;
  if (lk.kind === 'bang') {
    const s = lk.side;
    W.push([lk.a, lk.th], [lk.a * 1.12, 1.08], [s * 0.98, 1.3], [s * 1.22, Math.PI / 2 + 0.08]);
  } else {
    const thd = Math.max(lk.th + 0.06, Math.PI / 2 + 0.08);
    const drift = lk.kind === 'A' ? Math.sign(lk.a) * 0.14 * (1 - sstep(1.0, 1.9, Math.abs(lk.a))) : 0;
    W.push([lk.a, lk.th], [lk.a + drift * 0.5, (lk.th + thd) / 2], [lk.a + drift, thd]);
  }
}

/* ——— texture ánh bóng (dùng làm emissiveMap) ——— */
function lockShineTex() {
  // u quanh tiết diện (0.5 = mặt ngoài), v dọc lọn (0 = chân tóc … 1 = dài tối đa)
  return canvasTexture(32, 256, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0.36, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(0.64, 'rgba(255,255,255,0)');
    const gv = g.createLinearGradient(0, 0, 0, h);
    g.fillStyle = gr; g.fillRect(0, h * 0.03, w, h * 0.2);
    g.globalAlpha = 0.45; g.fillRect(0, h * 0.27, w, h * 0.07);
    g.globalCompositeOperation = 'destination-in'; g.globalAlpha = 1;
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.05, '#000'); gv.addColorStop(0.3, '#000'); gv.addColorStop(0.36, 'rgba(0,0,0,0)');
    g.fillStyle = gv; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  });
}
function capShineTex() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    // dải bóng hình răng cưa kiểu tóc búp bê, quanh θ ≈ 0.5–0.72
    const y0 = h * (0.46 / Math.PI), y1 = h * (0.72 / Math.PI);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, y0);
    const n = 24;
    for (let i = 0; i <= n; i++) g.lineTo(w * i / n, y0 + (i % 2 ? 3 : 0));
    for (let i = n; i >= 0; i--) g.lineTo(w * i / n, i % 2 ? y1 + 10 : y1 - 4);
    g.closePath(); g.fill();
  });
}

const effCurl = lk => (lk.kind === 'bang' ? lk.curl * 0.4 : lk.curl);

/* ——— bộ đệm tạm (dùng lại, không cấp phát khi đang chơi) ——— */
const MAXD = 260;
const DX = new Float32Array(MAXD), DY = new Float32Array(MAXD), DZ = new Float32Array(MAXD), DS = new Float32Array(MAXD);
const RS = new Float32Array(RINGS), RR = new Float32Array(RINGS), RC = new Float32Array(RINGS);
const PP = new Float32Array(RINGS * 3), TT = new Float32Array(RINGS * 3), NN = new Float32Array(RINGS * 3), BB = new Float32Array(RINGS * 3);
const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _c = new THREE.Color();

let sharedIndex = null;
function lockIndex() {
  if (sharedIndex) return sharedIndex;
  const idx = new Uint16Array((RINGS - 1) * SEG * 6); let k = 0;
  for (let i = 0; i < RINGS - 1; i++) for (let j = 0; j < SEG; j++) {
    const a = i * VPR + j, b = a + 1, c = a + VPR, d = c + 1;
    idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
  }
  sharedIndex = new THREE.BufferAttribute(idx, 1);
  return sharedIndex;
}
export function makeLockGeometry() {
  const g = new THREE.BufferGeometry();
  g.setIndex(lockIndex());
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NV * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(NV * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(NV * 2), 2).setUsage(THREE.DynamicDrawUsage));
  return g;
}

/* ——— đường tâm dày đặc của lọn: phần nằm trên da đầu + phần rủ xuống theo trọng lực ——— */
let _n = 0, _s = 0, _surf = 0;
function dpush(x, y, z) {
  if (_n > 0) { const dx = x - DX[_n - 1], dy = y - DY[_n - 1], dz = z - DZ[_n - 1]; _s += Math.sqrt(dx * dx + dy * dy + dz * dz); }
  DX[_n] = x; DY[_n] = y; DZ[_n] = z; DS[_n] = _s; _n++;
}
const crv = (a, b, c, d, t, t2, t3) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
function densePath(lk, hl, need, hang) {
  const W = lk.wp, nW = W.length;
  _n = 0; _s = 0; _surf = 1e9;
  // phần nằm trên đầu: Catmull-Rom trong không gian (a, θ)
  const STEPS = 12;
  for (let k = 0; k < nW - 1 && _n < MAXD - 2; k++) {
    const p0 = W[Math.max(0, k - 1)], p1 = W[k], p2 = W[k + 1], p3 = W[Math.min(nW - 1, k + 2)];
    for (let j = k === 0 ? 0 : 1; j <= STEPS; j++) {
      const t = j / STEPS, t2 = t * t, t3 = t2 * t;
      const a = crv(p0[0], p1[0], p2[0], p3[0], t, t2, t3), th = crv(p0[1], p1[1], p2[1], p3[1], t, t2, t3);
      // mọc lên từ dưới mũ tóc trong 0.3 đơn vị đầu tiên
      const e = sstep(0, 0.32, _s);
      const h = capH(a, th) - 0.05 * (1 - e) + hl * e + earClear(a, Math.cos(th) * EY);
      ellPoint(a, th, h, _p); dpush(_p.x, _p.y, _p.z);
      if (_s > need) return _n;
    }
  }
  // phần rủ xuống: thẳng xuống, hơi xoè, không xuyên qua đầu, tai, áo choàng
  _surf = _s;
  const n0 = _n - 1, aL = Math.atan2(DX[n0], DZ[n0]);
  let y = DY[n0];
  const r0 = Math.sqrt(DX[n0] * DX[n0] + DZ[n0] * DZ[n0]), y0 = y, sa = Math.sin(aL), ca = Math.cos(aL);
  while (_s < need && _n < MAXD) {
    y -= 0.07;
    const r = Math.max(r0 + 0.035 * (y0 - y), rMin(y, aL, hang));
    dpush(r * sa, y, r * ca);
  }
  return _n;
}

/* ——— lớp Tóc ——— */
export class Hair {
  constructor() {
    this.group = new THREE.Group(); this.group.name = 'hair';
    this.shine = lockShineTex();
    this.capMat = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: toonGradient(), emissive: 0xffffff, emissiveIntensity: 0.16, emissiveMap: capShineTex() });
    this._buildCap();
    this.locks = makeLayout().map((d, i) => this._makeLock(d, i));
    // độ dài phần nằm trên da đầu của từng lọn (tính một lần, tóc thẳng)
    for (const lk of this.locks) {
      lk.len = LEN_MAX; lk.curl = 0;
      this._sweep(lk, { pos: lk.geo.attributes.position.array, nor: lk.geo.attributes.normal.array, uv: lk.geo.attributes.uv.array }, 0, lk.root);
      lk.scalp = (_surf > 100 ? LEN_MAX : _surf) - lk.jit;
    }
    this.main = this.locks.filter(l => l.kind !== 'bang');
    this.meshes = [this.cap, ...this.locks.map(l => l.mesh)];
    this.baseHex = '#8A5536';
    this.capWet = 0; this.dirtyCount = 0;
  }

  /* mũ tóc: nửa cầu phủ đỉnh và sau đầu, mép bo vào trong; có màu theo từng đỉnh để nhuộm từng mảng */
  _buildCap() {
    const NA = 56, NT = 22, nv = (NA + 1) * (NT + 1);
    const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = new Float32Array(nv * 3), az = new Float32Array(nv);
    for (let i = 0; i <= NA; i++) {
      const a = -Math.PI + TAU * i / NA, e = capEdge(a);
      for (let j = 0; j <= NT; j++) {
        const t = j / NT, th = e * t, k = i * (NT + 1) + j;
        // gợn chia múi nhẹ cho giống tóc nặn bằng đất
        const ridge = 0.014 * Math.cos(a * 9) * Math.sin(Math.PI * Math.min(1, t * 1.15));
        const h = CAP_H + ridge - (CAP_H + 0.03) * sstep(0.86, 1, t);
        ellPoint(a, th, h, _p);
        pos[k * 3] = _p.x; pos[k * 3 + 1] = _p.y; pos[k * 3 + 2] = _p.z;
        uv[k * 2] = i / NA; uv[k * 2 + 1] = 1 - th / Math.PI;
        az[k] = a;
      }
    }
    const idx = [];
    for (let i = 0; i < NA; i++) for (let j = 0; j < NT; j++) {
      const a = i * (NT + 1) + j, b = a + 1, c = a + NT + 1, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setIndex(idx);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    g.computeVertexNormals();
    // nối liền pháp tuyến ở đường may phía sau
    const nor = g.attributes.normal.array;
    for (let j = 0; j <= NT; j++) {
      const a = j * 3, b = (NA * (NT + 1) + j) * 3;
      for (let c = 0; c < 3; c++) { const m = (nor[a + c] + nor[b + c]) / 2; nor[a + c] = nor[b + c] = m; }
    }
    this.cap = new THREE.Mesh(g, this.capMat);
    this.cap.castShadow = true; this.cap.name = 'hairCap';
    this.cap.userData.lock = -1;
    this.capAz = az; this.capN = nv;
    this.group.add(this.cap);
  }

  _makeLock(d, i) {
    const geo = makeLockGeometry();
    const mat = new THREE.MeshToonMaterial({ color: 0x8a5536, gradientMap: toonGradient(), emissive: 0xffffff, emissiveIntensity: 0.14, emissiveMap: this.shine });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.userData.lock = i; mesh.name = 'lock' + i;
    this.group.add(mesh);
    const lk = Object.assign(d, {
      i, geo, mat, mesh, wp: [], len: 1, curl: 0, wet: 0, dye: null,
      color: new THREE.Color(), from: new THREE.Color(), to: new THREE.Color(), fade: 1,
      phase: (i * 2.399) % TAU, jit: 0.07 * Math.sin(i * 2.3 + 1),
      centers: new Float32Array(RINGS * 3), ringS: new Float32Array(RINGS), ringN: new Float32Array(RINGS * 3), nRings: RINGS,
      root: new THREE.Vector3(), lb: 1, surf: 0, dirty: true, matDirty: true,
      wx: 0, wz: 0, vx: 0, vz: 0, cool: 0,
    });
    waypoints(lk);
    return lk;
  }

  /* ——— dựng hình học một lọn (hoặc mẩu tóc bị cắt rơi xuống) ——— */
  // out: { pos, nor, uv, centers?, ringS?, ringN? }; sStart > 0 → dựng đoạn [sStart, hết] với đầu bo tròn (mẩu cắt)
  _sweep(lk, out, sStart, ref) {
    const c = effCurl(lk), amp = 0.12 * c;
    const Lb = Math.max(0.14, (lk.len + (sStart > 0 ? 0 : lk.jit)) * (1 - CURL_SHRINK * c));
    const rw = lerp(lk.rw, 0.125, c), rt = lerp(lk.rt, 0.11, c);
    const hl = rt * 0.95 + lk.extra + amp * 0.3 + 0.012;
    const n = densePath(lk, hl, Lb + 0.05, rt * 0.95 + lk.extra + amp + 0.012);
    const rtip = Math.min(rw * 0.95, Lb * 0.35);
    const piece = sStart > 0;
    const s0 = piece ? Math.min(sStart, Lb - rtip * 2.2) : 0, s1 = Math.max(s0 + 0.02, Lb - rtip);
    // bảng vòng: vị trí s, tỉ lệ bán kính, hướng pháp tuyến ở hai đầu bo
    let r = 0;
    if (piece) {
      for (let j = 0; j < RT; j++) { const ang = (j / RT) * Math.PI / 2; RS[r] = s0 + rtip * (1 - Math.cos(ang)); RR[r] = Math.sin(ang); RC[r] = -Math.cos(ang); r++; }
      const bs = s0 + rtip, nb = RB - RT;
      for (let j = 0; j < nb; j++) { RS[r] = bs + (s1 - bs) * j / (nb - 1); RR[r] = 1; RC[r] = 0; r++; }
    } else {
      for (let j = 0; j < RB; j++) { RS[r] = s0 + (s1 - s0) * j / (RB - 1); RR[r] = 1; RC[r] = 0; r++; }
    }
    for (let j = 1; j <= RT; j++) { const ang = (j / RT) * Math.PI / 2; RS[r] = s1 + rtip * Math.sin(ang); RR[r] = Math.cos(ang); RC[r] = Math.sin(ang); r++; }
    // lấy mẫu đường tâm tại các vị trí s
    let k = 1;
    for (let i = 0; i < RINGS; i++) {
      const s = RS[i];
      while (k < n - 1 && DS[k] < s) k++;
      const sa = DS[k - 1], sb = DS[k], t = sb > sa ? clamp((s - sa) / (sb - sa), 0, 1.5) : 0;
      PP[i * 3] = lerp(DX[k - 1], DX[k], t); PP[i * 3 + 1] = lerp(DY[k - 1], DY[k], t); PP[i * 3 + 2] = lerp(DZ[k - 1], DZ[k], t);
    }
    this._frames();
    // xoăn: dời đường tâm theo đường xoắn ốc quanh trục, rồi tính lại hệ trục
    if (amp > 0.001) {
      for (let i = 0; i < RINGS; i++) {
        const s = RS[i], ai = amp * sstep(0.04, 0.3, s) * (0.22 + 0.78 * sstep(_surf - 0.15, _surf + 0.3, s)), ph = s * TAU / PITCH + lk.phase, cs = Math.cos(ph), sn = Math.sin(ph);
        for (let q = 0; q < 3; q++) PP[i * 3 + q] += ai * (NN[i * 3 + q] * cs + BB[i * 3 + q] * sn);
      }
      this._frames();
    }
    // điểm gốc (lọn chính: chân tóc; mẩu cắt: trọng tâm)
    if (piece) {
      ref.set(0, 0, 0); for (let i = 0; i < RINGS; i++) { ref.x += PP[i * 3]; ref.y += PP[i * 3 + 1]; ref.z += PP[i * 3 + 2]; } ref.multiplyScalar(1 / RINGS);
    } else ref.set(PP[0], PP[1], PP[2]);
    // quét tiết diện elip dẹt
    const pos = out.pos, nor = out.nor, uv = out.uv;
    for (let i = 0; i < RINGS; i++) {
      const i3 = i * 3, taper = 1 - 0.22 * clamp(RS[i] / Math.max(Lb, 0.5), 0, 1), rr = RR[i] * taper, capB = RC[i], side = Math.sqrt(Math.max(0, 1 - capB * capB));
      const cx = PP[i3], cy = PP[i3 + 1], cz = PP[i3 + 2];
      const nx = NN[i3], ny = NN[i3 + 1], nz = NN[i3 + 2], bx = BB[i3], by = BB[i3 + 1], bz = BB[i3 + 2], tx = TT[i3], ty = TT[i3 + 1], tz = TT[i3 + 2];
      for (let j = 0; j <= SEG; j++) {
        const ang = Math.PI + TAU * j / SEG, cs = Math.cos(ang), sn = Math.sin(ang);
        const v = (i * VPR + j), v3 = v * 3;
        const ot = cs * rt * rr, ow = sn * rw * rr;
        pos[v3] = cx + nx * ot + bx * ow - ref.x; pos[v3 + 1] = cy + ny * ot + by * ow - ref.y; pos[v3 + 2] = cz + nz * ot + bz * ow - ref.z;
        let mx = nx * cs / rt + bx * sn / rw, my = ny * cs / rt + by * sn / rw, mz = nz * cs / rt + bz * sn / rw;
        const ml = Math.sqrt(mx * mx + my * my + mz * mz) || 1;
        mx = mx / ml * side + tx * capB; my = my / ml * side + ty * capB; mz = mz / ml * side + tz * capB;
        const m2 = Math.sqrt(mx * mx + my * my + mz * mz) || 1;
        nor[v3] = mx / m2; nor[v3 + 1] = my / m2; nor[v3 + 2] = mz / m2;
        uv[v * 2] = j / SEG; uv[v * 2 + 1] = 1 - RS[i] / LEN_MAX;
      }
      if (out.centers) {
        out.centers[i3] = cx; out.centers[i3 + 1] = cy; out.centers[i3 + 2] = cz;
        out.ringN[i3] = nx; out.ringN[i3 + 1] = ny; out.ringN[i3 + 2] = nz; out.ringS[i] = RS[i];
      }
    }
    return Lb;
  }
  // hệ trục dọc lọn: T tiếp tuyến, N hướng ra ngoài đầu, B = T × N
  _frames() {
    for (let i = 0; i < RINGS; i++) {
      const a = Math.max(0, i - 1), b = Math.min(RINGS - 1, i + 1);
      let tx = PP[b * 3] - PP[a * 3], ty = PP[b * 3 + 1] - PP[a * 3 + 1], tz = PP[b * 3 + 2] - PP[a * 3 + 2];
      let tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (tl < 1e-6) { if (i > 0) { tx = TT[(i - 1) * 3]; ty = TT[(i - 1) * 3 + 1]; tz = TT[(i - 1) * 3 + 2]; } else { tx = 0; ty = -1; tz = 0; } tl = 1; }
      tx /= tl; ty /= tl; tz /= tl;
      const px = PP[i * 3], py = PP[i * 3 + 1], pz = PP[i * 3 + 2];
      let ox = px, oy = py > 0 ? py : 0, oz = pz;
      const d = ox * tx + oy * ty + oz * tz;
      ox -= tx * d; oy -= ty * d; oz -= tz * d;
      let ol = Math.sqrt(ox * ox + oy * oy + oz * oz);
      if (ol < 1e-5) { ox = 0; oy = 0; oz = 1; ol = 1; }
      ox /= ol; oy /= ol; oz /= ol;
      TT[i * 3] = tx; TT[i * 3 + 1] = ty; TT[i * 3 + 2] = tz;
      NN[i * 3] = ox; NN[i * 3 + 1] = oy; NN[i * 3 + 2] = oz;
      BB[i * 3] = ty * oz - tz * oy; BB[i * 3 + 1] = tz * ox - tx * oz; BB[i * 3 + 2] = tx * oy - ty * ox;
    }
  }
  _rebuild(lk) {
    const g = lk.geo;
    lk.lb = this._sweep(lk, { pos: g.attributes.position.array, nor: g.attributes.normal.array, uv: g.attributes.uv.array, centers: lk.centers, ringS: lk.ringS, ringN: lk.ringN }, 0, lk.root);
    lk.surf = _surf;
    lk.mesh.position.copy(lk.root);
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true; g.attributes.uv.needsUpdate = true;
    g.computeBoundingSphere();
    lk.dirty = false;
  }
  // Dựng mẩu tóc bị cắt (đoạn từ sCut đến hết) vào bộ đệm của mẩu rơi; trả về trọng tâm (toạ độ đầu) trong ref
  buildPiece(lk, oldLen, sCutAxis, geo, ref) {
    const keep = lk.len; lk.len = oldLen;
    this._sweep(lk, { pos: geo.attributes.position.array, nor: geo.attributes.normal.array, uv: geo.attributes.uv.array }, Math.max(0.05, sCutAxis), ref);
    lk.len = keep;
    geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true; geo.attributes.uv.needsUpdate = true;
    geo.computeBoundingSphere();
  }

  /* ——— trạng thái ——— */
  reset(cust, o = {}) {
    this.baseHex = cust.hair;
    const len = o.len != null ? o.len : cust.len, curl = o.curl != null ? o.curl : cust.curl;
    this.locks.forEach(lk => {
      lk.len = lk.kind === 'bang' ? Math.min(0.95, Math.max(0.55, len)) : (lk.kind === 'B' ? len * 0.94 : len);
      lk.curl = lk.kind === 'bang' ? curl * 0.5 : curl;
      lk.wet = 0; lk.dye = null; lk.color.set(cust.hair); lk.fade = 1; lk.dirty = true; lk.matDirty = true;
      lk.wx = lk.wz = lk.vx = lk.vz = 0; lk.mesh.rotation.set(0, 0, 0);
    });
    this.paintCapAll(cust.hair);
    this.capWet = 0; this._capMat();
    this.rebuildAll();
  }
  rebuildAll() { this.locks.forEach(lk => { if (lk.dirty) this._rebuild(lk); if (lk.matDirty) this._mat(lk); }); }
  save() {
    return { locks: this.locks.map(l => [l.len, l.curl, l.color.getHex(), l.dye, l.wet]), cap: this.cap.geometry.attributes.color.array.slice(), capWet: this.capWet };
  }
  restore(s) {
    s.locks.forEach((v, i) => {
      const lk = this.locks[i];
      if (lk.len !== v[0] || lk.curl !== v[1]) lk.dirty = true;
      lk.len = v[0]; lk.curl = v[1]; lk.color.setHex(v[2]); lk.dye = v[3]; lk.wet = v[4]; lk.fade = 1; lk.matDirty = true;
    });
    this.cap.geometry.attributes.color.array.set(s.cap); this.cap.geometry.attributes.color.needsUpdate = true;
    this.capWet = s.capWet; this._capMat();
    this.rebuildAll();
  }
  setLen(lk, v) { v = clamp(v, LEN_MIN, LEN_MAX); if (Math.abs(v - lk.len) > 1e-4) { lk.len = v; lk.dirty = true; } }
  setCurl(lk, v) { v = clamp(v, 0, 1); if (Math.abs(v - lk.curl) > 1e-4) { lk.curl = v; lk.dirty = true; } }
  setWet(lk, v) { v = clamp(v, 0, 1); if (Math.abs(v - lk.wet) > 0.004) { lk.wet = v; lk.matDirty = true; } }
  // nhuộm một lọn (màu chuyển dần trong 0.35 giây)
  dyeLock(lk, key, hex) {
    if (lk.dye === key && lk.fade >= 1 && lk.to.getHex() === _c.set(hex).getHex()) return false;
    lk.from.copy(lk.color); lk.to.set(hex); lk.fade = 0; lk.dye = key; lk.matDirty = true;
    return true;
  }
  // nhuộm ngay (dùng khi vẽ ảnh mẫu)
  dyeNow(lk, key, hex) { lk.color.set(hex); lk.to.set(hex); lk.fade = 1; lk.dye = key; lk.matDirty = true; }
  // điểm trên mũ tóc theo hướng của p (false nếu hướng đó không thuộc vùng mũ tóc)
  capPoint(p, lift, out) {
    const r = Math.sqrt(p.x * p.x + p.z * p.z), a = Math.atan2(p.x, p.z), th = Math.atan2(r, p.y);
    if (th > capEdge(a) * 0.96) return false;
    ellPoint(a, th, CAP_H + lift, out); return true;
  }
  rainbowHex(lk) { return RAINBOW[(lk.i * 5 + (lk.kind === 'bang' ? 2 : 0)) % RAINBOW.length]; }
  _mat(lk) {
    // tóc ướt: sẫm màu hơn, hơi ngả xanh và bóng hơn
    _c.copy(lk.color).multiplyScalar(1 - 0.42 * lk.wet); _c.b += 0.02 * lk.wet;
    lk.mat.color.copy(_c);
    lk.mat.emissiveIntensity = 0.14 + 0.5 * lk.wet;
    lk.matDirty = false;
  }
  _capMat() { const k = 1 - 0.42 * this.capWet; this.capMat.color.setRGB(k, k, k + 0.02 * this.capWet); this.capMat.emissiveIntensity = 0.16 + 0.5 * this.capWet; }
  paintCapAll(hex, rainbow) {
    const col = this.cap.geometry.attributes.color;
    _c.set(hex);
    for (let k = 0; k < this.capN; k++) {
      if (rainbow) _c.set(this._capRainbow(k));
      col.array[k * 3] = _c.r; col.array[k * 3 + 1] = _c.g; col.array[k * 3 + 2] = _c.b;
    }
    col.needsUpdate = true;
  }
  _capRainbow(k) { const a = this.capAz[k]; return RAINBOW[((Math.floor((a + Math.PI) / TAU * 12) % 12) + 12) % RAINBOW.length]; }
  // Tô màu lên mũ tóc quanh điểm p (và dọc theo tia nhìn o→d để mặt sau cũng được tô)
  paintCap(p, radius, hex, rainbow, o, d, amt) {
    const col = this.cap.geometry.attributes.color, pos = this.cap.geometry.attributes.position.array;
    if (!rainbow) _c.set(hex);
    let changed = false;
    for (let k = 0; k < this.capN; k++) {
      const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2];
      let dist = Math.hypot(x - p.x, y - p.y, z - p.z);
      if (o) {
        const wx = x - o.x, wy = y - o.y, wz = z - o.z, t = wx * d.x + wy * d.y + wz * d.z;
        const rd = Math.sqrt(Math.max(0, wx * wx + wy * wy + wz * wz - t * t)) * 1.25;
        if (rd < dist) dist = rd;
      }
      if (dist >= radius) continue;
      const w = Math.min(1, (1 - dist / radius) * amt);
      if (rainbow) _c.set(this._capRainbow(k));
      col.array[k * 3] += (_c.r - col.array[k * 3]) * w; col.array[k * 3 + 1] += (_c.g - col.array[k * 3 + 1]) * w; col.array[k * 3 + 2] += (_c.b - col.array[k * 3 + 2]) * w;
      changed = true;
    }
    if (changed) col.needsUpdate = true;
  }
  setCapWet(v) { v = clamp(v, 0, 1); if (Math.abs(v - this.capWet) > 0.004) { this.capWet = v; this._capMat(); } }

  /* ——— truy vấn ——— */
  // vòng gần điểm p nhất trên lọn → chỉ số vòng; khoảng cách bình phương ghi vào this.qd
  nearestRing(lk, p) {
    let best = 0, bd = 1e9; const C = lk.centers;
    for (let i = 0; i < RINGS; i += 1) {
      const dx = C[i * 3] - p.x, dy = C[i * 3 + 1] - p.y, dz = C[i * 3 + 2] - p.z, dd = dx * dx + dy * dy + dz * dz;
      if (dd < bd) { bd = dd; best = i; }
    }
    this.qd = bd; return best;
  }
  // vòng gần tia (o, d) nhất → chỉ số vòng; khoảng cách ghi vào this.qd
  rayRing(lk, o, d) {
    let best = 0, bd = 1e9; const C = lk.centers;
    for (let i = 0; i < RINGS; i += 2) {
      const wx = C[i * 3] - o.x, wy = C[i * 3 + 1] - o.y, wz = C[i * 3 + 2] - o.z, t = wx * d.x + wy * d.y + wz * d.z;
      const dd = wx * wx + wy * wy + wz * wz - t * t;
      if (dd < bd) { bd = dd; best = i; }
    }
    this.qd = Math.sqrt(Math.max(0, bd)); return best;
  }
  // Trọng số ảnh hưởng của mỗi lọn: gần điểm chạm (bán kính rNear) hoặc nằm dọc tia nhìn (bán kính rRay, "xuyên qua")
  weigh(p, o, d, rNear, rRay, hitLock, out) {
    for (const lk of this.locks) {
      let w = 0;
      if (p) { this.nearestRing(lk, p); const dist = Math.sqrt(this.qd); if (dist < rNear) w = 1 - dist / rNear; }
      if (o && rRay > 0) { this.rayRing(lk, o, d); if (this.qd < rRay) w = Math.max(w, 0.7 * (1 - this.qd / rRay)); }
      if (lk.i === hitLock) w = 1;
      out[lk.i] = w;
    }
    return out;
  }
  centerAt(lk, ring, out) { const C = lk.centers; return out.set(C[ring * 3], C[ring * 3 + 1], C[ring * 3 + 2]); }
  normalAt(lk, ring, out) { const N = lk.ringN; return out.set(N[ring * 3], N[ring * 3 + 1], N[ring * 3 + 2]); }
  ringS(lk, ring) { return lk.ringS[ring]; }
  // độ dài "len" tương ứng với vị trí s trên trục của lọn
  lenAtAxis(lk, s) { return s / (1 - CURL_SHRINK * effCurl(lk)) - lk.jit; }
  axisOfLen(lk, len) { return (len + lk.jit) * (1 - CURL_SHRINK * effCurl(lk)); }
  hang(lk) { return lk.len - lk.scalp; }
  maxWet() { let m = this.capWet; for (const lk of this.locks) if (lk.wet > m) m = lk.wet; return m; }

  /* ——— rung rinh (lò xo nhỏ quanh chân tóc) ——— */
  poke(lk, s) { const k = s / (0.8 + lk.len); lk.vx += (Math.random() - 0.5) * k; lk.vz += (Math.random() - 0.5) * k; }
  swish(omega) {
    for (const lk of this.locks) { const k = omega * 0.35 / (0.8 + lk.len); lk.vx += Math.sin(lk.a) * k; lk.vz -= Math.cos(lk.a) * k; }
  }

  // Mỗi khung hình: dựng lại lọn "bẩn", chuyển màu nhuộm, lò xo rung rinh
  update(dt) {
    let built = 0;
    for (const lk of this.locks) {
      if (lk.dirty && built < 12) { this._rebuild(lk); built++; }
      if (lk.fade < 1) { lk.fade = Math.min(1, lk.fade + dt / 0.35); lk.color.lerpColors(lk.from, lk.to, lk.fade); lk.matDirty = true; }
      if (lk.matDirty) this._mat(lk);
      if (lk.vx !== 0 || lk.vz !== 0 || lk.wx !== 0 || lk.wz !== 0) {
        const K = 70, C = 7, lim = 0.16 / (0.6 + lk.len * 0.6);
        lk.vx += (-K * lk.wx - C * lk.vx) * dt; lk.vz += (-K * lk.wz - C * lk.vz) * dt;
        lk.wx = clamp(lk.wx + lk.vx * dt, -lim, lim); lk.wz = clamp(lk.wz + lk.vz * dt, -lim, lim);
        if (Math.abs(lk.wx) + Math.abs(lk.wz) + Math.abs(lk.vx) + Math.abs(lk.vz) < 2e-4) lk.wx = lk.wz = lk.vx = lk.vz = 0;
        lk.mesh.rotation.set(lk.wx, 0, lk.wz);
      }
    }
  }
}
