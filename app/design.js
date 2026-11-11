// Dimensionarea orientativă a grinzilor (predimensionare), simplu rezemate, încărcare uniformă:
//  - oțel laminat IPE / HEA / HEB, S235 sau S355 (SR EN 1993-1-1): încovoiere (secțiuni clasa 1–2), forfecare, săgeată;
//    se presupune talpa comprimată legată continuu de placă (fără flambaj lateral prin încovoiere-răsucire);
//  - beton armat C25/30 + BST500S (SR EN 1992-1-1): secțiune, armătură longitudinală, etrieri, raport L/d;
//  - lemn lamelar GL24h (SR EN 1995-1-1): încovoiere, forfecare, săgeată finală cu fluaj.
// Rezultatele trebuie verificate de un inginer structurist; nu includ seismul, torsiunea sau încărcările concentrate.

// Proprietăți profile (tabele europene): h, b, tw, tf, r [mm]; A [cm²]; G [kg/m]; Iy [cm⁴]; Wpl,y [cm³]
const T = (rows) => rows.map(([name, h, b, tw, tf, r, A, G, Iy, Wpl]) => ({ name, h, b, tw, tf, r, A, G, Iy, Wpl }));
export const PROFILES = {
  IPE: T([
    ['IPE 100', 100, 55, 4.1, 5.7, 7, 10.3, 8.1, 171, 39.4], ['IPE 120', 120, 64, 4.4, 6.3, 7, 13.2, 10.4, 318, 60.7],
    ['IPE 140', 140, 73, 4.7, 6.9, 7, 16.4, 12.9, 541, 88.3], ['IPE 160', 160, 82, 5.0, 7.4, 9, 20.1, 15.8, 869, 124],
    ['IPE 180', 180, 91, 5.3, 8.0, 9, 23.9, 18.8, 1317, 166], ['IPE 200', 200, 100, 5.6, 8.5, 12, 28.5, 22.4, 1943, 221],
    ['IPE 220', 220, 110, 5.9, 9.2, 12, 33.4, 26.2, 2772, 285], ['IPE 240', 240, 120, 6.2, 9.8, 15, 39.1, 30.7, 3892, 367],
    ['IPE 270', 270, 135, 6.6, 10.2, 15, 45.9, 36.1, 5790, 484], ['IPE 300', 300, 150, 7.1, 10.7, 15, 53.8, 42.2, 8356, 628],
    ['IPE 330', 330, 160, 7.5, 11.5, 18, 62.6, 49.1, 11770, 804], ['IPE 360', 360, 170, 8.0, 12.7, 18, 72.7, 57.1, 16270, 1019],
    ['IPE 400', 400, 180, 8.6, 13.5, 21, 84.5, 66.3, 23130, 1307], ['IPE 450', 450, 190, 9.4, 14.6, 21, 98.8, 77.6, 33740, 1702],
    ['IPE 500', 500, 200, 10.2, 16.0, 21, 116, 90.7, 48200, 2194], ['IPE 550', 550, 210, 11.1, 17.2, 24, 134, 106, 67120, 2787],
    ['IPE 600', 600, 220, 12.0, 19.0, 24, 156, 122, 92080, 3512],
  ]),
  HEA: T([
    ['HEA 100', 96, 100, 5, 8, 12, 21.2, 16.7, 349, 83.0], ['HEA 120', 114, 120, 5, 8, 12, 25.3, 19.9, 606, 119],
    ['HEA 140', 133, 140, 5.5, 8.5, 12, 31.4, 24.7, 1033, 173], ['HEA 160', 152, 160, 6, 9, 15, 38.8, 30.4, 1673, 245],
    ['HEA 180', 171, 180, 6, 9.5, 15, 45.3, 35.5, 2510, 325], ['HEA 200', 190, 200, 6.5, 10, 18, 53.8, 42.3, 3692, 429],
    ['HEA 220', 210, 220, 7, 11, 18, 64.3, 50.5, 5410, 568], ['HEA 240', 230, 240, 7.5, 12, 21, 76.8, 60.3, 7763, 745],
    ['HEA 260', 250, 260, 7.5, 12.5, 24, 86.8, 68.2, 10450, 920], ['HEA 280', 270, 280, 8, 13, 24, 97.3, 76.4, 13670, 1112],
    ['HEA 300', 290, 300, 8.5, 14, 27, 112.5, 88.3, 18260, 1383], ['HEA 320', 310, 300, 9, 15.5, 27, 124.4, 97.6, 22930, 1628],
    ['HEA 340', 330, 300, 9.5, 16.5, 27, 133.5, 105, 27690, 1850], ['HEA 360', 350, 300, 10, 17.5, 27, 142.8, 112, 33090, 2088],
    ['HEA 400', 390, 300, 11, 19, 27, 159, 125, 45070, 2562], ['HEA 450', 440, 300, 11.5, 21, 27, 178, 140, 63720, 3216],
    ['HEA 500', 490, 300, 12, 23, 27, 197.5, 155, 86970, 3949],
  ]),
  HEB: T([
    ['HEB 100', 100, 100, 6, 10, 12, 26.0, 20.4, 450, 104], ['HEB 120', 120, 120, 6.5, 11, 12, 34.0, 26.7, 864, 165],
    ['HEB 140', 140, 140, 7, 12, 12, 43.0, 33.7, 1509, 246], ['HEB 160', 160, 160, 8, 13, 15, 54.3, 42.6, 2492, 354],
    ['HEB 180', 180, 180, 8.5, 14, 15, 65.3, 51.2, 3831, 482], ['HEB 200', 200, 200, 9, 15, 18, 78.1, 61.3, 5696, 643],
    ['HEB 220', 220, 220, 9.5, 16, 18, 91.0, 71.5, 8091, 827], ['HEB 240', 240, 240, 10, 17, 21, 106, 83.2, 11260, 1053],
    ['HEB 260', 260, 260, 10, 17.5, 24, 118.4, 93.0, 14920, 1283], ['HEB 280', 280, 280, 10.5, 18, 24, 131.4, 103, 19270, 1534],
    ['HEB 300', 300, 300, 11, 19, 27, 149.1, 117, 25170, 1869], ['HEB 320', 320, 300, 11.5, 20.5, 27, 161.3, 127, 30820, 2149],
    ['HEB 340', 340, 300, 12, 21.5, 27, 170.9, 134, 36660, 2408], ['HEB 360', 360, 300, 12.5, 22.5, 27, 180.6, 142, 43190, 2683],
    ['HEB 400', 400, 300, 13.5, 24, 27, 197.8, 155, 57680, 3232], ['HEB 450', 450, 300, 14, 26, 27, 218, 171, 79890, 3982],
    ['HEB 500', 500, 300, 14.5, 28, 27, 238.6, 187, 107200, 4815],
  ]),
};

// moment de inerție față de axa slabă z (cm⁴), pentru stâlpi
const IZ = { HEA: [134, 231, 389, 616, 925, 1336, 1955, 2769, 3668, 4763, 6310, 6985, 7436, 7887, 8564, 9465, 10370], HEB: [167, 318, 550, 889, 1363, 2003, 2843, 3923, 5135, 6595, 8563, 9239, 9690, 10140, 10820, 11720, 12620] };
for (const f of ['HEA', 'HEB']) PROFILES[f].forEach((x, i) => { x.Iz = IZ[f][i]; });
export const profileByName = (name) => Object.values(PROFILES).flat().find((x) => x.name === name);
const E_STEEL = 210000; // MPa
export const DEFLECTION = 250; // L/250 sub încărcarea caracteristică totală

// gk, qk: încărcări uniforme caracteristice FĂRĂ greutatea proprie a grinzii [kN/m]; L [m]
function steel(gk, qk, L, grade, fam, P) {
  const fy = grade === 'S355' ? 355 : 235;
  for (const s of PROFILES[fam]) {
    const g = gk + s.G * 9.81 / 1000;
    const qEd = P.gG * g + P.gQ * qk;
    const MEd = qEd * L * L / 8, VEd = qEd * L / 2;
    const McRd = s.Wpl * fy / 1000 / 1.0; // kNm (Wpl cm³ × MPa / 1000), γM0 = 1,0
    const Av = Math.max((s.A * 100 - 2 * s.b * s.tf + (s.tw + 2 * s.r) * s.tf), (s.h - 2 * s.tf) * s.tw) / 100; // cm²
    const VplRd = Av * 100 * fy / Math.sqrt(3) / 1000; // kN
    const defl = 5 * (g + qk) * Math.pow(L * 1000, 4) / (384 * E_STEEL * s.Iy * 1e4); // mm (q kN/m = N/mm)
    const lim = L * 1000 / DEFLECTION;
    const u = Math.max(MEd / McRd, VEd / VplRd, defl / lim);
    if (u <= 1) {
      return {
        name: `${s.name} ${grade}`, profile: s.name, grade, b: s.b / 1000, h: s.h / 1000, mass: s.G * L,
        MEd, VEd, MRd: McRd, VRd: VplRd, defl, lim, util: u,
        governs: u === MEd / McRd ? 'încovoiere' : u === VEd / VplRd ? 'forfecare' : 'săgeată',
        checks: [`M_Ed = ${MEd.toFixed(1)} kNm ≤ M_c,Rd = Wpl·fy = ${McRd.toFixed(1)} kNm`, `V_Ed = ${VEd.toFixed(1)} kN ≤ V_pl,Rd = ${VplRd.toFixed(1)} kN`, `săgeată ${defl.toFixed(1)} mm ≤ L/${DEFLECTION} = ${lim.toFixed(1)} mm`],
      };
    }
  }
  return null;
}

const BARS = [12, 14, 16, 18, 20, 22, 25, 28];
function concrete(gk, qk, L, P, bFixed, hMin) {
  const fcd = 25 / 1.5, fyd = 500 / 1.15, fck = 25;
  let h = Math.max(hMin ?? 0.3, Math.ceil(L / 12 / 0.05) * 0.05);
  for (let iter = 0; iter < 30; iter++, h = Math.round((h + 0.05) * 100) / 100) {
    const b = bFixed || Math.max(0.25, Math.round(h * 0.5 / 0.05) * 0.05);
    const d = h - 0.05;
    const g = gk + 25 * b * h;
    const qEd = P.gG * g + P.gQ * qk;
    const MEd = qEd * L * L / 8, VEd = qEd * L / 2;
    // limita de deformație prin raportul deschidere / înălțime utilă (grindă simplu rezemată, armare normală)
    if (L / d > 18) continue;
    const mu = MEd / 1000 / (b * d * d * fcd); // MNm / (m·m²·MPa)
    if (mu > 0.295) continue; // fără armătură comprimată, rupere ductilă
    const omega = 1 - Math.sqrt(1 - 2 * mu);
    const As = Math.max(omega * b * d * fcd / fyd, 0.26 * 2.6 / 500 * b * d, 0.0013 * b * d) * 1e4; // cm²
    // bare: cel mai mic număr de bare care încape pe lățime (distanța liberă ≥ 25 mm, acoperire 30 mm, etrier Ø8)
    let pick = null;
    for (const D of BARS) {
      const a1 = Math.PI * D * D / 400;
      const n = Math.max(2, Math.ceil(As / a1));
      const fit = Math.floor((b * 1000 - 2 * 30 - 2 * 8 + 25) / (D + 25));
      if (n <= fit && (!pick || n * a1 < pick.n * pick.a1 - 0.01)) pick = { D, n, a1 };
    }
    if (!pick) continue;
    // forfecare: V_Rd,c și etrieri Ø8 cu 2 ramuri (θ = 21,8°, cot θ = 2,5)
    const k = Math.min(2, 1 + Math.sqrt(200 / (d * 1000)));
    const rho = Math.min(0.02, pick.n * pick.a1 / 1e4 / (b * d));
    const VRdc = Math.max(0.12 * k * Math.cbrt(100 * rho * fck), 0.035 * Math.pow(k, 1.5) * Math.sqrt(fck)) * b * d * 1000; // kN
    const Asw = 2 * Math.PI * 64 / 4 / 1e6; // m² (2 × Ø8)
    const sReq = VEd > VRdc ? Asw * 0.9 * d * fyd * 1000 * 2.5 / VEd : Infinity; // m
    const sMax = Math.min(0.75 * d, 0.3);
    const s = Math.floor(Math.min(sReq, sMax) / 0.025) * 0.025;
    if (s < 0.075) continue;
    const VRdmax = 0.6 * (1 - fck / 250) * fcd * b * 0.9 * d / (2.5 + 0.4) * 1000; // kN, cot θ = 2,5
    if (VEd > VRdmax) continue;
    const AsProv = pick.n * pick.a1;
    const VRd = Math.max(VRdc, Number.isFinite(s) ? Asw / s * 0.9 * d * fyd * 1000 * 2.5 : 0);
    const util = Math.max(As / AsProv, VEd / VRd, (L / d) / 18);
    return {
      name: `Beton C25/30 ${Math.round(b * 100)}×${Math.round(h * 100)} cm`, b, h, MEd, VEd, util, As,
      rebar: `${pick.n}Ø${pick.D} jos (${(pick.n * pick.a1).toFixed(2)} cm² ≥ ${As.toFixed(2)} cm²), 2Ø12 sus constructiv`,
      stirrups: `etrieri Ø8/${Math.round(s * 100)} cm${VEd > VRdc ? '' : ' (minim constructiv)'}`,
      checks: [`M_Ed = ${MEd.toFixed(1)} kNm; μ = ${mu.toFixed(3)} ≤ 0,295; As,nec = ${As.toFixed(2)} cm²`, `V_Ed = ${VEd.toFixed(1)} kN; V_Rd,c = ${VRdc.toFixed(1)} kN`, `L/d = ${(L / d).toFixed(1)} ≤ 18 (control simplificat al săgeții)`],
    };
  }
  return null;
}

function timber(gk, qk, L, P) {
  const fmd = 0.8 * 24 / 1.25, fvd = 0.8 * 3.5 / 1.25, E = 11500, kdef = 0.6, psi2 = 0.3; // GL24h, clasa de serviciu 1, durată medie
  const widths = [0.10, 0.12, 0.14, 0.16, 0.20, 0.24];
  let best = null;
  for (const b of widths) {
    for (let h = 0.16; h <= 1.2; h = Math.round((h + 0.04) * 100) / 100) {
      if (h / b > 6) continue;
      const g = gk + 4.2 * b * h;
      const qEd = P.gG * g + P.gQ * qk;
      const MEd = qEd * L * L / 8, VEd = qEd * L / 2;
      const sm = MEd * 1e6 / (b * 1000 * Math.pow(h * 1000, 2) / 6);
      const tv = 1.5 * VEd * 1000 / (0.67 * b * 1000 * h * 1000);
      const I = b * 1000 * Math.pow(h * 1000, 3) / 12;
      const dG = 5 * g * Math.pow(L * 1000, 4) / (384 * E * I), dQ = 5 * qk * Math.pow(L * 1000, 4) / (384 * E * I);
      const dfin = dG * (1 + kdef) + dQ * (1 + psi2 * kdef);
      const lim = L * 1000 / DEFLECTION;
      const u = Math.max(sm / fmd, tv / fvd, dfin / lim);
      if (u <= 1) {
        const area = b * h;
        if (!best || area < best.b * best.h - 1e-9) best = { name: `Lemn lamelar GL24h ${Math.round(b * 100)}×${Math.round(h * 100)} cm`, b, h, MEd, VEd, util: u, checks: [`σ_m = ${sm.toFixed(1)} MPa ≤ f_m,d = ${fmd.toFixed(1)} MPa`, `τ = ${tv.toFixed(2)} MPa ≤ f_v,d = ${fvd.toFixed(2)} MPa`, `săgeată finală ${dfin.toFixed(1)} mm ≤ ${lim.toFixed(1)} mm`] };
        break;
      }
    }
  }
  return best;
}

// Dimensionează toate grinzile pe baza rezultatelor calculului de sarcini
export function designBeams(p, loads, grade = 'S235') {
  const P = loads.params;
  const out = [];
  for (const r of loads.items.filter((x) => x.type === 'beam')) {
    const el = p.elements.find((e) => e.id === r.id);
    if (!el) continue;
    const L = r.L;
    // încărcări fără greutatea proprie actuală (fiecare variantă își adaugă propria greutate)
    const gk = Math.max(0, (r.G - r.self) / L), qk = r.Q / L;
    const fams = ['IPE', 'HEA', 'HEB'].map((f) => steel(gk, qk, L, grade, f, P)).filter(Boolean);
    const c = concrete(gk, qk, L, P);
    const t = timber(gk, qk, L, P);
    const warn = [];
    const along = p.elements.find((w) => w.type === 'wall' && w.storey === el.storey && [el.a, el.b].every((q) => projectOnSegment_(q, w.a, w.b).d < w.thickness / 2 + 0.02));
    if (along) warn.push(`Grinda stă în lungul peretelui ${along.id.toUpperCase()} (în grosimea lui): în 3D e ascunsă de perete – bifează „Structură” în vederea 3D ca s-o vezi. Dacă e o centură, nu e nevoie de dimensionare ca grindă.`);
    if (!r.trib) warn.push('Grinda nu preia direct o placă: verifică stabilitatea laterală (flambaj prin încovoiere-răsucire) la oțel.');
    // reazeme pe zidărie → verificarea presiunii locale și cuzinet de beton
    const pads = [];
    for (const sup of beamEndSupports_(p, el)) {
      if (!sup || sup.e.type !== 'wall') { pads.push(null); continue; }
      const core = wc_(sup.e);
      if (M_[core.mat]?.kind !== 'zidarie') { pads.push(null); continue; }
      const bw = c ? c.b : (fams[0] ? fams[0].b : 0.2);
      const R = (P.gG * (gk + (c ? 25 * c.b * c.h : 1)) + P.gQ * qk) * L / 2;
      pads.push({ wall: sup.e, ...designPad(R, core.t, M_[core.mat].fd, bw) });
    }
    if (pads.some((x) => x && x.needed)) warn.push('Presiunea locală sub grindă depășește rezistența zidăriei: este necesar cuzinet de beton armat.');
    out.push({ id: el.id, name: r.name, storey: r.storey, L, gk, qk, steel: fams, concrete: c, timber: t, warn, el, pads });
  }
  return out;
}


// ------------------------------------------------------------------ stâlpi (compresiune centrică cu flambaj)
// N_Ek: încărcare axială caracteristică la bază FĂRĂ greutatea proprie a stâlpului (G, Q în kN); H: înălțime (m); beta: coeficient de flambaj
function steelColumn(G, Q, H, beta, grade, fam, P) {
  const fy = grade === 'S355' ? 355 : 235;
  const Lcr = beta * H * 1000; // mm
  for (const s of PROFILES[fam]) {
    const NEd = P.gG * (G + s.G * 9.81 / 1000 * H) + P.gQ * Q;
    const A = s.A * 100; // mm²
    const res = [];
    for (const [axis, I, alpha] of [['y', s.Iy, 0.34], ['z', s.Iz, 0.49]]) { // curbe de flambaj b (y-y) și c (z-z), profile laminate h/b ≤ 1,2
      const Ncr = Math.PI ** 2 * E_STEEL * I * 1e4 / (Lcr * Lcr); // N
      const lam = Math.sqrt(A * fy / Ncr);
      const phi = 0.5 * (1 + alpha * (lam - 0.2) + lam * lam);
      const chi = Math.min(1, 1 / (phi + Math.sqrt(Math.max(0, phi * phi - lam * lam))));
      res.push({ axis, lam, chi, NbRd: chi * A * fy / 1000 });
    }
    const gov = res[0].NbRd < res[1].NbRd ? res[0] : res[1];
    const NplRd = A * fy / 1000;
    const util = NEd / gov.NbRd;
    if (util <= 1) {
      return {
        name: `${s.name} ${grade}`, profile: s.name, grade, b: s.b / 1000, h: s.h / 1000, mass: s.G * H, NEd, util,
        governs: `flambaj după axa ${gov.axis}`,
        checks: [`N_Ed = ${NEd.toFixed(1)} kN ≤ N_b,Rd = χ·A·fy = ${gov.NbRd.toFixed(1)} kN (axa ${gov.axis})`, `λ̄_y = ${res[0].lam.toFixed(2)}, λ̄_z = ${res[1].lam.toFixed(2)}; χ_z = ${res[1].chi.toFixed(2)}`, `N_pl,Rd = ${NplRd.toFixed(0)} kN; L_cr = ${(Lcr / 1000).toFixed(2)} m`],
      };
    }
  }
  return null;
}

function concreteColumn(G, Q, H, beta, P) {
  // compresiune excentrică: e = max(h/30, 20 mm) + l0/400 (imperfecțiuni) + e2 (ordinul 2, metoda curburii nominale, Kr = Kφ = 1)
  const fcd = 25 / 1.5, fyd = 500 / 1.15, eyd = fyd / 200000;
  const l0 = beta * H;
  for (let b = 0.30; b <= 0.80; b = Math.round((b + 0.05) * 100) / 100) {
    const Ac = b * b, d = b - 0.05, d2 = 0.05;
    const NEd = P.gG * (G + 25 * Ac * H) + P.gQ * Q; // kN
    const n = NEd / 1000 / (Ac * fcd);
    if (n > 0.4) continue; // limita P100-1 pentru ductilitate
    const lam = l0 / (b / Math.sqrt(12));
    const lamLim = 20 * 0.7 * 1.1 * 0.7 / Math.sqrt(Math.max(n, 0.05));
    const e0 = Math.max(b / 30, 0.02) + l0 / 400;
    const e2 = lam > lamLim ? (2 * eyd / (0.9 * d)) * l0 * l0 / 10 : 0;
    const MEd = NEd * (e0 + e2); // kNm
    // armătură simetrică (bloc rectangular de compresiune 0,8x, ambele rânduri de bare curg)
    const x = NEd / 1000 / (0.8 * b * fcd); // m
    if (x > d) continue;
    const MRdConc = NEd * (b / 2 - 0.4 * x); // kNm
    const AsSide = Math.max(0, (MEd - MRdConc) / 1000 / (fyd * (d - d2))) * 1e4; // cm² pe o latură
    const AsNec = Math.max(2 * AsSide, 0.01 * Ac * 1e4); // minim 1% (P100-1)
    if (AsNec > 0.04 * Ac * 1e4) continue;
    let pick = null;
    for (const nb of [4, 8, 12]) for (const D of [14, 16, 18, 20, 22, 25]) {
      const a = nb * Math.PI * D * D / 400;
      if (a >= AsNec && (!pick || a < pick.a - 0.01)) pick = { nb, D, a };
    }
    if (!pick) continue;
    const MRd = MRdConc + (pick.a / 2) / 1e4 * fyd * 1000 * (d - d2);
    return {
      name: `Beton C25/30 ${Math.round(b * 100)}×${Math.round(b * 100)} cm`, b, h: b, NEd, util: Math.max(MEd / MRd, n / 0.4),
      rebar: `${pick.nb}Ø${pick.D} (${pick.a.toFixed(2)} cm² ≥ ${AsNec.toFixed(2)} cm²)`, stirrups: 'etrieri Ø8/15 cm, Ø8/10 cm la capete (zone critice)',
      checks: [`N_Ed = ${NEd.toFixed(1)} kN; ν = N_Ed/(A·fcd) = ${n.toFixed(2)} ≤ 0,40 (P100-1)`, `M_Ed = N·(e0 + ei${e2 ? ' + e2' : ''}) = ${MEd.toFixed(1)} kNm ≤ M_Rd = ${MRd.toFixed(1)} kNm`, `λ = ${lam.toFixed(1)} ${lam > lamLim ? '>' : '≤'} λ_lim = ${lamLim.toFixed(1)}${e2 ? ` → ordinul 2: e2 = ${(e2 * 1000).toFixed(0)} mm` : ''}`],
    };
  }
  return null;
}

function timberColumn(G, Q, H, beta, P) {
  const fcd = 0.8 * 24 / 1.25, E005 = 9600; // GL24h
  const l0 = beta * H * 1000;
  for (const b of [0.12, 0.14, 0.16, 0.18, 0.20, 0.24, 0.28, 0.32]) {
    const A = b * b * 1e6;
    const NEd = P.gG * (G + 4.2 * b * b * H) + P.gQ * Q;
    const lam = l0 / (b * 1000 / Math.sqrt(12));
    const lrel = lam / Math.PI * Math.sqrt(24 / E005);
    const k = 0.5 * (1 + 0.1 * (lrel - 0.3) + lrel * lrel);
    const kc = Math.min(1, 1 / (k + Math.sqrt(k * k - lrel * lrel)));
    const sc = NEd * 1000 / A;
    const util = sc / (kc * fcd);
    if (util <= 1) return { name: `Lemn lamelar GL24h ${Math.round(b * 100)}×${Math.round(b * 100)} cm`, b, h: b, NEd, util, checks: [`σ_c = ${sc.toFixed(2)} MPa ≤ k_c·f_c,d = ${(kc * fcd).toFixed(2)} MPa`, `λ = ${lam.toFixed(0)}; k_c = ${kc.toFixed(2)}`] };
  }
  return null;
}

export function designColumns(p, loads, grade = 'S235', beta = 1.0) {
  const P = loads.params;
  const out = [];
  for (const r of loads.items.filter((x) => x.type === 'column')) {
    const el = p.elements.find((e) => e.id === r.id);
    if (!el) continue;
    const H = el.height;
    const G = Math.max(0, r.G - r.self), Q = r.Q;
    out.push({
      id: el.id, name: r.name, storey: r.storey, H, G, Q, el,
      steel: ['HEA', 'HEB'].map((f) => steelColumn(G, Q, H, beta, grade, f, P)).filter(Boolean),
      concrete: concreteColumn(G, Q, H, beta, P), timber: timberColumn(G, Q, H, beta, P),
      warn: r.foundation ? [] : [],
    });
  }
  return out;
}


// ------------------------------------------------------------------ cuzineți (reazemul grinzii pe zidărie)
// Presiunea locală sub reazem: σ = R / (a·t) ≤ β·f_d, β = 1,25 (încărcare concentrată, SR EN 1996-1-1, 6.1.3)
export function designPad(R, wallCoreT, fd, beamW) {
  const beta = 1.25;
  const sigmaBeam = R / 1000 / (beamW * Math.min(wallCoreT, 0.25)); // MPa, grinda direct pe zidărie (rezemare ≤ 25 cm)
  const Areq = R / 1000 / (beta * fd); // m²
  const a = Math.max(0.3, Math.ceil(Areq / wallCoreT / 0.05) * 0.05, Math.ceil((beamW + 0.2) / 0.05) * 0.05);
  const h = a > 0.6 ? 0.3 : 0.2;
  const sigma = R / 1000 / (a * wallCoreT);
  return { R, a, h, sigma, sigmaBeam, fd, limit: beta * fd, needed: sigmaBeam > beta * fd, util: sigma / (beta * fd),
    check: `R_Ed = ${R.toFixed(1)} kN; fără cuzinet σ = ${sigmaBeam.toFixed(2)} MPa ${sigmaBeam > beta * fd ? '>' : '≤'} 1,25·f_d = ${(beta * fd).toFixed(2)} MPa; cu cuzinet ${Math.round(a * 100)}×${Math.round(wallCoreT * 100)}×${Math.round(h * 100)} cm: σ = ${sigma.toFixed(2)} MPa` };
}

// ------------------------------------------------------------------ buiandrugi (grinzi peste goluri în pereți)
import { MATERIALS as M_, projectOnSegment as projectOnSegment_, beamEndSupports as beamEndSupports_, wallCore as wc_, lintelOf as lo_, layersOf as la_, isOpening as io_, LINTEL_BEARING } from './model.js';
export function designLintels(p, loads, grade = 'S235') {
  const P = loads.params;
  const out = [];
  for (const o of p.elements.filter(io_)) {
    const lin = lo_(p, { ...o, lintelH: o.lintelH || 0.25 });
    if (!lin) continue;
    const w = lin.w;
    const L = o.width + LINTEL_BEARING; // deschiderea de calcul ≈ lumina + o jumătate de rezemare la fiecare capăt
    const r = loads.items.find((x) => x.id === w.id);
    const Lw = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    // zidăria de deasupra golului + încărcările primite de perete la partea de sus (planșee, pereți de deasupra)
    const above = Math.max(0, w.height - o.sill - o.height);
    const wallG = la_(w).reduce((a, l) => a + (M_[l.m]?.gamma || 0) * l.t, 0) * above;
    const recG = r ? Math.max(0, (r.G - r.self) / Lw) : 0, recQ = r ? r.Q / Lw : 0;
    const gk = wallG + recG, qk = recQ;
    const b = Math.max(0.15, Math.round(lin.core.t * 100) / 100);
    const c = concrete(gk, qk, L, P, b, 0.2);
    const n = b > 0.2 ? 2 : 1; // la zidăria groasă: două profile alăturate, fiecare preia jumătate
    const st = ['IPE', 'HEA'].map((f) => steel(gk / n, qk / n, L, grade, f, P)).filter(Boolean).map((x) => ({ ...x, n }));
    out.push({ id: o.id, o, wall: w, L, gk, qk, above, b, concrete: c, steel: st, fd: M_[lin.core.mat]?.fd || 0 });
  }
  return out;
}
