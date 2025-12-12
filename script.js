function resolverSistema() {
  // Solución manual del sistema
  const x = 0;
  const y = -2;

  // Mostrar resultados
  document.getElementById("resultado").innerHTML = `
    <p>✅ Punto de intersección: <strong>(x = ${x}, y = ${y})</strong></p>
    <p>📌 Sistema Determinado (una solución)</p>
    <p>✂️ Rectas Secantes</p>
  `;

  // Método de Sustitución
  document.getElementById("pasos-sustitucion").innerHTML = `
    <p>1. Despejamos x en la ecuación 2: x = y + 2</p>
    <p>2. Sustituimos en la ecuación 1: 2(y + 2) - 3y = 6</p>
    <p>3. Resolviendo: 2y + 4 - 3y = 6 → -y = 2 → y = -2</p>
    <p>4. Sustituimos: x = y + 2 → x = 0</p>
  `;

  // Método de Igualación
  document.getElementById("pasos-igualacion").innerHTML = `
    <p>1. Ecuación 1: x = (6 + 3y)/2</p>
    <p>2. Ecuación 2: x = y + 2</p>
    <p>3. Igualamos: (6 + 3y)/2 = y + 2</p>
    <p>4. Resolviendo: 6 + 3y = 2y + 4 → y = -2 → x = 0</p>
  `;

  // Método de Reducción
  document.getElementById("pasos-reduccion").innerHTML = `
    <p>1. Ecuaciones originales:<br> (1) 2x - 3y = 6<br> (2) x - y = -2</p>
    <p>2. Multiplicamos la ecuación (2) por 2 para igualar coeficientes de x:<br> 2x - 2y = -4</p>
    <p>3. Restamos la ecuación (1) menos la nueva (2):<br> (2x - 3y) - (2x - 2y) = 6 - (-4)</p>
    <p>4. Resolviendo: -y = 2 → y = -2</p>
    <p>5. Sustituimos en la ecuación (2): x - (-2) = -2 → x + 2 = -2 → x = 0</p>
  `;

  // Gráfica estilo GeoGebra
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const escala = 20;
  const origenX = canvas.width / 2;
  const origenY = canvas.height / 2;

  // Ejes
  ctx.beginPath();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.moveTo(0, origenY);
  ctx.lineTo(canvas.width, origenY);
  ctx.moveTo(origenX, 0);
  ctx.lineTo(origenX, canvas.height);
  ctx.stroke();

  // Marcas y números
  ctx.fillStyle = "#333";
  ctx.font = "10px Arial";
  for (let i = -10; i <= 10; i++) {
    // X
    ctx.beginPath();
    ctx.moveTo(origenX + i * escala, origenY - 5);
    ctx.lineTo(origenX + i * escala, origenY + 5);
    ctx.stroke();
    if (i !== 0) ctx.fillText(i, origenX + i * escala - 5, origenY + 15);

    // Y
    ctx.beginPath();
    ctx.moveTo(origenX - 5, origenY - i * escala);
    ctx.lineTo(origenX + 5, origenY - i * escala);
    ctx.stroke();
    if (i !== 0) ctx.fillText(i, origenX + 8, origenY - i * escala + 3);
  }

  // Función para dibujar rectas
  function dibujarRecta(funcion, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    for (let x = -10; x <= 10; x += 0.1) {
      const y = funcion(x);
      const px = origenX + x * escala;
      const py = origenY - y * escala;
      if (x === -10) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Rectas
  dibujarRecta(x => (2 * x - 6) / 3, "#8e44ad"); // 2x - 3y = 6
  dibujarRecta(x => x + 2, "#1abc9c");           // x - y = -2

  // Punto de intersección
  ctx.beginPath();
  ctx.arc(origenX + x * escala, origenY - y * escala, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
}

// Exportar como PDF
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

  // Firma educativa
  doc.setFontSize(10);
  doc.text("Creado por Balnia Miranda", 10, 280);

  doc.save("solucion_ecuaciones.pdf");
}
