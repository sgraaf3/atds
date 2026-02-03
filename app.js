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
            (level) => this.updateBatteryLevel(level)
        );
        this.isLive = false;
        this.poincareChart = null;
        this.histogramChart = null;
        
        this.bindEvents();
    }

    bindEvents() {
        // File Loading
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileLoad(e));
        
        // Profile & Analysis
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.updateAnalysis());

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
        // Option 1: Crop to current Zoom view
        const range = this.chartManager.getVisibleRange();
        
        // Option 2: Simple prompt for demo (Robust UI would use range sliders)
        const start = prompt("Enter Start Beat Index:", range ? range.start : 0);
        const end = prompt("Enter End Beat Index:", range ? range.end : this.session.workingRR.length);

        if (start !== null && end !== null) {
            this.session.cropData(parseInt(start), parseInt(end));
            this.refreshChart();
        }
    }

    handleLiveData(rrValue) {
        if (!this.isLive) return;
        // NOTE: This is inefficient for long sessions as it re-processes and re-renders everything on each beat.
        // A better approach would be to append data to the chart directly and calculate stats on a moving window.
        this.session.workingRR.push(rrValue);
        this.refreshChart();
    }

    refreshChart() {
        const data = this.session.workingRR;
        const at = this.session.getAT();
        
        this.chartManager.render(data, at, (newAT) => {
            // Callback if chart supports dragging AT line
            this.session.setManualAT(newAT);
        });

        // Run Analysis
        const results = this.analyzer.process(data);
        if (results) {
            // Update Basic Stats
            if(document.getElementById('dispAvgHR')) document.getElementById('dispAvgHR').innerText = results.avgHR;
            if(document.getElementById('dispTiTe')) document.getElementById('dispTiTe').innerText = results.tiTe;
            if(document.getElementById('dispBreathRate')) document.getElementById('dispBreathRate').innerText = results.breathRate;
            if(document.getElementById('dispHrvAmp')) document.getElementById('dispHrvAmp').innerText = results.hrvAmp;
            
            // Update VO2 Max
            const age = this.session.profile.age;
            const gender = this.session.profile.gender;
            // Use Min HR from analysis as proxy for Resting HR
            const rhr = 60000 / Math.max(...data); 
            const vo2 = PhysioMetrics.calculateVO2Max(age, gender, rhr);
            const vo2Class = PhysioMetrics.evaluateVO2(vo2, age, gender);
            
            if(document.getElementById('dispVO2')) {
                document.getElementById('dispVO2').innerText = vo2 || "--";
                document.getElementById('dispVO2Class').innerText = vo2Class;
            }

            // Show Results Area
            const resultsArea = document.getElementById('resultsArea');
            if (resultsArea) resultsArea.classList.remove('hidden');
            
            // Show Export Buttons
            ['saveAtdsBtn', 'saveTxtBtn', 'pdfBtn', 'copyBtn'].forEach(id => {
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