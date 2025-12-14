function resolverSistema() {
  const ecuacion1 = document.getElementById("ecuacion1").value;
  const ecuacion2 = document.getElementById("ecuacion2").value;

  // Utilidades de formato
  const fmt = {
    gcd(a, b) {
      a = Math.round(a); b = Math.round(b);
      if (!a && !b) return 1;
      a = Math.abs(a); b = Math.abs(b);
      while (b) [a, b] = [b, a % b];
      return a || 1;
    },
    frac(n) {
      // Devuelve string de fracción simplificada o número
      if (!isFinite(n)) return "∅";
      const sgn = n < 0 ? "-" : "";
      const abs = Math.abs(n);
      if (Math.abs(abs - Math.round(abs)) < 1e-10) return String(Math.round(n));
      const denom = 1000000; // precisión
      const num = Math.round(abs * denom);
      const g = fmt.gcd(num, denom);
      const N = (num / g) | 0;
      const D = (denom / g) | 0;
      return `${sgn}${N}/${D}`;
    },
    num(n) {
      if (!isFinite(n)) return "∅";
      const r = Math.round(n * 1000) / 1000;
      return (Math.abs(r - Math.round(r)) < 1e-10) ? String(Math.round(r)) : String(r);
    },
    term(coeff, variable) {
      if (coeff === 0) return "";
      if (variable === "") return `${fmt.num(coeff)}`;
      const c = coeff;
      if (c === 1) return `+ ${variable}`;
      if (c === -1) return `- ${variable}`;
      return `${c > 0 ? "+ " : "- "}${fmt.num(Math.abs(c))}${variable}`;
    },
    axby(A, B, C) {
      const left =
        (A === 0 ? "" : `${A === 1 ? "" : (A === -1 ? "-" : fmt.num(A))}x`) +
        (B === 0 ? "" : `${B > 0 ? (A === 0 ? "" : " + ") : " - "}${Math.abs(B) === 1 ? "" : fmt.num(Math.abs(B))}y`);
      return `${left} = ${fmt.num(C)}`;
    }
  };

  // Parser robusto para Ax + By = C
  function parsearEcuacion(str) {
    str = str.replace(/\s+/g, "");
    const parts = str.split("=");
    if (parts.length !== 2) return null;
    const izq = parts[0], der = parts[1];

    // Normalizar signos: convertir "−" unicode a "-"
    const norm = s => s.replace(/−/g, "-");
    const L = norm(izq), R = norm(der);

    // Coeficientes
    let A = 0, B = 0;
    // Capturar x
    const mx = L.match(/([+\-]?\d*\.?\d*)x/);
    if (mx) {
      const raw = mx[1];
      if (raw === "" || raw === "+") A = 1;
      else if (raw === "-") A = -1;
      else A = parseFloat(raw);
    }
    // Capturar y
    const my = L.match(/([+\-]?\d*\.?\d*)y/);
    if (my) {
      const raw = my[1];
      if (raw === "" || raw === "+") B = 1;
      else if (raw === "-") B = -1;
      else B = parseFloat(raw);
    }
    const C = parseFloat(R);

    if (!isFinite(C)) return null; // debe tener un número a la derecha
    return { A, B, C };
  }

  const e1 = parsearEcuacion(ecuacion1);
  const e2 = parsearEcuacion(ecuacion2);

  if (!e1 || !e2) {
    document.getElementById("resultado").innerHTML = "<p>⚠️ Verifica el formato: usa Ax + By = C (ej: 2x - 3y = 6).</p>";
    limpiarPasos();
    limpiarGrafica();
    return;
  }

  const { A: A1, B: B1, C: C1 } = e1;
  const { A: A2, B: B2, C: C2 } = e2;

  // Determinantes (Regla de Cramer)
  const det = A1 * B2 - A2 * B1;
  let x = null, y = null;
  if (Math.abs(det) > 1e-12) {
    x = (C1 * B2 - C2 * B1) / det;
    y = (A1 * C2 - A2 * C1) / det;
  }

  // Clasificación del sistema
  let clasificacion = "";
  if (Math.abs(det) > 1e-12) clasificacion = "Sistema determinado (una solución). Rectas secantes.";
  else {
    // Probar proporción A, B, C para ver si son coincidentes o paralelas
    const kA = (A2 !== 0) ? A1 / A2 : (A1 === 0 ? 1 : Infinity);
    const kB = (B2 !== 0) ? B1 / B2 : (B1 === 0 ? 1 : Infinity);
    const kC = (C2 !== 0) ? C1 / C2 : (C1 === 0 ? 1 : Infinity);
    if (approxEq(kA, kB) && approxEq(kA, kC)) clasificacion = "Sistema indeterminado (infinitas soluciones). Rectas coincidentes.";
    else clasificacion = "Sistema incompatible (sin solución). Rectas paralelas.";
  }

  document.getElementById("resultado").innerHTML = (x !== null && y !== null)
    ? `<p>✅ Punto de intersección: <strong>(x = ${fmt.num(x)}, y = ${fmt.num(y)})</strong></p><p>📌 ${clasificacion}</p>`
    : `<p>⚠️ ${clasificacion}</p>`;

  // Pasos detallados

  // Sustitución (despejar x en ecuación 2 si B2 ≠ 0; si no, despejar y si A2 ≠ 0)
  if (x !== null && y !== null) {
    if (Math.abs(B2) > 1e-12) {
      // x = (C2 - B2*y)/A2 si A2 ≠ 0, o despejar y si A2 == 0
      const mx = (A2 !== 0)
        ? { label: "x", expr: `( ${fmt.num(C2)} ${B2 >= 0 ? "- " : "+ "}${fmt.num(Math.abs(B2))}y ) / ${fmt.num(A2)}` }
        : { label: "y", expr: `( ${fmt.num(C2)} ${A2 >= 0 ? "- " : "+ "}${fmt.num(Math.abs(A2))}x ) / ${fmt.num(B2)}` };

      const subLabel = mx.label === "x" ? "Sustituimos en la ecuación 1" : "Sustituimos en la ecuación 1";
      const resultadoVar = mx.label === "x" ? `y = ${fmt.num(y)}` : `x = ${fmt.num(x)}`;
      const finalVar = mx.label === "x" ? `x = ${fmt.num(x)}` : `y = ${fmt.num(y)}`;

      document.getElementById("pasos-sustitucion").innerHTML = `
        <p><strong>1. Despeje en ecuación 2:</strong> ${mx.label} = ${mx.expr}</p>
        <p><strong>2. ${subLabel}:</strong> ${fmt.axby(A1, B1, C1)} reemplazando ${mx.label}</p>
        <p><strong>3. Resolviendo:</strong> ${resultadoVar}</p>
        <p><strong>4. Sustitución final:</strong> ${finalVar}</p>
      `;
    } else if (Math.abs(A2) > 1e-12) {
      // y = (C2 - A2*x)/B2 (pero B2 = 0 aquí, así que despeje directo de x)
      // E2: A2 x + 0 y = C2 -> x = C2 / A2
      document.getElementById("pasos-sustitucion").innerHTML = `
        <p><strong>1. Despeje en ecuación 2:</strong> x = ${fmt.num(C2 / A2)}</p>
        <p><strong>2. Sustituimos en la ecuación 1:</strong> ${fmt.axby(A1, B1, C1)} reemplazando x</p>
        <p><strong>3. Resolviendo:</strong> y = ${fmt.num(y)}</p>
        <p><strong>4. Sustitución final:</strong> x = ${fmt.num(x)}</p>
      `;
    } else {
      document.getElementById("pasos-sustitucion").innerHTML = `<p>No es posible aplicar sustitución con la ecuación 2.</p>`;
    }
  } else {
    document.getElementById("pasos-sustitucion").innerHTML = `<p>El sistema no tiene solución única; sustitución no aplica.</p>`;
  }

  // Igualación (expresar x en ambas si A1, A2 ≠ 0; si no, intentar con y)
  if (x !== null && y !== null) {
    if (Math.abs(A1) > 1e-12 && Math.abs(A2) > 1e-12) {
      const x1 = `( ${fmt.num(C1)} ${B1 >= 0 ? "- " : "+ "}${fmt.num(Math.abs(B1))}y ) / ${fmt.num(A1)}`;
      const x2 = `( ${fmt.num(C2)} ${B2 >= 0 ? "- " : "+ "}${fmt.num(Math.abs(B2))}y ) / ${fmt.num(A2)}`;
      document.getElementById("pasos-igualacion").innerHTML = `
        <p><strong>1. De la ecuación 1:</strong> x = ${x1}</p>
        <p><strong>2. De la ecuación 2:</strong> x = ${x2}</p>
        <p><strong>3. Igualamos y resolvemos:</strong> y = ${fmt.num(y)}</p>
        <p><strong>4. Sustituimos:</strong> x = ${fmt.num(x)}</p>
      `;
    } else if (Math.abs(B1) > 1e-12 && Math.abs(B2) > 1e-12) {
      const y1 = `( ${fmt.num(C1)} ${A1 >= 0 ? "- " : "+ "}${fmt.num(Math.abs(A1))}x ) / ${fmt.num(B1)}`;
      const y2 = `( ${fmt.num(C2)} ${A2 >= 0 ? "- " : "+ "}${fmt.num(Math.abs(A2))}x ) / ${fmt.num(B2)}`;
      document.getElementById("pasos-igualacion").innerHTML = `
        <p><strong>1. De la ecuación 1:</strong> y = ${y1}</p>
        <p><strong>2. De la ecuación 2:</strong> y = ${y2}</p>
        <p><strong>3. Igualamos y resolvemos:</strong> x = ${fmt.num(x)}</p>
        <p><strong>4. Sustituimos:</strong> y = ${fmt.num(y)}</p>
      `;
    } else {
      document.getElementById("pasos-igualacion").innerHTML = `<p>No es posible aplicar igualación de forma estándar.</p>`;
    }
  } else {
    document.getElementById("pasos-igualacion").innerHTML = `<p>El sistema no tiene solución única; igualación no aplica.</p>`;
  }

  // Reducción (eliminar x o y)
  if (x !== null && y !== null) {
    // Elegir eliminar x si posible, si no y
    let m1 = 1, m2 = 1, elimina = "x";
    if (Math.abs(A1) > 1e-12 && Math.abs(A2) > 1e-12) {
      m1 = Math.abs(A2); m2 = Math.abs(A1);
      // Alineamos con signos opuestos
      if (Math.sign(A1) === Math.sign(A2)) m2 *= -1;
      elimina = "x";
    } else if (Math.abs(B1) > 1e-12 && Math.abs(B2) > 1e-12) {
      m1 = Math.abs(B2); m2 = Math.abs(B1);
      if (Math.sign(B1) === Math.sign(B2)) m2 *= -1;
      elimina = "y";
    } else {
      document.getElementById("pasos-reduccion").innerHTML = `<p>No es posible aplicar reducción (coeficientes nulos).</p>`;
      elimina = null;
    }

    if (elimina) {
      const A1p = m1 * A1, B1p = m1 * B1, C1p = m1 * C1;
      const A2p = m2 * A2, B2p = m2 * B2, C2p = m2 * C2;

      const sumA = A1p + A2p, sumB = B1p + B2p, sumC = C1p + C2p;
      const eliminado = elimina === "x" ? `${fmt.num(A1p)}x + ${fmt.num(A2p)}x = 0` : `${fmt.num(B1p)}y + ${fmt.num(B2p)}y = 0`;

      const resVar = elimina === "x"
        ? `y = ${fmt.num(sumC / sumB)}`
        : `x = ${fmt.num(sumC / sumA)}`;

      document.getElementById("pasos-reduccion").innerHTML = `
        <p><strong>1. Multiplicamos para igualar ${elimina}:</strong></p>
        <p>   (${fmt.axby(A1, B1, C1)}) × ${fmt.num(m1)} → ${fmt.axby(A1p, B1p, C1p)}</p>
        <p>   (${fmt.axby(A2, B2, C2)}) × ${fmt.num(m2)} → ${fmt.axby(A2p, B2p, C2p)}</p>
        <p><strong>2. Sumamos para eliminar ${elimina}:</strong> ${eliminado}</p>
        <p><strong>3. Resolviendo:</strong> ${resVar}</p>
        <p><strong>4. Sustituimos en cualquiera:</strong> x = ${fmt.num(x)}, y = ${fmt.num(y)}</p>
      `;
    }
  } else {
    document.getElementById("pasos-reduccion").innerHTML = `<p>El sistema no tiene solución única; reducción no aplica.</p>`;
  }

  // Dibujo estilo GeoGebra
  dibujarGrafica(A1, B1, C1, A2, B2, C2, x, y);
}

// Aproximación para comparar razones
function approxEq(a, b) {
  if (!isFinite(a) || !isFinite(b)) return false;
  return Math.abs(a - b) < 1e-9;
}

// Limpiezas
function limpiarPasos() {
  document.getElementById("pasos-sustitucion").innerHTML = "";
  document.getElementById("pasos-igualacion").innerHTML = "";
  document.getElementById("pasos-reduccion").innerHTML = "";
}
function limpiarGrafica() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Gráfica estilo GeoGebra: cuadrícula, ejes con flechas, marcas y etiquetas
function dibujarGrafica(A1, B1, C1, A2, B2, C2, x, y) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const escala = 30; // más detalle tipo GeoGebra
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const origenX = Math.floor(canvas.width / 2);
  const origenY = Math.floor(canvas.height / 2);

  // Cuadrícula
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= canvas.width; gx += escala) {
    ctx.beginPath();
    ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke();
  }
  for (let gy = 0; gy <= canvas.height; gy += escala) {
    ctx.beginPath();
    ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); ctx.stroke();
  }

  // Ejes con flechas
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1.5;
  // X
  ctx.beginPath();
  ctx.moveTo(0, origenY); ctx.lineTo(canvas.width, origenY); ctx.stroke();
  // Flecha X
  dibujarFlecha(ctx, canvas.width - 10, origenY, 0);
  // Y
  ctx.beginPath();
  ctx.moveTo(origenX, 0); ctx.lineTo(origenX, canvas.height); ctx.stroke();
  // Flecha Y
  dibujarFlecha(ctx, origenX, 10, -Math.PI / 2);

  // Marcas y números
  ctx.fillStyle = "#666";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    // X
    const px = origenX + i * escala;
    ctx.beginPath();
    ctx.moveTo(px, origenY - 4); ctx.lineTo(px, origenY + 4); ctx.strokeStyle = "#666"; ctx.stroke();
    ctx.fillText(i, px, origenY + 6);
    // Y
    const py = origenY - i * escala;
    ctx.beginPath();
    ctx.moveTo(origenX - 4, py); ctx.lineTo(origenX + 4, py); ctx.strokeStyle = "#666"; ctx.stroke();
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(i, origenX + 6, py);
    ctx.textAlign = "center"; ctx.textBaseline = "top";
  }

  // Función para dibujar rectas
  function dibujarRecta(A, B, C, color, etiqueta) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (Math.abs(B) < 1e-12) {
      // x = C/A
      const xv = C / A;
      const px = origenX + xv * escala;
      ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height);
      ctx.stroke();
    } else {
      let first = true;
      for (let xg = -canvas.width / (2 * escala); xg <= canvas.width / (2 * escala); xg += 0.05) {
        const yg = (C - A * xg) / B;
        const px = origenX + xg * escala;
        const py = origenY - yg * escala;
        if (first) { ctx.moveTo(px, py); first = false; } else { ctx.lineTo(px, py); }
      }
      ctx.stroke();
    }
    // Etiqueta de la recta
    ctx.fillStyle = color;
    ctx.font = "12px Arial";
    ctx.fillText(etiqueta, origenX + 8, origenY - 12);
  }

  dibujarRecta(A1, B1, C1, "#8e44ad", formLabel(A1, B1, C1));
  dibujarRecta(A2, B2, C2, "#1abc9c", formLabel(A2, B2, C2));

  // Punto de intersección
  if (x !== null && y !== null) {
    const px = origenX + x * escala;
    const py = origenY - y * escala;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();

    // Etiqueta del punto
    ctx.fillStyle = "#c0392b";
    ctx.font = "12px Arial";
    ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    ctx.fillText(`(${fmt.num(x)}, ${fmt.num(y)})`, px + 8, py - 6);
  }

  // Ejes etiquetas
  ctx.fillStyle = "#444";
  ctx.font = "13px Arial";
  ctx.textAlign = "right"; ctx.textBaseline = "top";
  ctx.fillText("x", canvas.width - 14, origenY + 6);
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("y", origenX + 6, 12);
}

function dibujarFlecha(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-8, 4);
  ctx.closePath();
  ctx.fillStyle = "#444";
  ctx.fill();
  ctx.restore();
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const resultado = document.getElementById("resultado").innerText;
  const sustitucion = document.getElementById("pasos-sustitucion").innerText;
  const igualacion = document.getElementById("pasos-igualacion").innerText;
  const reduccion = document.getElementById("pasos-reduccion").innerText;

  doc.setFontSize(14);
  doc.text("Solucionador de Ecuaciones Lineales", 10, 10);

  doc.setFontSize(12);
  doc.text("Resultados:", 10, 20);
  doc.text(doc.splitTextToSize(resultado, 180), 10, 30);

  doc.text("Método de Sustitución:", 10, 60);
  doc.text(doc.splitTextToSize(sustitucion, 180), 10, 70);

  doc.text("Método de Igualación:", 10, 110);
  doc.text(doc.splitTextToSize(igualacion, 180), 10, 120);

  doc.text("Método de Reducción:", 10, 160);
  doc.text(doc.splitTextToSize(reduccion, 180), 10, 170);

  doc.setFontSize(10);
  doc.text("Creado por Balnia Miranda", 10, 280);

  doc.save("solucion_ecuaciones.pdf");
}

// Helper para etiqueta corta de la recta
function formLabel(A, B, C) {
  // Devuelve Ax + By = C compacto
  const a = (A === 1) ? "" : (A === -1 ? "-" : String(A));
  const bSign = (B >= 0 ? " + " : " - ");
  const bMag = (Math.abs(B) === 1) ? "" : String(Math.abs(B));
  const left =
    (A === 0 ? "" : `${a}x`) +
    (B === 0 ? "" : `${(A === 0) ? "" : bSign}${bMag}y`);
  return `${left} = ${C}`;
}
