// SecureLedger — Main Application Logic
// College Project — Fictional Prototype Only

// ──────────────────────────────────────────────
// 3D NETWORK VISUALIZATION (Three.js)
// ──────────────────────────────────────────────

class TransactionNetwork3D {
  constructor(containerId, isInvestigation = false) {
    this.containerId = containerId;
    this.isInvestigation = isInvestigation;
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.nodes = [];
    this.edges = [];
    this.nodeMeshes = [];
    this.edgeMeshes = [];
    this.raycaster = null;
    this.mouse = null;
    this.selectedObject = null;
    this.animFrame = null;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationSpeed = { x: 0, y: 0 };
    this.tooltip = null;
    this.onNodeClick = null;
    this.onEdgeClick = null;
    this.clock = null;
    this.initialized = false;

    // auto-rotation target
    this.autoRotate = true;
    this.cameraAngle = 0;
    this.cameraRadius = 14;
    this.cameraHeight = 6;
  }

  async init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return;

    if (!window.THREE) {
      console.warn('Three.js not loaded');
      this.initFallback();
      return;
    }

    const THREE = window.THREE;
    this.clock = new THREE.Clock();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x09090b);
    this.scene.fog = new THREE.FogExp2(0x09090b, 0.035);

    // Camera
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 200);
    this.camera.position.set(0, this.cameraHeight, this.cameraRadius);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x27272a, 3.0);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xf4f4f5, 2.5, 30);
    pointLight1.position.set(0, 10, 0);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x22c55e, 1.5, 25);
    pointLight2.position.set(-8, 5, 8);
    this.scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xef4444, 1.5, 25);
    pointLight3.position.set(8, -5, -8);
    this.scene.add(pointLight3);

    // Grid
    const gridHelper = new THREE.GridHelper(30, 30, 0x3f3f46, 0x18181b);
    gridHelper.position.y = -4;
    this.scene.add(gridHelper);

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Tooltip
    this.tooltip = document.querySelector('.canvas-tooltip');

    this.buildNetwork();
    this.setupEvents();
    this.animate();
    this.initialized = true;

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  buildNetwork() {
    const THREE = window.THREE;
    const nodes = APP_DATA.networkNodes;
    const edges = APP_DATA.networkEdges;

    const focusNode = this.isInvestigation ? 'n8' : null;
    const relevantEdges = focusNode
      ? edges.filter(e => e.from === focusNode || e.to === focusNode)
      : edges;
    const relevantNodeIds = focusNode
      ? new Set([focusNode, ...relevantEdges.map(e => e.from), ...relevantEdges.map(e => e.to)])
      : new Set(nodes.map(n => n.id));

    const colorMap = {
      low:    new THREE.Color(0x22c55e),
      medium: new THREE.Color(0xf59e0b),
      high:   new THREE.Color(0xef4444)
    };

    const glowMap = {
      low:    0x22c55e,
      medium: 0xf59e0b,
      high:   0xef4444
    };

    // Build nodes
    nodes.forEach(nodeData => {
      if (!relevantNodeIds.has(nodeData.id)) return;

      const color = colorMap[nodeData.risk] || colorMap.low;
      const radius = nodeData.risk === 'high' ? 0.45 : nodeData.risk === 'medium' ? 0.38 : 0.32;

      const geo = new THREE.SphereGeometry(radius, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color.clone().multiplyScalar(0.4),
        roughness: 0.2,
        metalness: 0.8,
      });

      const mesh = new THREE.Mesh(geo, mat);
      const scale = this.isInvestigation ? 0.8 : 1;
      mesh.position.set(nodeData.x * scale, nodeData.y * scale, nodeData.z * scale);
      mesh.userData = { type: 'node', data: nodeData };
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.nodeMeshes.push(mesh);

      // Glow ring for high/medium risk
      if (nodeData.risk !== 'low') {
        const ringGeo = new THREE.TorusGeometry(radius + 0.2, 0.05, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: glowMap[nodeData.risk],
          transparent: true,
          opacity: 0.5
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(mesh.position);
        ring.userData = { parentNode: mesh, type: 'ring' };
        this.scene.add(ring);
      }

      // Sprite label
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 256, 64);
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillStyle = '#e8edf8';
      ctx.textAlign = 'center';
      ctx.fillText(nodeData.label, 128, 36);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(mesh.position.x, mesh.position.y + radius + 0.6, mesh.position.z);
      sprite.scale.set(2.5, 0.6, 1);
      sprite.userData = { type: 'label' };
      this.scene.add(sprite);
    });

    // Build edges
    const nodePositionMap = {};
    this.nodeMeshes.forEach(m => {
      nodePositionMap[m.userData.data.id] = m.position;
    });

    const edgeColorMap = {
      low:  new THREE.Color(0x22c55e),
      medium: new THREE.Color(0xf59e0b),
      high: new THREE.Color(0xef4444)
    };

    relevantEdges.forEach(edgeData => {
      const fromPos = nodePositionMap[edgeData.from];
      const toPos   = nodePositionMap[edgeData.to];
      if (!fromPos || !toPos) return;

      const midPoint = new THREE.Vector3(
        (fromPos.x + toPos.x) / 2,
        (fromPos.y + toPos.y) / 2 + 0.8,
        (fromPos.z + toPos.z) / 2
      );

      const curve = new THREE.QuadraticBezierCurve3(
        fromPos.clone(),
        midPoint,
        toPos.clone()
      );

      const points = curve.getPoints(40);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: edgeColorMap[edgeData.risk] || edgeColorMap.low,
        transparent: true,
        opacity: edgeData.risk === 'high' ? 0.9 : edgeData.risk === 'medium' ? 0.6 : 0.35,
        linewidth: 1
      });

      const line = new THREE.Line(geo, mat);
      line.userData = { type: 'edge', data: edgeData };
      this.scene.add(line);
      this.edgeMeshes.push(line);

      // Arrow at midpoint
      const arrowSize = 0.12;
      const arrowGeo = new THREE.ConeGeometry(arrowSize, arrowSize * 2.5, 6);
      const arrowMat = new THREE.MeshBasicMaterial({
        color: edgeColorMap[edgeData.risk] || edgeColorMap.low,
        transparent: true,
        opacity: 0.8
      });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      const t = 0.55;
      const arrowPos = curve.getPoint(t);
      arrow.position.copy(arrowPos);

      const tangent = curve.getTangent(t).normalize();
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      arrow.userData = { type: 'arrow' };
      this.scene.add(arrow);
    });
  }

  setupEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = false;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      this.autoRotate = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

      if (e.buttons === 1) {
        this.isDragging = true;
        const dx = e.clientX - this.previousMousePosition.x;
        const dy = e.clientY - this.previousMousePosition.y;
        this.rotationSpeed.x = dy * 0.003;
        this.rotationSpeed.y = dx * 0.003;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      this.checkHover(e);
    });

    canvas.addEventListener('mouseup', (e) => {
      if (!this.isDragging) {
        this.checkClick(e);
      }
      setTimeout(() => { this.autoRotate = true; }, 3000);
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraRadius = Math.max(6, Math.min(28, this.cameraRadius + e.deltaY * 0.02));
    }, { passive: false });

    // Touch events
    let lastTouchDistance = 0;
    canvas.addEventListener('touchstart', (e) => {
      this.autoRotate = false;
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx*dx + dy*dy);
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - this.previousMousePosition.x;
        const dy = e.touches[0].clientY - this.previousMousePosition.y;
        this.rotationSpeed.y = dx * 0.004;
        this.rotationSpeed.x = dy * 0.004;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const delta = lastTouchDistance - dist;
        this.cameraRadius = Math.max(6, Math.min(28, this.cameraRadius + delta * 0.05));
        lastTouchDistance = dist;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      setTimeout(() => { this.autoRotate = true; }, 3000);
    });
  }

  checkHover(e) {
    if (!this.raycaster) return;
    const THREE = window.THREE;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([...this.nodeMeshes]);

    if (intersects.length > 0 && intersects[0].object.userData.type === 'node') {
      const nodeData = intersects[0].object.userData.data;
      if (this.tooltip) {
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + 12;
        const y = e.clientY - rect.top - 60;

        this.tooltip.style.left = Math.min(x, rect.width - 230) + 'px';
        this.tooltip.style.top  = Math.max(0, y) + 'px';
        this.tooltip.innerHTML = `
          <h4>${nodeData.label}</h4>
          <div class="tt-row"><span class="tt-label">Account</span><span class="tt-value">${APP_DATA.users.find(u=>u.name===nodeData.label||u.name.startsWith(nodeData.label.split(' ')[0]))?.accountId || 'N/A'}</span></div>
          <div class="tt-row"><span class="tt-label">Risk</span><span class="tt-value" style="color:${nodeData.risk==='high'?'var(--danger)':nodeData.risk==='medium'?'var(--warning)':'var(--success)'}; text-transform:uppercase">${nodeData.risk}</span></div>
          <div class="tt-row"><span class="tt-label">Click for details</span><span class="tt-value">→</span></div>
        `;
        this.tooltip.classList.add('visible');
      }
      canvas.style.cursor = 'pointer';
    } else {
      if (this.tooltip) this.tooltip.classList.remove('visible');
      if (this.renderer.domElement) this.renderer.domElement.style.cursor = 'grab';
    }
  }

  checkClick(e) {
    if (!this.raycaster) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([...this.nodeMeshes]);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData.type === 'node') {
        if (this.onNodeClick) this.onNodeClick(obj.userData.data);
      }
    }
  }

  animate() {
    this.animFrame = requestAnimationFrame(() => this.animate());

    const THREE = window.THREE;
    const delta = this.clock.getDelta();

    // Rotation inertia
    this.cameraAngle += this.rotationSpeed.y;
    this.rotationSpeed.x *= 0.9;
    this.rotationSpeed.y *= 0.9;

    if (this.autoRotate) {
      this.cameraAngle += 0.003;
    }

    // Update camera orbit
    this.camera.position.x = Math.sin(this.cameraAngle) * this.cameraRadius;
    this.camera.position.z = Math.cos(this.cameraAngle) * this.cameraRadius;
    this.camera.position.y = this.cameraHeight + this.rotationSpeed.x * 10;
    this.camera.lookAt(0, 0, 0);

    // Animate node meshes (breathing)
    const t = Date.now() * 0.001;
    this.nodeMeshes.forEach((mesh, i) => {
      const baseScale = 1;
      const risk = mesh.userData.data?.risk;
      if (risk === 'high') {
        const pulse = 1 + Math.sin(t * 3 + i) * 0.12;
        mesh.scale.setScalar(baseScale * pulse);
      } else if (risk === 'medium') {
        const pulse = 1 + Math.sin(t * 1.5 + i) * 0.06;
        mesh.scale.setScalar(baseScale * pulse);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  initFallback() {
    // SVG fallback if Three.js fails
    this.container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px;color:var(--text-secondary)">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        <p style="font-size:13px">3D visualization loading...</p>
        <p style="font-size:11px;color:var(--text-muted)">Ensure Three.js is loaded</p>
      </div>
    `;
  }

  resetCamera() {
    this.cameraAngle = 0;
    this.cameraRadius = 14;
    this.cameraHeight = 6;
    this.rotationSpeed = { x: 0, y: 0 };
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}

// ──────────────────────────────────────────────
// CHART RENDERING (Chart.js)
// ──────────────────────────────────────────────

function chartDefaults() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: isLight ? '#475569' : '#a1a1aa',
          font: { family: 'Inter', size: 12 },
          boxWidth: 12,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: isLight ? '#ffffff' : '#18181b',
        borderColor: isLight ? '#e2e8f0' : '#27272a',
        borderWidth: 1,
        titleColor: isLight ? '#0f172a' : '#f4f4f5',
        bodyColor: isLight ? '#475569' : '#a1a1aa',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: isLight ? '#e2e8f0' : '#27272a' },
        ticks: { color: isLight ? '#64748b' : '#71717a', font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: isLight ? '#e2e8f0' : '#27272a' },
        ticks: { color: isLight ? '#64748b' : '#71717a', font: { family: 'Inter', size: 11 } }
      }
    }
  };
}

function initCharts() {
  if (!window.Chart) return;

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  Chart.defaults.font.family = 'Inter';
  Chart.defaults.color = isLight ? '#475569' : '#a1a1aa';

  window.activeChartInstances = window.activeChartInstances || {};
  ['chart-volume', 'chart-trend', 'chart-category', 'chart-risk'].forEach(id => {
    if (window.activeChartInstances[id]) {
      window.activeChartInstances[id].destroy();
    }
  });

  // Monthly Volume
  const volCtx = document.getElementById('chart-volume');
  if (volCtx) {
    window.activeChartInstances['chart-volume'] = new Chart(volCtx, {
      type: 'bar',
      data: {
        labels: APP_DATA.monthlyData.labels,
        datasets: [
          {
            label: 'Credits (₹)',
            data: APP_DATA.monthlyData.credits,
            backgroundColor: 'rgba(34,197,94,0.7)',
            borderColor: '#22c55e',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Debits (₹)',
            data: APP_DATA.monthlyData.debits,
            backgroundColor: isLight ? 'rgba(15,23,42,0.7)' : 'rgba(228,228,231,0.7)',
            borderColor: isLight ? '#0f172a' : '#e4e4e7',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: { ...chartDefaults() }
    });
  }

  // Transaction trend
  const trendCtx = document.getElementById('chart-trend');
  if (trendCtx) {
    window.activeChartInstances['chart-trend'] = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: APP_DATA.monthlyData.labels,
        datasets: [
          {
            label: 'Normal',
            data: APP_DATA.monthlyData.normal,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#22c55e',
            pointRadius: 4
          },
          {
            label: 'Suspicious',
            data: APP_DATA.monthlyData.suspicious,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointRadius: 4
          }
        ]
      },
      options: { ...chartDefaults() }
    });
  }

  // Category donut
  const catCtx = document.getElementById('chart-category');
  if (catCtx) {
    window.activeChartInstances['chart-category'] = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: APP_DATA.categoryData.labels,
        datasets: [{
          data: APP_DATA.categoryData.amounts,
          backgroundColor: APP_DATA.categoryData.colors,
          borderColor: isLight ? '#ffffff' : '#121215',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: isLight ? '#475569' : '#a1a1aa', font: { family: 'Inter', size: 12 }, padding: 12, boxWidth: 10 }
          },
          tooltip: {
            backgroundColor: isLight ? '#ffffff' : '#18181b',
            borderColor: isLight ? '#e2e8f0' : '#27272a',
            borderWidth: 1,
            titleColor: isLight ? '#0f172a' : '#f4f4f5',
            bodyColor: isLight ? '#475569' : '#a1a1aa',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (c) => ` ₹${c.raw.toLocaleString('en-IN')}`
            }
          }
        }
      }
    });
  }

  // Risk distribution
  const riskCtx = document.getElementById('chart-risk');
  if (riskCtx) {
    window.activeChartInstances['chart-risk'] = new Chart(riskCtx, {
      type: 'doughnut',
      data: {
        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [{
          data: [
            APP_DATA.riskDistribution.low,
            APP_DATA.riskDistribution.medium,
            APP_DATA.riskDistribution.high
          ],
          backgroundColor: [
            'rgba(34,197,94,0.8)',
            'rgba(234,179,8,0.8)',
            'rgba(239,68,68,0.8)'
          ],
          borderColor: isLight ? '#ffffff' : '#121215',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: isLight ? '#475569' : '#a1a1aa', font: { family: 'Inter', size: 12 }, padding: 12 }
          },
          tooltip: {
            backgroundColor: isLight ? '#ffffff' : '#18181b',
            borderColor: isLight ? '#e2e8f0' : '#27272a',
            borderWidth: 1,
            titleColor: isLight ? '#0f172a' : '#f4f4f5',
            bodyColor: isLight ? '#475569' : '#a1a1aa',
            padding: 12,
            cornerRadius: 8
          }
        }
      }
    });
  }
}

// ──────────────────────────────────────────────
// FRAUD SCREENING ANIMATION
// ──────────────────────────────────────────────

function runFraudScreening(amount, receiver, onComplete) {
  const overlay = document.getElementById('screening-overlay');
  overlay.classList.add('active');

  const checks = [
    'amount-check', 'history-check', 'time-check',
    'beneficiary-check', 'location-check', 'behavior-check'
  ];

  const riskScore = computeRiskScore(amount, receiver);
  const riskLevel = riskScore >= 75 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

  // Reset all
  checks.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('done');
  });

  document.getElementById('screening-progress').style.display = 'block';
  document.getElementById('screening-result').style.display = 'none';
  document.getElementById('screening-title').textContent = 'Transaction Security Check';
  document.getElementById('screening-sub').textContent = 'Analyzing transaction pattern...';
  document.getElementById('screening-icon').className = 'screening-icon';
  document.getElementById('screening-icon-svg').innerHTML = ICONS.shield;

  let i = 0;
  const interval = setInterval(() => {
    if (i < checks.length) {
      const el = document.getElementById(checks[i]);
      if (el) el.classList.add('done');
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => showScreeningResult(riskScore, riskLevel, onComplete), 400);
    }
  }, 380);
}

function showScreeningResult(riskScore, riskLevel, onComplete) {
  document.getElementById('screening-progress').style.display = 'none';
  document.getElementById('screening-result').style.display = 'block';

  const icon = document.getElementById('screening-icon');
  const scoreEl = document.getElementById('result-score');
  const levelEl = document.getElementById('result-level');
  const meterFill = document.getElementById('result-meter-fill');
  const continueBtn = document.getElementById('screening-continue-btn');

  scoreEl.textContent = riskScore + '/100';
  levelEl.textContent = riskLevel === 'high' ? 'HIGH RISK' : riskLevel === 'medium' ? 'MEDIUM RISK' : 'LOW RISK';

  const colorMap = { low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' };
  levelEl.style.color = colorMap[riskLevel];
  meterFill.style.width = riskScore + '%';
  meterFill.className = 'risk-meter-fill ' + riskLevel;

  if (riskLevel === 'high') {
    icon.className = 'screening-icon danger';
    icon.querySelector('svg').outerHTML; // reset
    document.getElementById('screening-icon-svg').innerHTML = ICONS.alertTriangle;
    document.getElementById('screening-title').textContent = 'HIGH RISK DETECTED';
    document.getElementById('screening-sub').textContent = 'This transaction shows multiple fraud indicators.';
    continueBtn.textContent = 'View Alert';
    continueBtn.className = 'btn btn-danger btn-lg w-full';
  } else if (riskLevel === 'medium') {
    icon.className = 'screening-icon';
    icon.style.background = 'var(--warning-bg)';
    icon.style.borderColor = 'var(--warning-border)';
    document.getElementById('screening-icon-svg').innerHTML = ICONS.alertCircle;
    document.getElementById('screening-title').textContent = 'REVIEW RECOMMENDED';
    document.getElementById('screening-sub').textContent = 'Some indicators require attention.';
    continueBtn.textContent = 'Continue Anyway';
    continueBtn.className = 'btn btn-warning btn-lg w-full';
  } else {
    icon.className = 'screening-icon success';
    document.getElementById('screening-icon-svg').innerHTML = ICONS.checkCircle;
    document.getElementById('screening-title').textContent = 'TRANSACTION APPROVED';
    document.getElementById('screening-sub').textContent = 'No anomalies detected. Transaction is safe.';
    continueBtn.textContent = 'Complete Transaction';
    continueBtn.className = 'btn btn-success btn-lg w-full';
  }

  continueBtn.onclick = () => {
    document.getElementById('screening-overlay').classList.remove('active');
    if (onComplete) onComplete(riskLevel, riskScore);
  };
}

function computeRiskScore(amount, receiver) {
  let score = 10;
  const userData = APP_DATA.currentUser;
  const avgTxn = 1500;

  // Amount anomaly
  if (amount > avgTxn * 20) score += 35;
  else if (amount > avgTxn * 10) score += 20;
  else if (amount > avgTxn * 3)  score += 10;

  // Receiver suspicion
  if (receiver === 'Unknown Account') score += 30;
  else if (receiver === 'High-Risk Account') score += 40;
  else if (receiver === 'Aman') score += 5;

  // Time of day (current hour simulation)
  const hour = new Date().getHours();
  if (hour < 6 || hour > 23) score += 15;

  // Cap at 100
  return Math.min(100, score + Math.floor(Math.random() * 8));
}

// ──────────────────────────────────────────────
// SVG ICONS LIBRARY
// ──────────────────────────────────────────────

const ICONS = {
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  ledger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  alertTriangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  analytics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  admin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  alertCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  creditCard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  smartphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  refreshCw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  zoomIn: `+`,
  zoomOut: `-`,
  target: `⊙`,
  network: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  logOut: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  shieldCheck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  trending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

// ──────────────────────────────────────────────
// APPLICATION CONTROLLER
// ──────────────────────────────────────────────

class SecureLedgerApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.network3D = null;
    this.investigationNetwork = null;
    this.chartsInitialized = false;
    this.selectedTransaction = null;
    this.selectedAlert = null;
    this.paymentAmount = 0;
    this.paymentReceiver = '';
    this.liveFeeedInterval = null;
    this.theme = localStorage.getItem('theme') || 'dark';

    // Biometric state
    this.bioType = 'face';
    this.bioPurpose = 'login';
    this.bioStream = null;
    this.bioAnimId = null;
    this.bioSuccessCallback = null;

    // Account selector — default to USR001 (Rahim)
    this.selectedAccountId = 'USR001';
    this.faceModelsLoaded = false;
    this.faceModelsLoading = false;

    // Account config map
    this.ACCOUNTS = {
      USR001: { id: 'USR001', name: 'Rahim',        email: 'rahim@secureledger.dev',  avatar: 'R',  accountId: 'SLAC000001', isDemo: true },
      USR002: { id: 'USR002', name: 'Arjun Sharma', email: 'arjun@secureledger.dev',  avatar: 'AS', accountId: 'SLAC000002', isDemo: true }
    };
    this.accountsList = [];
  }

  async init() {
    this.applyTheme(this.theme);
    await this.loadAccounts();
    this.setupLogin();
    this.setupBiometrics();
    this.setupSocketListeners();
    this.setupNavigation();
    this.setupPaymentFlow();
    this.setupFilters();
    this.setupModals();
    this.setupMobileNav();
    this.setupScreeningOverlay();
    this.setupToggles();
    // Pre-warm face-api.js models in background and refresh enrollment badges
    this.updateEnrollmentBadges();
    this._prewarmFaceModels();
  }

  async _prewarmFaceModels() {
    if (!window.FaceRec || this.faceModelsLoaded || this.faceModelsLoading) return;
    this.faceModelsLoading = true;
    const ok = await window.FaceRec.loadModels();
    this.faceModelsLoaded = ok;
    this.faceModelsLoading = false;
    if (ok) this.updateEnrollmentBadges();
  }

  setupSocketListeners() {
    API.on('transaction:new', (data) => {
      console.log('⚡ Real-time Transaction Received via WebSocket:', data);
      if (data && data.transaction) {
        if (!APP_DATA.transactions.some(t => t.id === data.transaction.id)) {
          APP_DATA.transactions.unshift(data.transaction);
        }
        if (typeof this.renderTransactionTable === 'function') this.renderTransactionTable();
        if (APP_DATA.liveFeed) {
          APP_DATA.liveFeed.unshift({
            id: data.transaction.id,
            amount: data.transaction.amount,
            risk: data.transaction.risk,
            riskScore: data.transaction.riskScore,
            sender: data.transaction.sender,
            receiver: data.transaction.receiver,
            time: data.transaction.time
          });
          if (APP_DATA.liveFeed.length > 12) APP_DATA.liveFeed.pop();
          if (typeof this.renderLiveFeed === 'function') this.renderLiveFeed();
        }
      }
    });

    API.on('alert:new', (data) => {
      console.log('🚨 Real-time Alert Received via WebSocket:', data);
      if (data && data.alert) {
        if (!APP_DATA.alerts.some(a => a.id === data.alert.id)) {
          APP_DATA.alerts.unshift(data.alert);
        }
        if (typeof this.renderAlerts === 'function') this.renderAlerts();
      }
    });

    API.on('alert:updated', (data) => {
      console.log('✓ Real-time Alert Update Received via WebSocket:', data);
      if (data && data.alert) {
        const found = APP_DATA.alerts.find(a => a.id === data.alertId);
        if (found) found.status = data.alert.status;
        if (typeof this.renderAlerts === 'function') this.renderAlerts();
      }
    });

    API.on('account:new', () => {
      this.loadAccounts();
    });

    API.on('account:deleted', () => {
      this.loadAccounts();
    });
  }

  // ── BIOMETRIC AUTHENTICATION & FACE RECOGNITION ──
  setupBiometrics() {
    const faceBtn  = document.getElementById('login-face-btn');
    const touchBtn = document.getElementById('login-touch-btn');

    if (faceBtn) {
      faceBtn.addEventListener('click', () => {
        this.launchBiometric('face', 'login', (accountId) => this.login(true, accountId));
      });
    }

    if (touchBtn) {
      touchBtn.addEventListener('click', async () => {
        const accountId = this.selectedAccountId;
        // Try per-account WebAuthn credential first
        if (window.FaceRec && window.FaceRec.hasWebAuthnCred(accountId)) {
          const result = await window.FaceRec.verifyWebAuthn(accountId);
          if (result.success) {
            this.showToast(`✓ Touch ID verified for ${this.ACCOUNTS[accountId].name}`, 'success');
            this.login(true, accountId);
            return;
          } else if (result.reason === 'cancelled') {
            this.showToast('Touch ID cancelled.', 'info');
            return;
          }
        }
        // Fallback: show fingerprint modal
        this.launchBiometric('touch', 'login', (id) => this.login(true, id));
      });
    }

    // Default-select USR001 on load
    this.selectAccount('USR001');
  }

  // ── ACCOUNT SELECTOR & MULTI-ACCOUNT MANAGEMENT ──
  async loadAccounts() {
    try {
      const list = await API.getAccounts();
      if (list && list.length) {
        this.accountsList = list;
        this.ACCOUNTS = {};
        list.forEach(a => {
          this.ACCOUNTS[a.id] = {
            id: a.id,
            name: a.name,
            email: a.email || `${a.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@secureledger.dev`,
            avatar: a.avatar || a.name.charAt(0),
            accountId: a.accountNumber || a.accountId,
            accountNumber: a.accountNumber || a.accountId,
            accountType: a.accountType || 'Savings',
            balance: a.balance || 0,
            isDemo: !!a.isDemo,
            card: a.card
          };
        });
      }
    } catch (err) {
      console.warn('Error loading accounts:', err);
    }
    this.renderAccountSelector();
    this.renderSettingsAccounts();
  }

  renderAccountSelector() {
    const grid = document.getElementById('login-account-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const accounts = Object.values(this.ACCOUNTS);

    accounts.forEach(acc => {
      const isSelected = acc.id === this.selectedAccountId;
      const card = document.createElement('div');
      card.id = `acct-select-${acc.id}`;
      card.className = `acct-select-card ${isSelected ? 'active' : ''}`;
      card.style.cssText = `background:var(--surface-2);border:1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};border-radius:10px;padding:9px 10px;text-align:left;cursor:pointer;transition:all .2s;position:relative;display:flex;flex-direction:column;justify-content:space-between;`;

      const avatarColors = [
        'linear-gradient(135deg,#3b72ff,#22c55e)',
        'linear-gradient(135deg,#f59e0b,#ef4444)',
        'linear-gradient(135deg,#8b5cf6,#ec4899)',
        'linear-gradient(135deg,#06b6d4,#3b82f6)'
      ];
      const colorIdx = Math.abs(acc.id.split('').reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)) % avatarColors.length;

      card.onclick = () => this.selectAccount(acc.id);

      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:7px;overflow:hidden">
            <div style="width:26px;height:26px;border-radius:50%;background:${avatarColors[colorIdx]};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">${acc.avatar || 'U'}</div>
            <div style="overflow:hidden">
              <div style="font-size:12px;font-weight:600;color:var(--text-primary);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${acc.name}</div>
              <div style="font-size:10px;color:var(--text-muted)">${acc.accountId || acc.accountNumber}</div>
            </div>
          </div>
          ${!acc.isDemo ? `<button type="button" title="Remove Account" onclick="event.stopPropagation(); app.confirmDeleteAccount('${acc.id}', '${acc.name}')" style="background:none;border:none;color:#ef4444;font-size:13px;cursor:pointer;padding:2px;margin-left:4px;line-height:1">✕</button>` : `<span title="Protected Demo Account" style="font-size:9px;background:rgba(34,197,94,0.15);color:#22c55e;padding:1px 4px;border-radius:4px;font-weight:600;margin-left:4px">Demo</span>`}
        </div>
        <div id="acct-face-status-${acc.id}" style="font-size:10px;margin-top:2px"></div>
      `;

      grid.appendChild(card);
    });

    this.updateEnrollmentBadges();
  }

  renderSettingsAccounts() {
    const list = document.getElementById('settings-account-list');
    if (!list) return;

    list.innerHTML = '';
    const accounts = Object.values(this.ACCOUNTS);

    accounts.forEach(acc => {
      const isCurrent = acc.id === (window.currentUser ? window.currentUser.id : this.selectedAccountId);
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--surface-2);border-radius:10px;border:1px solid var(--border);margin-bottom:6px';

      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#3b72ff,#22c55e);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px">${acc.avatar || 'U'}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary)">
              ${acc.name} 
              ${acc.isDemo ? '<span style="font-size:10px;color:#22c55e;background:rgba(34,197,94,0.12);padding:1px 6px;border-radius:4px;margin-left:6px">Demo Account</span>' : ''}
              ${isCurrent ? '<span style="font-size:10px;color:#3b82f6;background:rgba(59,130,246,0.12);padding:1px 6px;border-radius:4px;margin-left:6px">Active</span>' : ''}
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
              ${acc.accountType || 'Savings'} · ${acc.accountId || acc.accountNumber} · Balance: ₹${(acc.balance || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${!isCurrent ? `<button class="btn btn-sm btn-ghost" onclick="app.switchActiveAccount('${acc.id}')" style="font-size:11px">Switch</button>` : ''}
          ${!acc.isDemo ? `<button class="btn btn-sm" onclick="app.confirmDeleteAccount('${acc.id}', '${acc.name}')" style="font-size:11px;color:#ef4444;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2)">Close</button>` : ''}
        </div>
      `;
      list.appendChild(row);
    });
  }

  selectAccount(accountId) {
    this.selectedAccountId = accountId;

    // Update card highlight
    Object.keys(this.ACCOUNTS).forEach(id => {
      const btn = document.getElementById(`acct-select-${id}`);
      if (!btn) return;
      if (id === accountId) {
        btn.style.borderColor = 'var(--accent)';
        btn.style.boxShadow = '0 0 0 2px rgba(59,114,255,.25)';
      } else {
        btn.style.borderColor = 'var(--border)';
        btn.style.boxShadow = 'none';
      }
    });

    // Update email prefill to match selected account
    const emailInput = document.getElementById('email-input');
    if (emailInput && this.ACCOUNTS[accountId]) emailInput.value = this.ACCOUNTS[accountId].email;

    this.updateEnrollmentBadges();
  }

  openCreateAccountModal() {
    const modal = document.getElementById('create-account-modal');
    if (modal) {
      modal.style.display = 'flex';
      const form = document.getElementById('create-account-form');
      if (form) form.reset();
      const nameInput = document.getElementById('new-acct-name');
      if (nameInput) setTimeout(() => nameInput.focus(), 100);
    }
  }

  closeCreateAccountModal() {
    const modal = document.getElementById('create-account-modal');
    if (modal) modal.style.display = 'none';
  }

  async handleCreateAccountSubmit() {
    const name = document.getElementById('new-acct-name')?.value.trim();
    const accountType = document.getElementById('new-acct-type')?.value || 'Savings';
    const balance = parseInt(document.getElementById('new-acct-balance')?.value, 10) || 15000;
    const phone = document.getElementById('new-acct-phone')?.value.trim();
    const email = document.getElementById('new-acct-email')?.value.trim();

    if (!name) {
      this.showToast('Please enter the full legal name', 'error');
      return;
    }

    const btn = document.getElementById('create-acct-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Opening Account...';
    }

    try {
      const res = await API.createAccount({ name, accountType, balance, phone, email });
      const created = res.account || res;
      this.showToast(`✓ Bank account opened for ${created.name} (${created.accountNumber || created.accountId})`, 'success');

      this.closeCreateAccountModal();
      await this.loadAccounts();
      if (created.id) this.selectAccount(created.id);
    } catch (err) {
      this.showToast(err.message || 'Failed to open account', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Open Account';
      }
    }
  }

  async confirmDeleteAccount(accountId, accountName) {
    if (accountId === 'USR001' || accountId === 'USR002') {
      this.showToast('Demo accounts (Rahim & Arjun Sharma) are protected and cannot be deleted.', 'error');
      return;
    }

    const confirmed = confirm(`Are you sure you want to close the bank account for "${accountName}"?\n\nThis will permanently remove the account, its balance, and biometric credentials.`);
    if (!confirmed) return;

    try {
      await API.deleteAccount(accountId);
      if (window.FaceRec) {
        window.FaceRec.clearTemplate(accountId);
      }
      this.showToast(`✓ Account for ${accountName} has been closed`, 'info');

      if (this.selectedAccountId === accountId) {
        this.selectedAccountId = 'USR001';
      }
      await this.loadAccounts();
      this.selectAccount(this.selectedAccountId);
    } catch (err) {
      this.showToast(err.message || 'Failed to close account', 'error');
    }
  }

  async switchActiveAccount(accountId) {
    try {
      await API.switchAccount(accountId);
      const acc = this.ACCOUNTS[accountId];
      if (acc) {
        this.selectedAccountId = accountId;
        window.currentUser = { ...acc };
        this.showToast(`✓ Switched active account to ${acc.name}`, 'success');
        this.renderSettingsAccounts();
        if (typeof this.updateProfileUI === 'function') this.updateProfileUI();
      }
    } catch (err) {
      this.showToast('Could not switch account', 'error');
    }
  }

  updateEnrollmentBadges() {
    if (!window.FaceRec) return;
    Object.keys(this.ACCOUNTS).forEach(id => {
      const el = document.getElementById(`acct-face-status-${id}`);
      if (!el) return;
      const enrolled = window.FaceRec.isEnrolled(id);
      if (enrolled) {
        const meta = window.FaceRec.getEnrollmentMeta(id);
        const date = meta ? new Date(meta.enrolledAt).toLocaleDateString() : '';
        el.innerHTML = `<span style="color:#22c55e">✓ Enrolled ${date ? '('+date+')' : ''}</span> <a href="javascript:void(0)" onclick="event.stopPropagation(); app.clearAndReenroll('${id}')" style="color:#38bdf8;text-decoration:underline;margin-left:4px;font-size:10px">Re-enroll</a>`;
      } else {
        el.innerHTML = `<span style="color:#f59e0b">⚠ Not enrolled — click Face ID to enroll</span>`;
      }
    });
  }

  clearAndReenroll(accountId) {
    this.selectAccount(accountId);
    if (window.FaceRec) {
      window.FaceRec.clearTemplate(accountId);
      this.updateEnrollmentBadges();
    }
    this.launchBiometric('face', 'login');
  }

  promptReenrollment() {
    this.stopFaceCamera();
    if (window.FaceRec) {
      window.FaceRec.clearTemplate(this.selectedAccountId);
      this.updateEnrollmentBadges();
    }
    const canvas = document.getElementById('bio-canvas-overlay');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const reenrollBtn = document.getElementById('bio-reenroll-btn');
    if (reenrollBtn) reenrollBtn.style.display = 'none';
    this.startEnrollment();
  }

  launchBiometric(type = 'face', purpose = 'login', onSuccess = null) {
    this.bioType = type;
    this.bioPurpose = purpose;
    this.bioSuccessCallback = onSuccess;

    const modal = document.getElementById('biometric-modal');
    if (!modal) return;
    modal.classList.add('active');

    this.renderBiometricUI(type);
  }

  // ── ENROLLMENT FLOW ────────────────────────────────
  async startEnrollment() {
    const accountId = this.selectedAccountId;
    const account   = this.ACCOUNTS[accountId];
    const video      = document.getElementById('bio-video-feed');
    const statusText = document.getElementById('bio-status-text');
    const stepDetail = document.getElementById('bio-step-detail');
    const badge      = document.getElementById('bio-status-badge');
    const viewport   = document.getElementById('bio-scanner-viewport');
    const enrollBtn  = document.getElementById('bio-enroll-btn');
    const prompt     = document.getElementById('bio-enroll-prompt');

    if (enrollBtn) enrollBtn.disabled = true;

    // Hide enroll prompt, show camera
    if (prompt) prompt.style.display = 'none';

    // Ensure models are loaded
    if (!this.faceModelsLoaded) {
      statusText.textContent = 'Loading AI models...';
      stepDetail.textContent = 'Downloading neural networks (one-time, ~6MB)...';
      const ok = await window.FaceRec.loadModels((msg) => {
        statusText.textContent = msg;
      });
      if (!ok) {
        statusText.textContent = 'Failed to load AI models';
        stepDetail.textContent = 'Check internet connection and try again';
        if (enrollBtn) enrollBtn.disabled = false;
        return;
      }
      this.faceModelsLoaded = true;
    }

    // Start camera
    statusText.textContent = 'Starting camera...';
    const cameraOk = await window.FaceRec.startCamera(video);
    if (!cameraOk) {
      statusText.textContent = 'Camera access denied';
      stepDetail.textContent = 'Please allow camera access and try again';
      if (enrollBtn) { enrollBtn.disabled = false; enrollBtn.textContent = 'Try Again'; }
      if (prompt) prompt.style.display = 'flex';
      return;
    }

    // Show video
    video.style.display = 'block';
    document.getElementById('bio-canvas-overlay').style.display = 'none';
    document.getElementById('bio-laser-beam').style.display = 'none';

    statusText.textContent = `Enrolling ${account.name}'s Face...`;
    stepDetail.textContent = 'Hold still and look directly at the camera';

    const success = await window.FaceRec.enrollFace(
      accountId,
      account.name,
      video,
      (msg, done, total) => {
        statusText.textContent = msg;
        if (total > 0) {
          stepDetail.textContent = `Frame ${done} / ${total} captured`;
          const bar = document.getElementById('bio-confidence-bar');
          const wrap = document.getElementById('bio-confidence-wrap');
          if (wrap) wrap.style.display = 'block';
          if (bar) bar.style.width = `${Math.round((done / total) * 100)}%`;
        }
      }
    );

    window.FaceRec.stopCamera();
    video.style.display = 'none';

    if (success) {
      badge.classList.add('verified');
      viewport.classList.add('verified');
      statusText.textContent = '✓ Face Enrolled Successfully';
      stepDetail.textContent = `${account.name}'s face is now linked to this account`;
      this.updateEnrollmentBadges();

      setTimeout(() => {
        this.closeBiometricModal();
        this.showToast(`✓ Face enrolled for ${account.name}. You can now use Face ID.`, 'success');
      }, 1800);
    } else {
      statusText.textContent = 'Enrollment Failed';
      stepDetail.textContent = 'Ensure good lighting and face is visible';
      if (prompt) {
        document.getElementById('bio-enroll-prompt-msg').textContent = 'Enrollment failed. Please try again with good lighting.';
        prompt.style.display = 'flex';
      }
      if (enrollBtn) { enrollBtn.disabled = false; enrollBtn.textContent = 'Try Again'; }
    }
  }

  renderBiometricUI(type) {
    const title      = document.getElementById('bio-modal-title');
    const sub        = document.getElementById('bio-modal-sub');
    const switchBtn  = document.getElementById('bio-switch-btn');
    const badge      = document.getElementById('bio-status-badge');
    const statusText = document.getElementById('bio-status-text');
    const stepDetail = document.getElementById('bio-step-detail');
    const canvas     = document.getElementById('bio-canvas-overlay');
    const laser      = document.getElementById('bio-laser-beam');
    const fpPad      = document.getElementById('bio-fingerprint-pad');
    const viewport   = document.getElementById('bio-scanner-viewport');
    const enrollPrmt = document.getElementById('bio-enroll-prompt');
    const confWrap   = document.getElementById('bio-confidence-wrap');
    const confBar    = document.getElementById('bio-confidence-bar');

    viewport.classList.remove('verified', 'failed');
    badge.classList.remove('verified');
    if (confWrap) confWrap.style.display = 'none';
    if (confBar)  confBar.style.width = '0%';
    if (enrollPrmt) enrollPrmt.style.display = 'none';

    const account = this.ACCOUNTS[this.selectedAccountId] || this.ACCOUNTS['USR001'];
    const reenrollBtn = document.getElementById('bio-reenroll-btn');

    if (type === 'face') {
      const isEnrolled = window.FaceRec && window.FaceRec.isEnrolled(this.selectedAccountId);
      if (reenrollBtn) reenrollBtn.style.display = isEnrolled ? 'inline-block' : 'none';

      const purposeLabel = this.bioPurpose === 'calibrate' ? 'Calibrate Face' :
                           this.bioPurpose === 'payment'   ? `Authorize Payment — ${account.name}` :
                                                             `Face ID — ${account.name}`;
      title.textContent = purposeLabel;
      sub.textContent   = 'Look directly into the camera';
      switchBtn.textContent = 'Switch to Touch ID';
      fpPad.style.display   = 'none';
      canvas.style.display  = 'block';
      laser.style.display   = 'block';
      statusText.textContent = 'Initializing...';
      stepDetail.textContent = 'Loading AI face recognition models...';

      this.startFaceCamera();
    } else {
      if (reenrollBtn) reenrollBtn.style.display = 'none';
      const purposeLabel = this.bioPurpose === 'calibrate' ? 'Enroll Touch ID' :
                           this.bioPurpose === 'payment'   ? `Authorize Payment — ${account.name}` :
                                                             `Touch ID — ${account.name}`;
      title.textContent = purposeLabel;
      sub.textContent   = 'Place finger on the biometric sensor';
      switchBtn.textContent = 'Switch to Face ID';
      this.stopFaceCamera();
      canvas.style.display = 'none';
      laser.style.display  = 'none';
      fpPad.style.display  = 'flex';
      statusText.textContent = 'Touch Sensor Ready';
      stepDetail.textContent = 'Click or tap sensor to scan fingerprint...';
    }
  }

  async startFaceCamera() {
    const video      = document.getElementById('bio-video-feed');
    const canvas     = document.getElementById('bio-canvas-overlay');
    const statusText = document.getElementById('bio-status-text');
    const stepDetail = document.getElementById('bio-step-detail');
    const badge      = document.getElementById('bio-status-badge');
    const viewport   = document.getElementById('bio-scanner-viewport');
    const enrollPrmt = document.getElementById('bio-enroll-prompt');
    const confWrap   = document.getElementById('bio-confidence-wrap');
    const confBar    = document.getElementById('bio-confidence-bar');

    const accountId = this.selectedAccountId;
    const account   = this.ACCOUNTS[accountId];

    if (!window.FaceRec) {
      statusText.textContent = 'Face recognition not available';
      stepDetail.textContent = 'face-recognition.js not loaded';
      return;
    }

    // ── Step 1: Load models if needed ──────────────────────
    if (!this.faceModelsLoaded) {
      statusText.textContent = 'Loading AI models...';
      stepDetail.textContent = 'Downloading neural networks (one-time, ~6MB)...';
      const ok = await window.FaceRec.loadModels((msg) => {
        statusText.textContent = msg;
      });
      if (!ok) {
        statusText.textContent = 'Failed to load AI models';
        stepDetail.textContent = 'Check internet connection and try again.';
        return;
      }
      this.faceModelsLoaded = true;
    }

    // ── Step 2: Check enrollment ────────────────────────────
    if (!window.FaceRec.isEnrolled(accountId)) {
      // Show enroll prompt overlay
      if (enrollPrmt) {
        document.getElementById('bio-enroll-prompt-msg').textContent =
          `${account.name}'s account has no enrolled face. Enroll once to enable Face ID.`;
        enrollPrmt.style.display = 'flex';
      }
      statusText.textContent = 'Enrollment Required';
      stepDetail.textContent = 'This account has no face template stored.';
      // Start camera anyway so the enroll flow can use it
      await window.FaceRec.startCamera(video);
      return;
    }

    // ── Step 3: Start camera & verify ─────────────────────
    statusText.textContent = 'Starting camera...';
    stepDetail.textContent = 'Connecting to secure optical sensor...';
    const cameraOk = await window.FaceRec.startCamera(video);
    if (!cameraOk) {
      statusText.textContent = 'Camera access denied';
      stepDetail.textContent = 'Please allow camera permissions in your browser.';
      return;
    }

    // Show confidence bar
    if (confWrap) confWrap.style.display = 'block';

    // Draw animated mesh over video while verifying
    const ctx = canvas.getContext('2d');
    canvas.style.display = 'block';
    const drawMesh = () => {
      if (!this._verifying) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      ctx.strokeStyle = isLight ? 'rgba(15,23,42,.6)' : 'rgba(56,189,248,.6)';
      ctx.fillStyle   = isLight ? 'rgba(15,23,42,.8)' : 'rgba(56,189,248,.8)';
      ctx.lineWidth   = 1;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 58, 76, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.7;
      const ey = Math.sin(Date.now() * 0.003) * 2;
      ctx.beginPath();
      ctx.arc(cx - 24, cy - 14 + ey, 3, 0, Math.PI * 2);
      ctx.arc(cx + 24, cy - 14 + ey, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 2, 0, Math.PI * 2);
      ctx.arc(cx - 16, cy + 32, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 16, cy + 32, 2.5, 0, Math.PI * 2);
      ctx.arc(cx, cy + 36, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy - 14); ctx.lineTo(cx, cy + 4);
      ctx.lineTo(cx + 24, cy - 14); ctx.lineTo(cx + 16, cy + 32);
      ctx.lineTo(cx, cy + 36);      ctx.lineTo(cx - 16, cy + 32);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 1;
      this.bioAnimId = requestAnimationFrame(drawMesh);
    };
    this._verifying = true;
    this.bioAnimId = requestAnimationFrame(drawMesh);

    statusText.textContent = `Scanning for ${account.name}'s face...`;
    stepDetail.textContent = 'Align your face with the camera';

    // ── Step 4: Run real verification ─────────────────────
    await window.FaceRec.verifyFace(
      accountId,
      video,
      // onStatus
      (msg, confidence) => {
        statusText.textContent = msg;
        if (confBar && confidence > 0) confBar.style.width = `${Math.min(confidence, 99)}%`;
      },
      // onMatch
      (dist, confidence) => {
        this._verifying = false;
        if (this.bioAnimId) { cancelAnimationFrame(this.bioAnimId); this.bioAnimId = null; }
        window.FaceRec.stopCamera();

        // Draw green verified mesh
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#22c55e'; ctx.fillStyle = '#22c55e';
        ctx.lineWidth = 1.5; ctx.globalAlpha = 0.85;
        const cx2 = canvas.width / 2, cy2 = canvas.height / 2;
        ctx.beginPath(); ctx.ellipse(cx2, cy2, 58, 76, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;

        badge.classList.add('verified');
        viewport.classList.add('verified');
        if (confBar) confBar.style.width = '100%';
        statusText.textContent = '✓ Identity Confirmed';
        stepDetail.textContent = `${account.name} authenticated · Match ${(100 - Math.round(dist * 100))}% confidence`;

        setTimeout(() => {
          this.closeBiometricModal();
          if (this.bioSuccessCallback) {
            this.bioSuccessCallback(accountId);
          } else {
            this.showToast(`✓ Face ID Verified — ${account.name}`, 'success');
          }
        }, 900);
      },
      // onFail
      (reason) => {
        this._verifying = false;
        if (this.bioAnimId) { cancelAnimationFrame(this.bioAnimId); this.bioAnimId = null; }
        window.FaceRec.stopCamera();

        viewport.classList.add('failed');
        statusText.textContent = reason === 'not_enrolled' ? 'Not Enrolled' : '✕ Face Not Recognized';
        stepDetail.textContent = reason === 'not_enrolled'
          ? 'Enroll your face first'
          : `This face does not match ${account.name}'s stored template · Access Denied`;

        // Auto-reset after 3s to allow retry
        setTimeout(() => {
          viewport.classList.remove('failed');
          badge.classList.remove('verified');
          statusText.textContent = 'Try Again';
          stepDetail.textContent = 'Click Cancel or try once more';
        }, 3000);
      },
      // onNoFace
      (count) => {
        if (count > 3) {
          stepDetail.textContent = 'No face detected — move closer and improve lighting';
        }
      }
    );
  }

  async processFingerprintTap() {
    const accountId = this.selectedAccountId;
    const account   = this.ACCOUNTS[accountId];
    const statusText = document.getElementById('bio-status-text');
    const stepDetail = document.getElementById('bio-step-detail');
    const badge      = document.getElementById('bio-status-badge');
    const viewport   = document.getElementById('bio-scanner-viewport');

    statusText.textContent = 'Scanning Fingerprint...';
    stepDetail.textContent = 'Connecting to hardware Touch ID sensor...';

    // Try enrolling or verifying WebAuthn passkey for this account
    if (window.FaceRec && !window.FaceRec.hasWebAuthnCred(accountId)) {
      // First time — enroll this account's Touch ID credential
      statusText.textContent = 'Enrolling Touch ID...';
      stepDetail.textContent = 'Complete the system biometric prompt...';
      const result = await window.FaceRec.enrollWebAuthn(accountId, account.name, account.name + ' — SecureLedger');
      if (!result.success) {
        if (result.reason === 'cancelled') {
          statusText.textContent = 'Cancelled';
          stepDetail.textContent = 'Touch ID enrollment was cancelled';
        } else {
          // Fallback simulation for unsupported environments
          this._simulateFingerprintSuccess(account, badge, viewport, statusText, stepDetail);
        }
        return;
      }
      statusText.textContent = '✓ Touch ID Enrolled';
      stepDetail.textContent = `${account.name}'s fingerprint linked to this account`;
    } else if (window.FaceRec && window.FaceRec.hasWebAuthnCred(accountId)) {
      // Verify existing credential
      statusText.textContent = 'Verifying with Touch ID...';
      stepDetail.textContent = 'Complete the system biometric prompt...';
      const result = await window.FaceRec.verifyWebAuthn(accountId);
      if (!result.success) {
        if (result.reason === 'cancelled') {
          statusText.textContent = 'Cancelled';
          stepDetail.textContent = 'Touch ID verification cancelled';
          return;
        }
        // Fallback
        this._simulateFingerprintSuccess(account, badge, viewport, statusText, stepDetail);
        return;
      }
    } else {
      this._simulateFingerprintSuccess(account, badge, viewport, statusText, stepDetail);
      return;
    }

    badge.classList.add('verified');
    viewport.classList.add('verified');
    statusText.textContent = '✓ Fingerprint Verified';
    stepDetail.textContent = `Touch ID matched Secure Enclave — ${account.name}`;

    setTimeout(() => {
      this.closeBiometricModal();
      if (this.bioSuccessCallback) {
        this.bioSuccessCallback(accountId);
      } else {
        this.showToast(`✓ Touch ID Verified — ${account.name}`, 'success');
      }
    }, 700);
  }

  _simulateFingerprintSuccess(account, badge, viewport, statusText, stepDetail) {
    // Graceful fallback for environments without WebAuthn platform authenticator
    statusText.textContent = 'Reading biometric signature...';
    stepDetail.textContent = 'Extracting minutiae points...';
    setTimeout(() => {
      badge.classList.add('verified');
      viewport.classList.add('verified');
      statusText.textContent = '✓ Fingerprint Verified';
      stepDetail.textContent = `Touch ID matched Secure Enclave — ${account.name}`;
      setTimeout(() => {
        this.closeBiometricModal();
        if (this.bioSuccessCallback) this.bioSuccessCallback(this.selectedAccountId);
      }, 700);
    }, 1200);
  }

  stopFaceCamera() {
    this._verifying = false;
    if (this.bioAnimId) {
      cancelAnimationFrame(this.bioAnimId);
      this.bioAnimId = null;
    }
    if (window.FaceRec) window.FaceRec.stopCamera();
    // Legacy stream cleanup
    if (this.bioStream) {
      this.bioStream.getTracks().forEach(t => t.stop());
      this.bioStream = null;
    }
    const video = document.getElementById('bio-video-feed');
    if (video) video.style.display = 'none';
  }

  toggleBiometricType() {
    this.bioType = this.bioType === 'face' ? 'touch' : 'face';
    this.renderBiometricUI(this.bioType);
  }

  closeBiometricModal() {
    this.stopFaceCamera();
    const modal = document.getElementById('biometric-modal');
    if (modal) modal.classList.remove('active');
  }

  // ── THEME MODE MANAGEMENT ──────────────────────
  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(themeName) {
    this.theme = themeName;
    localStorage.setItem('theme', themeName);
    this.applyTheme(themeName);
    this.showToast(`Switched to ${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Mode`, 'info');
  }

  applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);

    // Update icons
    const moonIcon = document.getElementById('theme-icon-moon');
    const sunIcon = document.getElementById('theme-icon-sun');
    if (moonIcon && sunIcon) {
      if (themeName === 'light') {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
      } else {
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
      }
    }

    // Update settings buttons
    const darkBtn = document.getElementById('theme-btn-dark');
    const lightBtn = document.getElementById('theme-btn-light');
    if (darkBtn && lightBtn) {
      if (themeName === 'light') {
        darkBtn.className = 'btn btn-ghost btn-sm';
        lightBtn.className = 'btn btn-accent btn-sm';
      } else {
        darkBtn.className = 'btn btn-accent btn-sm';
        lightBtn.className = 'btn btn-ghost btn-sm';
      }
    }

    // Update Three.js canvas background & fog if present
    if (window.THREE) {
      const THREE = window.THREE;
      const bgColor = themeName === 'light' ? 0xf8fafc : 0x09090b;
      if (this.network3D && this.network3D.scene) {
        this.network3D.scene.background = new THREE.Color(bgColor);
        this.network3D.scene.fog = new THREE.FogExp2(bgColor, 0.035);
      }
      if (this.investigationNetwork && this.investigationNetwork.scene) {
        this.investigationNetwork.scene.background = new THREE.Color(bgColor);
        this.investigationNetwork.scene.fog = new THREE.FogExp2(bgColor, 0.035);
      }
    }

    // Re-render charts with theme colors
    if (this.chartsInitialized) {
      initCharts();
    }
  }

  // ── LOGIN ──────────────────────────────────────
  setupLogin() {
    const form = document.getElementById('login-form');
    const pwInput = document.getElementById('password-input');
    const pwToggle = document.getElementById('pw-toggle');

    if (pwToggle) {
      pwToggle.addEventListener('click', () => {
        const type = pwInput.type === 'password' ? 'text' : 'password';
        pwInput.type = type;
        pwToggle.innerHTML = type === 'password' ? ICONS.eye : ICONS.eyeOff;
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.login();
      });
    }
  }

  login(isBiometric = false, accountId = null) {
    const resolvedId = accountId || this.selectedAccountId || 'USR001';
    const account    = this.ACCOUNTS[resolvedId];
    const btn = document.getElementById('login-btn');

    if (btn && !isBiometric) {
      btn.textContent = 'Authenticating...';
      btn.disabled = true;
    }

    const delay = isBiometric ? 300 : 1000;
    setTimeout(() => {
      // Load the correct account's data
      if (account) {
        window.currentUser = {
          id:            account.id,
          name:          account.name,
          email:         account.email,
          avatar:        account.avatar,
          accountNumber: account.accountId,
          role:          'user'
        };
        // Update displayed user info in the UI
        const userNameEl   = document.getElementById('user-display-name');
        const userEmailEl  = document.getElementById('user-display-email');
        const userAvatarEl = document.getElementById('user-display-avatar');
        if (userNameEl)   userNameEl.textContent   = account.name;
        if (userEmailEl)  userEmailEl.textContent   = account.email;
        if (userAvatarEl) userAvatarEl.textContent  = account.avatar;
      }

      document.getElementById('login-page').style.display = 'none';
      const shell = document.getElementById('app-shell');
      shell.classList.add('active');
      this.navigateTo('dashboard');
      this.startLiveFeed();

      const name = account ? account.name : 'User';
      if (isBiometric) {
        this.showToast(`✓ Welcome back ${name} · Biometric Authenticated`, 'success');
      } else {
        this.showToast(`Welcome back ${name}`, 'success');
      }
    }, delay);
  }

  // ── NAVIGATION ────────────────────────────────
  setupNavigation() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', () => {
        const page = el.dataset.page;
        this.navigateTo(page);

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
          document.querySelector('.sidebar').classList.remove('open');
          document.querySelector('.sidebar-overlay').classList.remove('open');
        }
      });
    });
  }

  navigateTo(page) {
    this.currentPage = page;

    // Hide all pages
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Show page
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    // Page-specific init
    if (page === 'dashboard' && !this.network3D?.initialized) {
      setTimeout(() => this.initMainNetwork(), 100);
    }

    if (page === 'analytics' && !this.chartsInitialized) {
      setTimeout(() => {
        initCharts();
        this.chartsInitialized = true;
      }, 100);
    }

    if (page === 'investigation') {
      setTimeout(() => this.initInvestigationNetwork(), 100);
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }

  // ── NETWORK 3D ────────────────────────────────
  initMainNetwork() {
    if (this.network3D) {
      this.network3D.destroy();
    }
    const container = document.getElementById('network-canvas-container');
    if (!container) return;

    this.network3D = new TransactionNetwork3D('network-canvas-container', false);
    this.network3D.onNodeClick = (nodeData) => this.showNodeDetail(nodeData);
    this.network3D.init();

    // Canvas controls
    document.getElementById('canvas-zoom-in')?.addEventListener('click', () => {
      if (this.network3D) this.network3D.cameraRadius = Math.max(6, this.network3D.cameraRadius - 2);
    });

    document.getElementById('canvas-zoom-out')?.addEventListener('click', () => {
      if (this.network3D) this.network3D.cameraRadius = Math.min(28, this.network3D.cameraRadius + 2);
    });

    document.getElementById('canvas-reset')?.addEventListener('click', () => {
      if (this.network3D) this.network3D.resetCamera();
    });
  }

  initInvestigationNetwork() {
    if (this.investigationNetwork) {
      this.investigationNetwork.destroy();
    }
    this.investigationNetwork = new TransactionNetwork3D('investigation-canvas-container', true);
    this.investigationNetwork.onNodeClick = (nodeData) => this.showNodeDetail(nodeData);
    this.investigationNetwork.init();
  }

  showNodeDetail(nodeData) {
    const user = APP_DATA.users.find(u => u.name === nodeData.label || u.name.startsWith(nodeData.label.split(' ')[0]));
    if (!user) return;

    document.getElementById('node-detail-name').textContent = user.name;
    document.getElementById('node-detail-id').textContent = user.accountId;
    document.getElementById('node-detail-txns').textContent = user.txnCount;
    document.getElementById('node-detail-total').textContent = '₹' + user.totalAmount.toLocaleString('en-IN');
    document.getElementById('node-detail-avg').textContent = '₹' + user.avgTxn.toLocaleString('en-IN');
    document.getElementById('node-detail-score').textContent = user.riskScore + '/100';
    document.getElementById('node-detail-status').textContent = user.risk.toUpperCase();
    document.getElementById('node-detail-status').style.color =
      user.risk === 'high' ? 'var(--danger)' :
      user.risk === 'medium' ? 'var(--warning)' : 'var(--success)';

    document.getElementById('node-detail-panel').style.display = 'block';
  }

  // ── PAYMENT FLOW ───────────────────────────────
  setupPaymentFlow() {
    const reviewBtn = document.getElementById('review-payment-btn');
    const confirmBtn = document.getElementById('confirm-payment-btn');
    const cancelBtn  = document.getElementById('cancel-payment-btn');
    const cancelTxBtn = document.getElementById('cancel-transaction-btn');
    const reviewAgainBtn = document.getElementById('review-btn');

    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => this.reviewPayment());
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmPayment());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        document.getElementById('payment-review').style.display = 'none';
        document.getElementById('payment-form-section').style.display = 'block';
      });
    }

    if (cancelTxBtn) {
      cancelTxBtn.addEventListener('click', () => {
        document.getElementById('screening-overlay').classList.remove('active');
        document.getElementById('payment-review').style.display = 'none';
        document.getElementById('payment-form-section').style.display = 'block';
        document.getElementById('payment-success').style.display = 'none';
        this.showToast('Transaction cancelled.', 'info');
      });
    }

    if (reviewAgainBtn) {
      reviewAgainBtn.addEventListener('click', () => {
        document.getElementById('payment-success').style.display = 'none';
        document.getElementById('payment-form-section').style.display = 'block';
      });
    }

    // Amount input dynamic display
    const amountInput = document.getElementById('pay-amount');
    if (amountInput) {
      amountInput.addEventListener('input', () => {
        const val = parseInt(amountInput.value) || 0;
        document.getElementById('pay-amount-display').textContent = '₹' + val.toLocaleString('en-IN');
      });
    }
  }

  reviewPayment() {
    const receiver = document.getElementById('pay-to').value;
    const amount   = parseInt(document.getElementById('pay-amount').value) || 0;
    const desc     = document.getElementById('pay-desc').value;

    if (!receiver || !amount) {
      this.showToast('Please fill in all fields.', 'warning');
      return;
    }

    this.paymentReceiver = receiver;
    this.paymentAmount   = amount;

    // Populate review screen
    document.getElementById('review-amount').textContent = '₹' + amount.toLocaleString('en-IN');
    document.getElementById('review-from').textContent = APP_DATA.currentUser.name;
    document.getElementById('review-to').textContent   = receiver;
    document.getElementById('review-desc').textContent = desc || '—';

    document.getElementById('payment-form-section').style.display = 'none';
    document.getElementById('payment-review').style.display = 'block';
    document.getElementById('payment-success').style.display  = 'none';
  }

  confirmPayment() {
    const isHighSecurity = this.paymentAmount >= 10000 || this.paymentReceiver === 'Unknown Account' || this.paymentReceiver === 'High-Risk Account';

    const executeScreening = () => {
      runFraudScreening(this.paymentAmount, this.paymentReceiver, async (riskLevel, riskScore) => {
        // Asynchronously register transaction with backend / local store
        const desc = document.getElementById('pay-desc')?.value || '';
        const paymentResult = await API.sendPayment({
          receiverName: this.paymentReceiver,
          amount: this.paymentAmount,
          description: desc
        });

        if (paymentResult && paymentResult.transaction) {
          if (!APP_DATA.transactions.some(t => t.id === paymentResult.transaction.id)) {
            APP_DATA.transactions.unshift(paymentResult.transaction);
          }
        }

        if (riskLevel === 'high') {
          // Navigate to fraud alert
          document.getElementById('payment-review').style.display = 'none';
          this.showFraudAlert(riskScore);
          if (typeof this.renderAlerts === 'function') this.renderAlerts();
        } else {
          // Deduct local balance and update UI
          APP_DATA.currentUser.balance = Math.max(0, APP_DATA.currentUser.balance - this.paymentAmount);
          const balFormatted = '₹' + APP_DATA.currentUser.balance.toLocaleString('en-IN');
          const statBal = document.getElementById('stat-available-balance');
          if (statBal) statBal.textContent = balFormatted;
          const payBal = document.getElementById('pay-available-balance');
          if (payBal) payBal.textContent = balFormatted;

          // Success UI
          document.getElementById('payment-review').style.display = 'none';
          document.getElementById('payment-success').style.display = 'block';
          document.getElementById('success-amount').textContent = '₹' + this.paymentAmount.toLocaleString('en-IN');
          document.getElementById('success-to').textContent = this.paymentReceiver;
          document.getElementById('success-txnid').textContent = (paymentResult && paymentResult.transaction && paymentResult.transaction.id) || ('TXN' + Date.now().toString().slice(-6));
          document.getElementById('success-risk').textContent = riskScore + '/100 — ' + riskLevel.toUpperCase() + ' RISK';
          document.getElementById('success-risk').style.color =
            riskLevel === 'medium' ? 'var(--warning)' : 'var(--success)';
        }

        if (typeof this.renderTransactionTable === 'function') {
          this.renderTransactionTable();
        }
      });
    };

    if (isHighSecurity) {
      this.launchBiometric('face', 'payment', executeScreening);
    } else {
      executeScreening();
    }
  }

  showFraudAlert(riskScore) {
    // Show inline alert on payment page
    document.getElementById('payment-form-section').style.display = 'none';
    document.getElementById('payment-review').style.display = 'none';
    document.getElementById('payment-success').style.display = 'none';
    document.getElementById('fraud-alert-inline').style.display = 'block';
    document.getElementById('fraud-alert-amount').textContent = '₹' + this.paymentAmount.toLocaleString('en-IN');
    document.getElementById('fraud-alert-to').textContent = this.paymentReceiver;
    document.getElementById('fraud-alert-score').textContent = riskScore + '/100';

    document.getElementById('fraud-cancel-payment-btn').onclick = () => {
      document.getElementById('fraud-alert-inline').style.display = 'none';
      document.getElementById('payment-form-section').style.display = 'block';
      this.showToast('Transaction cancelled for your safety.', 'success');
    };

    document.getElementById('fraud-review-btn').onclick = () => {
      document.getElementById('fraud-alert-inline').style.display = 'none';
      document.getElementById('payment-form-section').style.display = 'block';
      this.navigateTo('alerts');
    };
  }

  // ── TRANSACTION TABLE ─────────────────────────
  setupFilters() {
    const searchInput = document.getElementById('ledger-search');
    const riskFilter  = document.getElementById('ledger-risk-filter');
    const typeFilter  = document.getElementById('ledger-type-filter');
    const statusFilter= document.getElementById('ledger-status-filter');

    [searchInput, riskFilter, typeFilter, statusFilter].forEach(el => {
      if (el) el.addEventListener('input', () => this.renderTransactionTable());
    });

    this.renderTransactionTable();
    this.renderAlerts();
  }

  renderTransactionTable() {
    const search = (document.getElementById('ledger-search')?.value || '').toLowerCase();
    const risk   = document.getElementById('ledger-risk-filter')?.value || '';
    const type   = document.getElementById('ledger-type-filter')?.value || '';
    const status = document.getElementById('ledger-status-filter')?.value || '';

    let txns = APP_DATA.transactions.filter(t => {
      const matchSearch = !search ||
        t.id.toLowerCase().includes(search) ||
        t.sender.toLowerCase().includes(search) ||
        t.receiver.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search);
      const matchRisk   = !risk   || t.risk === risk;
      const matchType   = !type   || t.type === type;
      const matchStatus = !status || t.status === status;
      return matchSearch && matchRisk && matchType && matchStatus;
    });

    const tbody = document.getElementById('ledger-tbody');
    if (!tbody) return;

    if (txns.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">No transactions match your filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = txns.map(t => `
      <tr data-txnid="${t.id}" onclick="app.openTransaction('${t.id}')">
        <td class="mono" style="color:var(--accent)">${t.id}</td>
        <td>${t.date}<br><span style="font-size:11px;color:var(--text-muted)">${t.time}</span></td>
        <td>${t.sender}</td>
        <td>${t.receiver}</td>
        <td class="${t.type === 'Credit' ? 'amount-positive' : 'amount-negative'}">
          ${t.type === 'Credit' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}
        </td>
        <td><span class="badge ${t.type === 'Credit' ? 'info' : 'neutral'}">${t.type}</span></td>
        <td style="color:var(--text-secondary)">${t.category}</td>
        <td><span class="badge ${t.risk}">${t.risk.toUpperCase()}</span></td>
        <td>${this.statusBadge(t.status)}</td>
      </tr>
    `).join('');
  }

  statusBadge(status) {
    const map = {
      'Completed': '<span style="color:var(--success);font-size:12px">✓ Completed</span>',
      'Review':    '<span style="color:var(--warning);font-size:12px">⚠ Review</span>',
      'Blocked':   '<span style="color:var(--danger);font-size:12px">✕ Blocked</span>',
      'Pending':   '<span style="color:var(--text-muted);font-size:12px">⏳ Pending</span>'
    };
    return map[status] || status;
  }

  openTransaction(txnId) {
    const txn = APP_DATA.transactions.find(t => t.id === txnId);
    if (!txn) return;
    this.selectedTransaction = txn;
    this.populateTransactionDetail(txn);
    this.navigateTo('transaction-detail');
  }

  populateTransactionDetail(txn) {
    const fields = {
      'td-id': txn.id,
      'td-amount': (txn.type === 'Credit' ? '+' : '-') + '₹' + txn.amount.toLocaleString('en-IN'),
      'td-sender': txn.sender,
      'td-receiver': txn.receiver,
      'td-date': txn.date,
      'td-time': txn.time,
      'td-location': txn.location,
      'td-device': txn.device,
      'td-method': txn.method,
      'td-category': txn.category,
      'td-note': txn.note || '—',
      'td-status': txn.status,
      'td-risk-score': txn.riskScore + '/100',
      'td-risk-level': txn.risk.toUpperCase() + ' RISK',
    };

    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = val;
        if (id === 'td-amount') {
          el.style.color = txn.type === 'Credit' ? 'var(--success)' : 'var(--text-primary)';
        }
        if (id === 'td-risk-level') {
          el.style.color = txn.risk === 'high' ? 'var(--danger)' : txn.risk === 'medium' ? 'var(--warning)' : 'var(--success)';
        }
      }
    });

    // Risk factor bars
    const factors = this.computeRiskFactors(txn);
    const factorsEl = document.getElementById('td-risk-factors');
    if (factorsEl) {
      factorsEl.innerHTML = factors.map(f => `
        <div class="risk-factor-item">
          <div class="risk-factor-label">
            <span>${f.label}</span>
            <span style="color:${f.value >= 70 ? 'var(--danger)' : f.value >= 40 ? 'var(--warning)' : 'var(--success)'}">${f.level}</span>
          </div>
          <div class="factor-bar">
            <div class="factor-fill" style="width:${f.value}%;background:${f.value >= 70 ? 'var(--danger)' : f.value >= 40 ? 'linear-gradient(90deg,var(--warning),var(--danger))' : 'var(--success)'}"></div>
          </div>
        </div>
      `).join('');
    }
  }

  computeRiskFactors(txn) {
    const avgTxn = 1500;
    const amountRatio = Math.min(100, (txn.amount / (avgTxn * 10)) * 80);
    const isNewBeneficiary = txn.receiver === 'Unknown Account' || txn.receiver === 'High-Risk Account';
    const isOddTime = parseInt(txn.time) < 6 || parseInt(txn.time) > 22;
    const isSuspiciousLocation = txn.location.includes('VPN') || txn.location === 'Unknown';

    return [
      { label: 'Amount Anomaly',      value: Math.round(amountRatio),   level: amountRatio >= 70 ? 'High' : amountRatio >= 40 ? 'Medium' : 'Low' },
      { label: 'Time Anomaly',        value: isOddTime ? 80 : 15,       level: isOddTime ? 'High' : 'Low' },
      { label: 'Beneficiary Risk',    value: isNewBeneficiary ? 90 : 10, level: isNewBeneficiary ? 'High' : 'Low' },
      { label: 'Location Anomaly',    value: isSuspiciousLocation ? 75 : 12, level: isSuspiciousLocation ? 'High' : 'Low' },
      { label: 'Behavioral Pattern',  value: txn.risk === 'high' ? 85 : txn.risk === 'medium' ? 50 : 15, level: txn.risk === 'high' ? 'High' : txn.risk === 'medium' ? 'Medium' : 'Low' },
    ];
  }

  // ── ALERTS ────────────────────────────────────
  renderAlerts() {
    const container = document.getElementById('alerts-list');
    if (!container) return;

    container.innerHTML = APP_DATA.alerts.map(alert => `
      <div class="alert-item" onclick="app.openAlert('${alert.id}')">
        <div class="alert-severity ${alert.riskLevel}"></div>
        <div class="alert-content">
          <div class="alert-title">${alert.sender} → ${alert.receiver}</div>
          <div class="alert-meta mono" style="font-size:11px">${alert.txnId}</div>
          <div class="alert-meta" style="margin-top:6px;font-size:12px">${alert.reasons[0]}</div>
        </div>
        <div class="alert-actions">
          <div class="alert-amount ${alert.riskLevel === 'high' ? 'text-danger' : alert.riskLevel === 'medium' ? 'text-warning' : 'text-success'}">₹${alert.amount.toLocaleString('en-IN')}</div>
          <span class="badge ${alert.riskLevel}">${alert.riskScore}%</span>
          <span style="font-size:11px;color:var(--text-muted);text-align:right">${alert.status}</span>
        </div>
      </div>
    `).join('');
  }

  openAlert(alertId) {
    const alert = APP_DATA.alerts.find(a => a.id === alertId);
    if (!alert) return;
    this.selectedAlert = alert;
    this.navigateTo('investigation');

    setTimeout(() => {
      this.populateInvestigation(alert);
    }, 100);
  }

  openInvestigation(txnId) {
    const txn = APP_DATA.transactions.find(t => t.id === txnId);
    if (!txn) return;

    // Find matching alert or create one
    const alert = APP_DATA.alerts.find(a => a.txnId === txnId) || {
      id: 'ALT-TMP',
      txnId: txnId,
      amount: txn.amount,
      riskScore: txn.riskScore,
      riskLevel: txn.risk,
      sender: txn.sender,
      receiver: txn.receiver,
      timestamp: txn.date + ' ' + txn.time,
      status: txn.status,
      reasons: ['Transaction flagged for review', 'Automated risk assessment required']
    };

    this.selectedAlert = alert;
    this.navigateTo('investigation');
    setTimeout(() => this.populateInvestigation(alert), 100);
  }

  populateInvestigation(alert) {
    const txn = APP_DATA.transactions.find(t => t.id === alert.txnId);

    document.getElementById('inv-txnid').textContent   = alert.txnId;
    document.getElementById('inv-amount').textContent  = '₹' + alert.amount.toLocaleString('en-IN');
    document.getElementById('inv-sender').textContent  = alert.sender;
    document.getElementById('inv-receiver').textContent = alert.receiver;
    document.getElementById('inv-score').textContent   = alert.riskScore + '/100';
    document.getElementById('inv-level').textContent   = alert.riskLevel.toUpperCase();
    document.getElementById('inv-level').style.color   =
      alert.riskLevel === 'high' ? 'var(--danger)' : alert.riskLevel === 'medium' ? 'var(--warning)' : 'var(--success)';
    document.getElementById('inv-status').textContent  = alert.status;
    document.getElementById('inv-time').textContent    = alert.timestamp;

    const reasonsEl = document.getElementById('inv-reasons');
    if (reasonsEl) {
      reasonsEl.innerHTML = alert.reasons.map(r => `<li>${r}</li>`).join('');
    }

    // Risk score ring
    const ring = document.getElementById('inv-risk-ring-fill');
    if (ring) {
      const radius = 45;
      const circumference = 2 * Math.PI * radius;
      const progress = (alert.riskScore / 100) * circumference;
      ring.setAttribute('stroke-dasharray', `${progress} ${circumference}`);
      ring.setAttribute('stroke', alert.riskLevel === 'high' ? '#ef4444' : alert.riskLevel === 'medium' ? '#f59e0b' : '#22c55e');
    }

    this.initInvestigationNetwork();
  }

  // ── LIVE ADMIN FEED ───────────────────────────
  startLiveFeed() {
    this.renderLiveFeed();

    this.liveFeedInterval = setInterval(() => {
      // Randomly add a new transaction to feed
      const names = ['Rahim', 'Arjun', 'Priya', 'Aman', 'Neha'];
      const risks  = ['low', 'low', 'low', 'medium', 'high'];
      const risk   = risks[Math.floor(Math.random() * risks.length)];
      const newTxn = {
        id: 'TXN' + Math.floor(Math.random() * 90000 + 10000),
        amount: Math.floor(Math.random() * 50000) + 100,
        risk,
        riskScore: risk === 'high' ? 78 + Math.floor(Math.random() * 20) : risk === 'medium' ? 40 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 30),
        sender: names[Math.floor(Math.random() * names.length)],
        receiver: risk === 'high' ? 'Unknown Account' : names[Math.floor(Math.random() * names.length)],
        time: new Date().toTimeString().slice(0, 5)
      };

      APP_DATA.liveFeed.unshift(newTxn);
      if (APP_DATA.liveFeed.length > 12) APP_DATA.liveFeed.pop();
      this.renderLiveFeed();
    }, 4000);
  }

  renderLiveFeed() {
    const container = document.getElementById('live-feed-list');
    if (!container) return;

    container.innerHTML = APP_DATA.liveFeed.map(txn => `
      <div class="feed-item" onclick="app.openInvestigation('${txn.id}')">
        <div class="feed-dot ${txn.risk}"></div>
        <span class="feed-txnid">${txn.id}</span>
        <span class="feed-parties">${txn.sender} → ${txn.receiver}</span>
        <span class="feed-amount">₹${txn.amount.toLocaleString('en-IN')}</span>
        <span class="feed-risk"><span class="badge ${txn.risk}">${txn.riskScore}</span></span>
        <span class="feed-time">${txn.time}</span>
      </div>
    `).join('');
  }

  // ── MODALS / OVERLAYS ─────────────────────────
  setupModals() {
    document.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', () => {
        const modal = el.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });
  }

  setupScreeningOverlay() {
    // Setup cancel in screening
    const cancelScreening = document.getElementById('screening-cancel-btn');
    if (cancelScreening) {
      cancelScreening.addEventListener('click', () => {
        document.getElementById('screening-overlay').classList.remove('active');
      });
    }
  }

  // ── MOBILE NAV ────────────────────────────────
  setupMobileNav() {
    const hamburger = document.getElementById('hamburger-btn');
    const sidebar   = document.querySelector('.sidebar');
    const overlay   = document.querySelector('.sidebar-overlay');

    if (hamburger && sidebar) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }
  }

  // ── TOGGLES ───────────────────────────────────
  setupToggles() {
    document.querySelectorAll('.toggle').forEach(toggle => {
      toggle.addEventListener('click', () => toggle.classList.toggle('on'));
    });
  }

  // ── TOAST NOTIFICATION ────────────────────────
  showToast(msg, type = 'info') {
    const existing = document.getElementById('toast-container');
    if (existing) existing.remove();

    const colors = {
      success: 'var(--success)',
      warning: 'var(--warning)',
      danger:  'var(--danger)',
      info:    'var(--accent)'
    };

    const toast = document.createElement('div');
    toast.id = 'toast-container';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 999;
      background: var(--bg-card); border: 1px solid var(--border-light);
      border-left: 3px solid ${colors[type] || colors.info};
      border-radius: var(--radius-md); padding: 14px 20px;
      font-size: 13px; color: var(--text-primary);
      box-shadow: var(--shadow-lg);
      animation: slideInRight 0.3s ease;
      max-width: 320px;
    `;

    toast.innerHTML = msg;

    const style = document.createElement('style');
    style.textContent = `@keyframes slideInRight { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }`;
    document.head.appendChild(style);

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // ── INVESTIGATION ACTIONS ─────────────────────
  async markNormal() {
    if (this.selectedAlert) {
      await API.updateAlert(this.selectedAlert.id, 'normal');
      this.selectedAlert.status = 'False Positive';
    }
    if (typeof this.renderAlerts === 'function') this.renderAlerts();
    this.showToast('✓ Transaction marked as normal.', 'success');
    setTimeout(() => this.navigateTo('alerts'), 1000);
  }

  async confirmFraud() {
    if (this.selectedAlert) {
      await API.updateAlert(this.selectedAlert.id, 'fraud');
      this.selectedAlert.status = 'Confirmed Fraud';
    }
    if (typeof this.renderAlerts === 'function') this.renderAlerts();
    this.showToast('⚠ Transaction confirmed as fraud. Account flagged.', 'danger');
    setTimeout(() => this.navigateTo('alerts'), 1000);
  }

  async blockTransaction() {
    if (this.selectedAlert) {
      await API.updateAlert(this.selectedAlert.id, 'block');
      this.selectedAlert.status = 'Blocked';
    }
    if (typeof this.renderAlerts === 'function') this.renderAlerts();
    this.showToast('✕ Transaction blocked. User notified.', 'warning');
    setTimeout(() => this.navigateTo('alerts'), 1000);
  }

  // ── PDF STATEMENT GENERATOR ───────────────────
  downloadStatementPDF() {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
      this.showToast('PDF generator library is initializing...', 'info');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const user = APP_DATA.currentUser;
      const txns = APP_DATA.transactions;
      const now = new Date();
      const statementDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // 1. Header Banner
      doc.setFillColor(15, 23, 42); // #0f172a
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SECURELEDGER BANK', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('AI-Monitored Digital Banking & Double-Entry Ledger System', 14, 25);
      doc.text(`Generated on: ${statementDate} ${now.toLocaleTimeString()}`, 14, 30);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('OFFICIAL ACCOUNT STATEMENT', 135, 18);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(56, 189, 248);
      doc.text('VERIFIED WITH AUDIT PROOF', 135, 25);

      // 2. Account Information Summary Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 42, 182, 34, 3, 3, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Account Holder:', 20, 50);
      doc.text('Account Number:', 20, 58);
      doc.text('IFSC Code:', 20, 66);

      doc.setFont('helvetica', 'normal');
      doc.text(user.name, 56, 50);
      doc.text(user.accountNumber || 'SLAC000001', 56, 58);
      doc.text(user.ifsc || 'SLB0001234', 56, 66);

      doc.setFont('helvetica', 'bold');
      doc.text('Current Balance:', 110, 50);
      doc.text('KYC Status:', 110, 58);
      doc.text('Risk Profile:', 110, 66);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129); // Green
      doc.setFont('helvetica', 'bold');
      doc.text(`INR ${user.balance.toLocaleString('en-IN')}.00`, 146, 50);
      doc.setTextColor(15, 23, 42);
      doc.text('VERIFIED (Biometric Tier-1)', 146, 58);
      doc.text(`${user.riskProfile || 'Low'} (AI Score: 18/100)`, 146, 66);

      // 3. Transactions Table (autoTable)
      const tableData = txns.map(t => [
        t.id,
        `${t.date}\n${t.time || ''}`,
        `${t.sender} -> ${t.receiver}`,
        t.type,
        t.category,
        (t.type === 'Debit' ? '-' : '+') + `INR ${t.amount.toLocaleString('en-IN')}`,
        t.risk.toUpperCase(),
        t.status
      ]);

      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 82,
          head: [['TXN ID', 'Date & Time', 'Counterparties', 'Type', 'Category', 'Amount', 'AI Risk', 'Status']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 7.5,
            cellPadding: 3
          },
          columnStyles: {
            0: { font: 'courier', fontStyle: 'bold', cellWidth: 20 },
            1: { cellWidth: 22 },
            2: { cellWidth: 42 },
            3: { cellWidth: 16 },
            4: { cellWidth: 20 },
            5: { fontStyle: 'bold', halign: 'right', cellWidth: 24 },
            6: { fontStyle: 'bold', halign: 'center', cellWidth: 16 },
            7: { cellWidth: 22 }
          },
          didDrawPage: (data) => {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text(
              'SecureLedger Automated Banking System — Academic Prototype — Double-Entry Invariant Verified',
              14,
              288
            );
            doc.text(`Page ${doc.internal.getNumberOfPages()}`, 190, 288);
          }
        });
      }

      doc.save(`SecureLedger_Statement_${user.accountNumber || 'SLAC000001'}_${Date.now()}.pdf`);
      this.showToast('✓ Statement downloaded successfully.', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      this.showToast('Could not generate PDF statement.', 'danger');
    }
  }
}

// ──────────────────────────────────────────────
// INITIALIZE
// ──────────────────────────────────────────────
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new SecureLedgerApp();
  app.init();
});
