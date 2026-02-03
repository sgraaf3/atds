import { ChartInteractions } from './ChartInteractions.js';

/**
 * MODULE: UIManager
 * Handles DOM manipulation, Input Injection, and Chart updates.
 */
export class UIManager {
    constructor() {
        this.injectExtendedUI();
        this.chart = null;
    }

    injectExtendedUI() {
        const controls = document.querySelector('.controls');
        if (!controls) return;

        // Inject new inputs for BMI Software features
        const extraInputs = `
            <div class="input-group">
                <label>Systolic BP (mmHg)</label>
                <input type="number" id="sysBP" value="120">
            </div>
            <div class="input-group">
                <label>Diastolic BP (mmHg)</label>
                <input type="number" id="diaBP" value="80">
            </div>
            <div class="input-group">
                <label>Body Fat (%)</label>
                <input type="number" id="bodyFat" value="15">
            </div>
            <div class="input-group" style="grid-column: span 2;">
                <label>Device Connection</label>
                <div style="display: flex; gap: 10px;">
                    <button id="btnConnectSerial" class="btn-secondary">Connect BMI Dongle (USB)</button>
                    <button id="btnConnectBT" class="btn-secondary">Connect BlueRobin/BT</button>
                </div>
            </div>
            <div class="input-group">
                <label>Analysis Mode</label>
                <div style="display: flex; gap: 5px;">
                    <button id="btnAnalyzeMode" class="btn-secondary" data-tooltip="Enter Data Cleaning Mode">Analyze Chart</button>
                    <select id="calcSourceSelect" style="padding: 8px;">
                        <option value="filtered">Calc: Filtered Data</option>
                        <option value="raw">Calc: Unfiltered Data</option>
                    </select>
                </div>
            </div>
        `;
        
        const div = document.createElement('div');
        div.style.display = 'contents';
        div.innerHTML = extraInputs;
        controls.insertBefore(div, controls.lastElementChild);

        // Add VO2 Max Card to Dashboard
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            const vo2Card = document.createElement('div');
            vo2Card.className = 'stat-card';
            vo2Card.innerHTML = `
                <div class="stat-label">VO2 Max Est.</div>
                <div class="stat-value" id="dispVO2">--</div>
                <small id="dispVO2Class">--</small>
            `;
            dashboard.appendChild(vo2Card);
        }

        // Excel & Template Controls
        const btnContainer = document.querySelector('.controls');
        const templateSelect = document.createElement('select');
        templateSelect.id = 'excelTemplateSelect';
        templateSelect.innerHTML = `
            <option value="raw">Template: Raw Data</option>
            <option value="clinical">Template: Clinical Summary</option>
            <option value="hrv">Template: HRV Analysis</option>
        `;
        btnContainer.appendChild(templateSelect);

        const excelBtn = document.createElement('button');
        excelBtn.id = 'btnExportExcel';
        excelBtn.className = 'btn-secondary hidden';
        excelBtn.innerText = 'Export Excel';
        btnContainer.appendChild(excelBtn);

        // Report Editable
        const reportContent = document.getElementById('reportContent');
        if(reportContent) {
            reportContent.setAttribute('contenteditable', 'true');
            reportContent.style.border = "1px dashed #ccc";
            reportContent.style.padding = "10px";
            const editHint = document.createElement('small');
            editHint.style.color = '#7f8c8d';
            editHint.innerText = '✎ Text below is editable.';
            reportContent.parentNode.insertBefore(editHint, reportContent);
        }
    }

    renderChart(data, isAnalyzeMode = false, atValue = 150, onATChange = null) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        if(this.chart) this.chart.destroy();

        // Prepare Datasets
        const dsFiltered = {
            label: 'Filtered HR (BPM)',
            data: data.smoothedData.map(rr => Math.round(60000/rr)),
            borderColor: '#3498db',
            backgroundColor: '#3498db',
            tension: 0.4,
            pointRadius: isAnalyzeMode ? 3 : 0,
            borderWidth: 2,
            order: 1
        };

        const dsRaw = {
            label: 'Unfiltered HR (BPM)',
            data: data.rrData.map(rr => Math.round(60000/rr)),
            borderColor: '#e74c3c',
            backgroundColor: '#e74c3c',
            borderDash: [5, 5],
            tension: 0,
            pointRadius: isAnalyzeMode ? 3 : 0,
            borderWidth: 1,
            hidden: !isAnalyzeMode,
            order: 2
        };

        // Register AT Line Plugin
        const plugins = [];
        if (atValue && onATChange) {
            plugins.push(ChartInteractions.getATLinePlugin(atValue, onATChange));
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.smoothedData.map((_, i) => i),
                datasets: [dsFiltered, dsRaw]
            },
            plugins: plugins, // Add custom plugins here
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                plugins: {
                    title: { display: true, text: isAnalyzeMode ? 'Analyze Mode: Data Cleaning' : 'Respiratory Sinus Arrhythmia (RSA)' },
                    legend: { display: true },
                    tooltip: { enabled: !isAnalyzeMode }
                },
                onClick: (e, elements) => {
                    if (isAnalyzeMode && elements.length > 0) {
                        this.showDataMenu(e, elements[0].index, elements[0].datasetIndex);
                    }
                },
                scales: {
                    y: { title: { display: true, text: 'Heart Rate (BPM)' } },
                    x: { title: { display: true, text: 'Beat Count' } }
                }
            }
        });
    }

    showDataMenu(event, index, datasetIndex) {
        const existing = document.getElementById('chartContextMenu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.id = 'chartContextMenu';
        menu.style.position = 'absolute';
        menu.style.left = event.native.pageX + 'px';
        menu.style.top = event.native.pageY + 'px';
        menu.style.background = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.padding = '5px';
        menu.style.borderRadius = '4px';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        menu.style.zIndex = 1000;

        const datasetName = datasetIndex === 0 ? "Filtered" : "Unfiltered";

        menu.innerHTML = `
            <div style="font-weight:bold; border-bottom:1px solid #eee; padding:3px;">Point #${index} (${datasetName})</div>
            <button style="display:block; width:100%; text-align:left; padding:5px; border:none; background:none; cursor:pointer;" onclick="window.app.editPoint(${index}, ${datasetIndex})">Edit Value</button>
            <button style="display:block; width:100%; text-align:left; padding:5px; border:none; background:none; cursor:pointer;" onclick="window.app.deletePoint(${index})">Delete Point</button>
            <button style="display:block; width:100%; text-align:left; padding:5px; border:none; background:none; cursor:pointer; color:red;" onclick="this.parentElement.remove()">Cancel</button>
        `;

        document.body.appendChild(menu);
        
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            }, { once: true });
        }, 100);
    }

    updateLiveChart(chart, rrValue) {
        if (!chart) return;
        const label = chart.data.labels.length;
        const bpm = Math.round(60000/rrValue);
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(bpm);
        if (chart.data.labels.length > 100) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.update('none');
    }

    generateExcelDump(rrData, profile) {
        const template = document.getElementById('excelTemplateSelect').value;
        let csv = "";
        const dateStr = new Date().toLocaleString();
        
        csv += `ATDS Report (${template})\nDate,${dateStr}\n`;
        csv += `Profile,${profile.age}y, ${profile.weight}kg\n\n`;
        csv += `Index,RR(ms),BPM\n`;
        
        rrData.forEach((rr, i) => {
            csv += `${i+1},${rr},${Math.round(60000/rr)}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'report.csv'; a.click();
    }
}