// === SIMULADOR DE PÉNDULO SIMPLE ===
// Autor: José Leonardo Trespalacios Bedoya
// Materia: Física Mecánica y Laboratorio
// Corporación Unificada Nacional — Ingeniería en Sistemas

// --- VARIABLES PRINCIPALES ---
const canvas = document.getElementById('view'), ctx = canvas.getContext('2d');
let L = 1, g = 9.81, b = 0.015, beta = 0.01, theta = 30 * Math.PI / 180, omega = 0, simDuration = 60;
let running = false, lastTime = 0, simTime = 0, lastCrossTime = null, cycles = 0, smallCounter = 0;
const SMALL_FRAMES = 30, pxPerM = 260;

const elL = document.getElementById('L'), elTheta0 = document.getElementById('theta0'),
      elG = document.getElementById('g'), elB = document.getElementById('b'), elBeta = document.getElementById('beta'),
      elT = document.getElementById('Tdisp'), elT2 = document.getElementById('T2disp'), elN = document.getElementById('Ndisp'),
      timerDisp = document.getElementById('timerDisp'), eqMsg = document.getElementById('equilibrium'),
      Fval = document.getElementById('Fval'), Fbar = document.getElementById('Fbar'),
      Ebar = document.getElementById('Ebar'), Edisp = document.getElementById('Edisp'),
      tbody = document.querySelector('#tbl tbody');

let E0 = null;
let trail = [];

// --- FUNCIONES AUXILIARES ---
function clamp(x, a, b) {
  return Math.min(b, Math.max(a, x));
}

function setParamsFromUI() {
  L = clamp(parseFloat(elL.value) || 1, 0.1, 2.5);
  g = clamp(parseFloat(elG.value) || 9.81, 1, 30);
  b = clamp(parseFloat(elB.value) || 0.015, 0, 0.1);
  beta = clamp(parseFloat(elBeta.value) || 0.01, 0, 0.05);
  simDuration = clamp(parseFloat(document.getElementById('simDuration').value) || 60, 10, 300);
}

function resetState() {
  setParamsFromUI();
  const th0 = clamp(parseFloat(elTheta0.value) || 10, 0.5, 60);
  theta = th0 * Math.PI / 180;
  omega = 0;
  lastTime = 0;
  simTime = 0;
  timerDisp.textContent = '0.00';
  lastCrossTime = null;
  cycles = 0;
  smallCounter = 0;
  elT.textContent = '—';
  elT2.textContent = '—';
  elN.textContent = '0';
  trail = [];
  E0 = null;
  eqMsg.classList.add('hidden');
  tbody.innerHTML = '';
  draw();
}

// --- ECUACIÓN DIFERENCIAL ---
function f2(th, om) {
  return -(g / L) * Math.sin(th) - beta * om - b * Math.abs(om) * om;
}

function rk4(dt) {
  const f1 = (th, om) => om;
  const k1_th = f1(theta, omega), k1_om = f2(theta, omega);
  const k2_th = f1(theta + 0.5 * dt * k1_th, omega + 0.5 * dt * k1_om);
  const k2_om = f2(theta + 0.5 * dt * k1_th, omega + 0.5 * dt * k1_om);
  const k3_th = f1(theta + 0.5 * dt * k2_th, omega + 0.5 * dt * k2_om);
  const k3_om = f2(theta + 0.5 * dt * k2_th, omega + 0.5 * dt * k2_om);
  const k4_th = f1(theta + dt * k3_th, omega + dt * k3_om);
  const k4_om = f2(theta + dt * k3_th, omega + dt * k3_om);
  theta += dt / 6 * (k1_th + 2 * k2_th + 2 * k3_th + k4_th);
  omega += dt / 6 * (k1_om + 2 * k2_om + 2 * k3_om + k4_om);
}

// --- DIBUJO DE LA ESCENA ---
function draw() {
  ctx.fillStyle = "rgba(10,16,32,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2, topY = 80, len = Math.min(L * pxPerM, canvas.height - 100);
  const x = cx + len * Math.sin(theta), y = topY + len * Math.cos(theta);

  trail.push({ x, y });
  if (trail.length > 80) trail.shift();

  // Soporte superior
  ctx.strokeStyle = "#1f2a44";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 120, topY);
  ctx.lineTo(cx + 120, topY);
  ctx.stroke();

  // Rastro del péndulo
  for (let i = 0; i < trail.length - 1; i++) {
    const p1 = trail[i], p2 = trail[i + 1];
    const a = i / trail.length;
    ctx.strokeStyle = `rgba(56,189,248,${a * 0.6})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Cuerda luminosa
  const glow = Math.min(Math.abs(omega) * 80, 25);
  ctx.shadowBlur = glow;
  ctx.shadowColor = "rgba(56,189,248,0.9)";
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Masa del péndulo
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 18);
  gradient.addColorStop(0, "#22d3ee");
  gradient.addColorStop(1, "#0a1728");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();

  // Sombra
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(x, y + 16, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- FUERZA Y ENERGÍA ---
function updateForce() {
  const m = 1;
  const F = -m * g * Math.sin(theta) - m * L * (beta * omega + b * Math.abs(omega) * omega);
  const absF = Math.abs(F), maxF = m * g, pct = clamp(absF / maxF, 0, 1) * 100;
  Fval.textContent = F.toFixed(3) + ' N';
  Fbar.style.width = pct + '%';
}

function updateEnergy() {
  const m = 1;
  const Ec = 0.5 * m * Math.pow(L * omega, 2);
  const Ep = m * g * L * (1 - Math.cos(theta));
  const Et = Ec + Ep;
  if (E0 === null) E0 = Et;
  const ratio = Math.max(0, Math.min(Et / E0, 1));
  const pct = ratio * 100;
  Edisp.textContent = Et.toFixed(3) + " J";
  Ebar.style.width = pct + "%";
  if (ratio > 0.7) Ebar.style.background = "linear-gradient(90deg,#38bdf8,#22d3ee)";
  else if (ratio > 0.4) Ebar.style.background = "linear-gradient(90deg,#34d399,#10b981)";
  else if (ratio > 0.1) Ebar.style.background = "linear-gradient(90deg,#f59e0b,#fbbf24)";
  else Ebar.style.background = "linear-gradient(90deg,#ef4444,#991b1b)";
}

// --- EQUILIBRIO Y FINALIZACIÓN ---
function checkEquilibrium() {
  const angleSmall = Math.abs(theta) < (0.3 * Math.PI / 180),
        speedSmall = Math.abs(omega) < 0.002;

  if (angleSmall && speedSmall) {
    smallCounter++;
    if (smallCounter > SMALL_FRAMES) {
      running = false;
      eqMsg.classList.remove('hidden');
      eqMsg.querySelector('.msg').textContent = '🧘‍♂️ El péndulo ha llegado al equilibrio';
    }
  } else smallCounter = 0;

  if (simTime >= simDuration) {
    running = false;
    eqMsg.classList.remove('hidden');
    eqMsg.querySelector('.msg').textContent = `🧘‍♂️ Simulación finalizada (${simDuration}s)`;
  }
}

// --- ACTUALIZACIÓN PRINCIPAL ---
function update(dt) {
  const h = 0.001;
  let t = 0, prevTheta;

  while (t < dt) {
    const step = Math.min(h, dt - t);
    prevTheta = theta;
    rk4(step);
    t += step;

    if ((prevTheta > 0 && theta <= 0) || (prevTheta < 0 && theta >= 0)) {
      const now = simTime + t;
      if (lastCrossTime !== null) {
        const dT = now - lastCrossTime;
        if (dT > 0.02) {
          const T = 2 * dT, T2 = T * T;
          cycles++;
          elT.textContent = T.toFixed(3);
          elT2.textContent = T2.toFixed(3);
          elN.textContent = cycles;
          addRow(L, T, now, true);
        }
      }
      lastCrossTime = now;
    }
  }
  simTime += dt;
  timerDisp.textContent = simTime.toFixed(2);
  updateForce();
  updateEnergy();
  checkEquilibrium();
}

// --- BUCLE DE ANIMACIÓN ---
function loop(ts) {
  if (!running) { draw(); return; }
  if (!lastTime) lastTime = ts;
  const dt = Math.min(0.05, (ts - lastTime) / 1000);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// --- TABLA Y EXPORTACIÓN ---
function addRow(Lv, Tv, tiempo, prepend = false) {
  const tr = document.createElement('tr');
  const T2 = Tv * Tv;
  tr.innerHTML = `
    <td>${prepend ? tbody.children.length + 1 : tbody.children.length + 1}</td>
    <td>${Lv.toFixed(3)}</td>
    <td>${Tv.toFixed(3)}</td>
    <td>${T2.toFixed(3)}</td>
    <td>${tiempo.toFixed(2)}</td>`;
  if (prepend) tbody.prepend(tr); else tbody.appendChild(tr);
}

document.getElementById('btnExport').onclick = () => {
  if (tbody.children.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }
  const lines = ['#,L (m),T (s),T^2 (s^2),Tiempo (s)'];
  Array.from(tbody.children).forEach((r, i) => {
    lines.push(`${i + 1},${r.children[1].textContent},${r.children[2].textContent},${r.children[3].textContent},${r.children[4].textContent}`);
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pendulo.csv';
  a.click();
};

// --- BOTONES DE CONTROL ---
document.getElementById('btnStart').onclick = () => {
  if (!running) { resetState(); running = true; requestAnimationFrame(loop); }
};
document.getElementById('btnPause').onclick = () => { running = false; eqMsg.classList.add('hidden'); };
document.getElementById('btnReset').onclick = () => { running = false; resetState(); };

// --- INICIO ---
resetState();
draw();


