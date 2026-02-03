import { Session } from './js/modules/logic/Session.js';
import { ChartManager } from './js/modules/view/ChartManager.js';
import { ATDSAnalyzer } from './js/modules/logic/ATDSAnalyzer.js';
import { DeviceManager } from './js/modules/io/DeviceManager.js';
import { PhysioMetrics } from './js/modules/logic/PhysioMetrics.js';
import { AdvancedCharts } from './js/modules/view/AdvancedCharts.js';

class App {
    constructor() {
        this.session = new Session();
        this.chartManager = new ChartManager('mainChart');
        this.analyzer = new ATDSAnalyzer();
        this.device = new DeviceManager(
            (data) => this.handleLiveData(data),
            (status) => this.handleDeviceStatus(status)
        );
        this.isLive = false;
        this.isAnalyzeMode = false;
        this.isMultiView = false;
        this.poincareChart = null;
        this.histogramChart = null;
        
        // Live Analysis State
        this.liveBuffer = [];
        this.maxSessionRR = 0;

        this.bindEvents();
    }

    bindEvents() {
        // File Loading
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileLoad(e));
        
        // Profile & Analysis
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.updateAnalysis());

        // Analyze Mode Toggle
        const btnAnalyzeMode = document.getElementById('btnAnalyzeMode');
        if (btnAnalyzeMode) btnAnalyzeMode.addEventListener('click', () => this.toggleAnalyzeMode());

        // Zoom Controls
        const btnResetZoom = document.getElementById('btnResetZoom');
        if (btnResetZoom) btnResetZoom.addEventListener('click', () => this.chartManager.resetZoom());

        // Multi-View Toggle
        const btnMultiView = document.getElementById('btnMultiView');
        if (btnMultiView) btnMultiView.addEventListener('click', () => this.toggleMultiView());

        // Reporting Buttons
        const saveAtdsBtn = document.getElementById('saveAtdsBtn');
        if (saveAtdsBtn) saveAtdsBtn.addEventListener('click', () => this.saveSession());

        const saveTxtBtn = document.getElementById('saveTxtBtn');
        if (saveTxtBtn) saveTxtBtn.addEventListener('click', () => this.exportTxt());

        const pdfBtn = document.getElementById('pdfBtn');
        if (pdfBtn) pdfBtn.addEventListener('click', () => this.exportPdf());

        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) copyBtn.addEventListener('click', () => this.copySummary());

        // Optional Controls (Check existence)
        const btnResetAT = document.getElementById('btnResetAT');
        if (btnResetAT) {
            btnResetAT.addEventListener('click', () => {
                const autoVal = this.session.resetAT();
                this.refreshChart();
                alert(`AT Reset to Auto-Calculated value: ${autoVal} BPM`);
            });
        }

        const btnCropData = document.getElementById('btnCropData');
        if (btnCropData) btnCropData.addEventListener('click', () => this.handleCrop());

        // Device Connection
        const btnConnect = document.getElementById('btnConnectSerial');
        if (btnConnect) btnConnect.addEventListener('click', () => this.device.connect());

        const btnLive = document.getElementById('btnLiveToggle');
        if (btnLive) btnLive.addEventListener('click', () => this.toggleLiveMode());

        const btnSave = document.getElementById('btnSaveSession');
        if (btnSave) btnSave.addEventListener('click', () => this.saveSession());

        const btnAdvCharts = document.getElementById('btnShowAdvanced');
        if (btnAdvCharts) btnAdvCharts.addEventListener('click', () => this.renderAdvancedCharts());

        const btnExportPoincare = document.getElementById('btnExportPoincare');
        if (btnExportPoincare) btnExportPoincare.addEventListener('click', () => this.exportPoincareImage());

        const btnExportHistogram = document.getElementById('btnExportHistogram');
        if (btnExportHistogram) btnExportHistogram.addEventListener('click', () => this.exportHistogramImage());

        // Settings Modal
        const btnSettings = document.getElementById('btnSettings');
        if (btnSettings) btnSettings.addEventListener('click', () => this.openSettings());

        const closeSettings = document.querySelector('.close-modal');
        if (closeSettings) closeSettings.addEventListener('click', () => this.closeSettings());

        const btnSaveSettings = document.getElementById('btnSaveSettings');
        if (btnSaveSettings) btnSaveSettings.addEventListener('click', () => this.saveSettings());

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('settingsModal');
            if (e.target === modal) this.closeSettings();
        });
    }

    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.toggleLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            // Small timeout to allow UI to render spinner before heavy processing
            setTimeout(() => {
                try {
            const content = e.target.result;

            // Check for JSON format (ATDS file)
            if (file.name.endsWith('.atds') || content.trim().startsWith('{')) {
                try {
                    const json = JSON.parse(content);
                    
                    // Load RR Data
                    if (json.rrData && Array.isArray(json.rrData)) {
                        const isValid = json.rrData.length > 0 && json.rrData.every(n => typeof n === 'number' && n > 0 && n < 5000);
                        if (!isValid) {
                            alert("Error: File contains invalid RR interval data.");
                            this.toggleLoading(false);
                            return;
                        }
                        this.session.loadData(json.rrData);
                    } else {
                        alert("Error: Invalid .atds file format (missing rrData).");
                        this.toggleLoading(false);
                        return;
                    }

                    // Load Profile & Update UI
                    if (json.profile) {
                        this.session.setProfile(json.profile);
                        if (json.profile.age) document.getElementById('age').value = json.profile.age;
                        if (json.profile.weight) document.getElementById('weight').value = json.profile.weight;
                    }

                    // Load Analysis State (Manual AT)
                    if (json.analysis && json.analysis.manualAT) {
                        this.session.setManualAT(json.analysis.manualAT);
                    }
                } catch (err) {
                    alert("Error parsing ATDS file.");
                    this.toggleLoading(false);
                    return;
                }
            } else {
                // Legacy/Raw Text parsing
                const numbers = content.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0 && n < 5000);
                
                if (numbers.length === 0) {
                    alert("Error: No valid RR intervals found in file.");
                    this.toggleLoading(false);
                    return;
                }
                this.session.loadData(numbers);
                
                // Update Profile from UI (default behavior for raw files)
                this.session.setProfile({
                    age: document.getElementById('age').value,
                    weight: document.getElementById('weight').value
                });
            }

            this.refreshChart();
                } catch (error) {
                    console.error(error);
                    alert("An unexpected error occurred during processing.");
                } finally {
                    this.toggleLoading(false);
                }
            }, 50);
        };
        reader.onerror = () => this.toggleLoading(false);
        reader.readAsText(file);
    }

    handleCrop() {
        const range = this.chartManager.getVisibleRange();
        if (!range) return;

        const start = Math.max(0, Math.floor(range.start));
        const end = Math.min(this.session.workingRR.length - 1, Math.ceil(range.end));

        if (end - start < 10) {
            alert("Selection too small. Please zoom out to select at least 10 beats.");
            return;
        }

        if (confirm(`Crop data to currently visible range (Beats ${start} to ${end})?`)) {
            this.session.cropData(start, end);
            this.chartManager.resetZoom();
            this.refreshChart();
        }
    }

    handleLiveData(rrValue) {
        if (!this.isLive) return;
        this.session.workingRR.push(rrValue);
        // Efficient moving window update
        this.chartManager.updateLive(rrValue);
        
        // Update Max RR (Resting HR proxy) efficiently
        if (rrValue > this.maxSessionRR && rrValue < 2000) this.maxSessionRR = rrValue;

        // Live Analysis (Circular Buffer / Sliding Window)
        this.liveBuffer.push(rrValue);
        if (this.liveBuffer.length > 60) this.liveBuffer.shift();

        if (this.liveBuffer.length < 10) return;

        const results = this.analyzer.process(this.liveBuffer);
        if (results) {
            // Update Breath Rate
            const elBreath = document.getElementById('dispBreathRate');
            if (elBreath) {
                const brClass = PhysioMetrics.evaluateBreathRate(results.breathRate);
                elBreath.innerHTML = `${results.breathRate} <span style="font-size:0.6em; color:#7f8c8d">(${brClass})</span>`;
            }

            // Update Live VO2
            const currentHR = Math.round(60000 / rrValue);
            // Use cached max RR instead of iterating full history
            const restingHR = this.maxSessionRR > 0 ? Math.round(60000 / this.maxSessionRR) : currentHR;
            
            const currentVO2 = PhysioMetrics.calculateCurrentVO2(
                currentHR,
                this.session.profile.age,
                this.session.profile.gender,
                restingHR
            );

            const elVO2 = document.getElementById('dispVO2');
            if (elVO2) {
                elVO2.innerHTML = `${currentVO2}`;
                const elVO2Class = document.getElementById('dispVO2Class');
                if (elVO2Class) elVO2Class.innerText = "Live Metabolic Rate";
            }
        }
    }

    refreshChart() {
        const data = this.session.workingRR;
        const at = this.session.getAT();
        
        // Run Analysis first to get smoothed data if needed
        const results = this.analyzer.process(data);
        const smoothedData = results ? results.smoothedData : null;

        this.chartManager.render(
            data, 
            at, 
            (newAT) => {
                this.session.setManualAT(newAT);
                this.updateZoneTable(newAT);
            },
            this.isAnalyzeMode,
            smoothedData,
            (e, index) => this.showDataMenu(e, index)
        );

        // Render Secondary Chart if Multi-View is active
        if (this.isMultiView) {
            if (this.poincareChart) this.poincareChart.destroy();
            this.poincareChart = AdvancedCharts.renderPoincare('secondaryChart', data);
        }

        if (results) {
            // Update Basic Stats
            const age = this.session.profile.age;

            if(document.getElementById('dispAvgHR')) document.getElementById('dispAvgHR').innerText = results.avgHR;
            if(document.getElementById('dispTiTe')) document.getElementById('dispTiTe').innerText = results.tiTe;
            
            if(document.getElementById('dispBreathRate')) {
                const brClass = PhysioMetrics.evaluateBreathRate(results.breathRate);
                document.getElementById('dispBreathRate').innerHTML = `${results.breathRate} <span style="font-size:0.6em; color:#7f8c8d">(${brClass})</span>`;
            }

            if(document.getElementById('dispHrvAmp')) {
                const hrvClass = PhysioMetrics.evaluateHRV(results.hrvAmp, age);
                document.getElementById('dispHrvAmp').innerHTML = `${results.hrvAmp} <span style="font-size:0.6em; color:#7f8c8d">(${hrvClass})</span>`;
            }

            // Update VO2 Max
            const gender = this.session.profile.gender;
            // Use Min HR from analysis as proxy for Resting HR
            const rhr = 60000 / Math.max(...data); 
            const vo2 = PhysioMetrics.calculateVO2Max(age, gender, rhr);
            const vo2Class = PhysioMetrics.evaluateVO2(vo2, age, gender);
            
            if(document.getElementById('dispVO2')) {
                document.getElementById('dispVO2').innerText = vo2 || "--";
                document.getElementById('dispVO2Class').innerText = vo2Class;
            }

            // Update Narrative Report with Age Group Comparison
            const reportContent = document.getElementById('reportContent');
            if (reportContent) {
                const hrvClass = PhysioMetrics.evaluateHRV(results.hrvAmp, age);
                const brClass = PhysioMetrics.evaluateBreathRate(results.breathRate);
                let html = `Analysis for a <strong>${age}-year-old ${gender}</strong>:<br>`;
                html += `• <strong>HRV Amplitude:</strong> ${results.hrvAmp}ms (${hrvClass} for age group).<br>`;
                html += `• <strong>VO2 Max Estimate:</strong> ${vo2 || '--'} ml/kg/min (${vo2Class}).<br>`;
                html += `• <strong>Breath Rate:</strong> ${results.breathRate} bpm (${brClass}).`;
                reportContent.innerHTML = html;
            }

            // Update Training Zones
            this.updateZoneTable(at);

            // Show Results Area
            const resultsArea = document.getElementById('resultsArea');
            if (resultsArea) resultsArea.classList.remove('hidden');
            
            // Show Export Buttons
            ['saveAtdsBtn', 'saveTxtBtn', 'pdfBtn', 'copyBtn', 'btnAnalyzeMode', 'btnResetZoom', 'btnMultiView', 'btnCropData'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('hidden');
            });
        }
    }

    updateAnalysis() {
        const ageInput = document.getElementById('age');
        const weightInput = document.getElementById('weight');
        const genderInput = document.getElementById('gender');

        if (ageInput && weightInput && genderInput) {
            this.session.setProfile({
                age: parseInt(ageInput.value),
                weight: parseInt(weightInput.value),
                gender: genderInput.value
            });
        }
        
        if (this.session.workingRR.length > 0) {
            this.refreshChart();
        } else {
            alert("Please load a file first.");
        }
    }

    toggleAnalyzeMode() {
        this.isAnalyzeMode = !this.isAnalyzeMode;
        const btn = document.getElementById('btnAnalyzeMode');
        if (btn) {
            btn.classList.toggle('btn-active', this.isAnalyzeMode);
            btn.innerText = this.isAnalyzeMode ? "Exit Analyze Mode" : "Analyze Chart";
            // Change button style to indicate active state
            btn.style.backgroundColor = this.isAnalyzeMode ? '#e74c3c' : '';
        }
        this.refreshChart();
    }

    toggleMultiView() {
        this.isMultiView = !this.isMultiView;
        const secWrapper = document.getElementById('secondaryChartWrapper');
        if (secWrapper) {
            if (this.isMultiView) secWrapper.classList.remove('hidden');
            else secWrapper.classList.add('hidden');
        }
        this.refreshChart();
    }

    showDataMenu(event, index) {
        const existing = document.getElementById('chartContextMenu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.id = 'chartContextMenu';
        menu.style.position = 'absolute';
        const evt = event.native || event;
        menu.style.left = evt.pageX + 'px';
        menu.style.top = evt.pageY + 'px';
        menu.style.background = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.padding = '5px';
        menu.style.borderRadius = '4px';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        menu.style.zIndex = 1000;

        menu.innerHTML = `
            <div style="font-weight:bold; border-bottom:1px solid #eee; padding:3px;">Point #${index}</div>
            <button style="display:block; width:100%; text-align:left; padding:5px; border:none; background:none; cursor:pointer;" onclick="window.app.editPoint(${index})">Edit Value</button>
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

    editPoint(index) {
        const currentRR = this.session.workingRR[index];
        const currentBPM = Math.round(60000/currentRR);
        const newBPM = prompt(`Edit BPM for point #${index}:`, currentBPM);
        
        if (newBPM !== null && !isNaN(newBPM) && newBPM > 0) {
            const newRR = Math.round(60000 / parseInt(newBPM));
            this.session.workingRR[index] = newRR;
            this.refreshChart();
        }
        const menu = document.getElementById('chartContextMenu');
        if(menu) menu.remove();
    }

    deletePoint(index) {
        if(confirm(`Delete point #${index}?`)) {
            this.session.workingRR.splice(index, 1);
            this.refreshChart();
        }
        const menu = document.getElementById('chartContextMenu');
        if(menu) menu.remove();
    }

    updateZoneTable(at) {
        const table = document.getElementById('zoneTable');
        if (!table || !at) return;

        const zones = [
            { name: "Recovery", range: `< ${Math.round(at * 0.8)}`, desc: "Active recovery, very light effort", color: "#2ecc71" },
            { name: "Aerobic", range: `${Math.round(at * 0.8)} - ${Math.round(at * 0.9)}`, desc: "Endurance building, conversation pace", color: "#3498db" },
            { name: "Tempo", range: `${Math.round(at * 0.9)} - ${Math.round(at * 0.95)}`, desc: "Rhythm, sustainable fast pace", color: "#9b59b6" },
            { name: "Threshold", range: `${Math.round(at * 0.95)} - ${Math.round(at)}`, desc: "Lactate Threshold, hard effort", color: "#f1c40f" },
            { name: "Anaerobic", range: `> ${Math.round(at)}`, desc: "Intervals, maximum effort", color: "#e74c3c" }
        ];

        let html = `
            <thead>
                <tr>
                    <th>Zone</th>
                    <th>Range (BPM)</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
        `;

        zones.forEach(z => {
            html += `
                <tr>
                    <td style="border-left: 5px solid ${z.color}; font-weight:bold;">${z.name}</td>
                    <td>${z.range}</td>
                    <td>${z.desc}</td>
                </tr>
            `;
        });

        html += `</tbody>`;
        table.innerHTML = html;
    }

    exportTxt() {
        const data = this.session.workingRR;
        if (!data || data.length === 0) {
            alert("No data to export.");
            return;
        }
        const content = data.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atds_data_${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportPdf() {
        const element = document.querySelector('.container');
        const controls = document.querySelector('.controls');
        
        if (controls) controls.style.display = 'none';
        
        const opt = {
            margin:       0.3,
            filename:     `atds_report_${new Date().toISOString().slice(0,10)}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        if (window.html2pdf) {
            window.html2pdf().set(opt).from(element).save().then(() => {
                if (controls) controls.style.display = '';
            }).catch(err => {
                console.error(err);
                alert("Error generating PDF");
                if (controls) controls.style.display = '';
            });
        } else {
            alert("PDF library not loaded.");
            if (controls) controls.style.display = '';
        }
    }

    copySummary() {
        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.innerText : '--';
        };

        const text = `ATDS Health Report Summary\n` +
                     `--------------------------\n` +
                     `Avg Heart Rate: ${getVal('dispAvgHR')} BPM\n` +
                     `Ti/Te Ratio: ${getVal('dispTiTe')}\n` +
                     `Breath Rate: ${getVal('dispBreathRate')} breaths/min\n` +
                     `HRV Amplitude: ${getVal('dispHrvAmp')} ms\n` +
                     `VO2 Max Est: ${getVal('dispVO2')} (${getVal('dispVO2Class')})\n`;
                     
        navigator.clipboard.writeText(text).then(() => {
            alert("Summary copied to clipboard!");
        }).catch(err => console.error(err));
    }

    toggleLiveMode() {
        this.isLive = !this.isLive;
        
        if (this.isLive) {
            // Initialize live state
            this.liveBuffer = [];
            this.maxSessionRR = this.session.workingRR.length > 0 
                ? Math.max(...this.session.workingRR) 
                : 0;
        }

        const btn = document.getElementById('btnLiveToggle');
        if (btn) {
            btn.innerText = this.isLive ? "Stop Live Feed" : "Start Live Feed";
            btn.classList.toggle('btn-danger');
        }
    }

    saveSession() {
        const json = this.session.saveAtds();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atds_session_${new Date().toISOString().slice(0,10)}.atds`;
        a.click();
        URL.revokeObjectURL(url);
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.remove('hidden');
        
        // Load saved settings
        const unit = localStorage.getItem('atds_weight_unit') || 'kg';
        const elUnit = document.getElementById('settingWeightUnit');
        if (elUnit) elUnit.value = unit;

        const proto = localStorage.getItem('atds_protocol') || 'serial';
        const elProto = document.getElementById('settingProtocol');
        if (elProto) elProto.value = proto;
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.add('hidden');
    }

    saveSettings() {
        const elUnit = document.getElementById('settingWeightUnit');
        if (elUnit) {
            localStorage.setItem('atds_weight_unit', elUnit.value);
            // Update UI label
            const weightGroup = document.getElementById('weight')?.parentElement;
            if (weightGroup) weightGroup.querySelector('label').innerText = `Weight (${elUnit.value})`;
        }

        const elProto = document.getElementById('settingProtocol');
        if (elProto) {
            localStorage.setItem('atds_protocol', elProto.value);
        }

        this.closeSettings();
    }

    handleDeviceStatus(status) {
        if (status.type === 'battery') {
            this.updateBatteryLevel(status.value);
        } else if (status.type === 'firmware') {
            console.log("Device Firmware:", status.value);
            const elFw = document.getElementById('settingFirmware');
            if (elFw) elFw.innerText = status.value;
            
            // Auto-save firmware version to session if needed
            // this.session.setFirmware(status.value);
        }
    }

    /**
     * Updates the battery indicator UI.
     * @param {number} percentage - Battery level (0-100)
     */
    updateBatteryLevel(percentage) {
        const container = document.getElementById('batteryContainer');
        const fill = document.getElementById('batteryFill');
        const text = document.getElementById('batteryText');

        if (container) container.classList.remove('hidden');
        if (text) text.innerText = Math.round(percentage) + '%';
        if (fill) {
            fill.style.width = percentage + '%';
            // Change color based on level
            fill.style.background = percentage < 20 ? '#e74c3c' : (percentage < 50 ? '#f1c40f' : '#2ecc71');
        }

        // Auto-stop if critical
        if (this.isLive && percentage < 5) {
            this.toggleLiveMode();
            alert("Battery Critical (<5%): Live feed stopped automatically.");
        }
    }

    renderAdvancedCharts() {
        const data = this.session.workingRR;
        if (!data || data.length === 0) return;
        
        document.getElementById('advancedChartsArea').classList.remove('hidden');
        if(this.poincareChart) this.poincareChart.destroy();
        if(this.histogramChart) this.histogramChart.destroy();
        
        this.poincareChart = AdvancedCharts.renderPoincare('poincareChart', data);
        this.histogramChart = AdvancedCharts.renderHistogram('histogramChart', data);
    }

    exportPoincareImage() {
        if (!this.poincareChart) {
            alert("Poincaré plot is not generated yet.");
            return;
        }
        this.downloadChart(this.poincareChart, 'poincare_plot.png');
    }

    exportHistogramImage() {
        if (!this.histogramChart) {
            alert("Histogram chart is not generated yet.");
            return;
        }
        this.downloadChart(this.histogramChart, 'histogram_plot.png');
    }

    downloadChart(chart, filename, backgroundColor = 'white') {
        // Create a temporary canvas to apply background color
        const canvas = document.createElement('canvas');
        canvas.width = chart.canvas.width;
        canvas.height = chart.canvas.height;
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw chart on top
        ctx.drawImage(chart.canvas, 0, 0);

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = filename;
        a.click();
    }

    toggleLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            if (show) spinner.classList.remove('hidden');
            else spinner.classList.add('hidden');
        }
    }
}

// Initialize
window.app = new App();