import { hexToRgb } from '../utils/helpers.js';

export function drawSwatch(canvas, item) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const c = item.colors, p = item.pat;
  ctx.clearRect(0, 0, W, H);

  const painters = { solid, wood, carpet, marble, stone, granite, tile, shaker, raised, flat, metal };
  const fn = painters[p];
  if (fn) fn(ctx, W, H, c);
}

function solid(ctx, W, H, c) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, 'rgba(255,255,255,0.08)');
  g.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function wood(ctx, W, H, c) {
  const pw = Math.round(W / 4);
  for (let x = 0; x < W; x += pw) {
    const ci = Math.floor(x / pw) % c.length;
    ctx.fillStyle = c[ci];
    ctx.fillRect(x, 0, pw - 1, H);
    const [r, g, b] = hexToRgb(c[ci]);
    for (let i = 0; i < 20; i++) {
      const y1 = Math.random() * H, yv = (Math.random() - 0.5) * H * 0.12;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.bezierCurveTo(x + pw * 0.35, y1 + yv, x + pw * 0.65, y1 - yv, x + pw, y1);
      ctx.strokeStyle = `rgba(${r - 18},${g - 18},${b - 18},0.22)`;
      ctx.lineWidth = Math.random() * 1.4 + 0.3;
      ctx.stroke();
    }
  }
}

function carpet(ctx, W, H, c) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, W, H);
  const [r, g, b] = hexToRgb(c[1] || c[0]);
  for (let x = 0; x < W; x += 3) {
    for (let y = 0; y < H; y += 3) {
      if (Math.random() > 0.55) {
        ctx.fillStyle = `rgba(${r},${g},${b},${0.18 + Math.random() * 0.28})`;
        ctx.fillRect(x + Math.random() * 2, y + Math.random() * 2, 2, 2);
      }
    }
  }
  const sg = ctx.createLinearGradient(0, 0, W * 0.65, H);
  sg.addColorStop(0, 'rgba(255,255,255,0.09)');
  sg.addColorStop(0.5, 'rgba(255,255,255,0)');
  sg.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);
}

function marble(ctx, W, H, c) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, c[0]);
  bg.addColorStop(0.45, c[1] || c[0]);
  bg.addColorStop(1, c[2] || c[1] || c[0]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  for (let v = 0; v < 6; v++) {
    ctx.beginPath();
    let cx = Math.random() * W, cy = Math.random() * H;
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 5; s++) {
      cx += (Math.random() - 0.5) * W * 0.32;
      cy += (Math.random() - 0.5) * H * 0.38;
      ctx.lineTo(cx, cy);
    }
    const [r, g, b] = hexToRgb(c[c.length - 1]);
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.1 + Math.random() * 0.16})`;
    ctx.lineWidth = Math.random() * 2 + 0.5;
    ctx.stroke();
  }
  const pg = ctx.createLinearGradient(0, 0, W * 0.55, H * 0.55);
  pg.addColorStop(0, 'rgba(255,255,255,0.16)');
  pg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = pg;
  ctx.fillRect(0, 0, W, H);
}

function stoneBase(ctx, W, H, c) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) {
    const ci = Math.floor(Math.random() * c.length);
    const [r, g, b] = hexToRgb(c[ci]);
    const x = Math.random() * W, y = Math.random() * H;
    const sz = Math.random() * 3 + 0.5;
    ctx.fillStyle = `rgba(${r},${g},${b},${0.35 + Math.random() * 0.55})`;
    ctx.beginPath();
    ctx.ellipse(x, y, sz, sz * 0.55, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function stone(ctx, W, H, c) {
  stoneBase(ctx, W, H, c);
  for (let v = 0; v < 10; v++) {
    ctx.beginPath();
    let cx = Math.random() * W, cy = Math.random() * H;
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 4; s++) {
      cx += (Math.random() - 0.5) * W * 0.25;
      cy += (Math.random() - 0.5) * H * 0.3;
      ctx.lineTo(cx, cy);
    }
    const [r, g, b] = hexToRgb(c[c.length - 1]);
    ctx.strokeStyle = `rgba(${r},${g},${b},0.2)`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  const gg = ctx.createLinearGradient(0, 0, W, H);
  gg.addColorStop(0, 'rgba(255,255,255,0.12)');
  gg.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = gg;
  ctx.fillRect(0, 0, W, H);
}

function granite(ctx, W, H, c) {
  stoneBase(ctx, W, H, c);
  const gg = ctx.createLinearGradient(0, 0, W, H);
  gg.addColorStop(0, 'rgba(255,255,255,0.12)');
  gg.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = gg;
  ctx.fillRect(0, 0, W, H);
}

function tile(ctx, W, H, c) {
  const tsz = Math.round(W / 6), grout = 2;
  ctx.fillStyle = '#5a5650';
  ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += tsz) {
    for (let y = 0; y < H; y += tsz) {
      ctx.fillStyle = c[0];
      ctx.fillRect(x + grout, y + grout, tsz - grout * 2, tsz - grout * 2);
      const sg = ctx.createLinearGradient(x, y, x + tsz, y + tsz);
      sg.addColorStop(0, 'rgba(255,255,255,0.1)');
      sg.addColorStop(1, 'rgba(0,0,0,0.07)');
      ctx.fillStyle = sg;
      ctx.fillRect(x + grout, y + grout, tsz - grout * 2, tsz - grout * 2);
    }
  }
}

function shaker(ctx, W, H, c) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, W, H);
  const pad = Math.round(Math.min(W, H) * 0.11);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 2, pad + 2, W - pad * 2 - 4, H - pad * 2 - 4);
  cabinetSheen(ctx, W, H);
}

function raised(ctx, W, H, c) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, W, H);
  const pad = Math.round(Math.min(W, H) * 0.09);
  const rg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.55);
  rg.addColorStop(0, c[0]);
  rg.addColorStop(1, c[1] || c[0]);
  ctx.fillStyle = rg;
  ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
  cabinetSheen(ctx, W, H);
}

function flat(ctx, W, H, c) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, W, H);
  cabinetSheen(ctx, W, H);
}

function cabinetSheen(ctx, W, H) {
  const sg = ctx.createLinearGradient(0, 0, W, H);
  sg.addColorStop(0, 'rgba(255,255,255,0.07)');
  sg.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);
}

function metal(ctx, W, H, c) {
  const mg = ctx.createLinearGradient(0, 0, W, H);
  for (let i = 0; i < c.length; i++) {
    mg.addColorStop(i / (c.length - 1), c[i]);
  }
  ctx.fillStyle = mg;
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 2) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.055})`;
    ctx.fillRect(0, y, W, 1);
  }
  const sh = ctx.createLinearGradient(0, 0, W * 0.35, 0);
  sh.addColorStop(0, 'rgba(255,255,255,0.22)');
  sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, W, H);
}
