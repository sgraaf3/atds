import { ChartInteractions } from './ChartInteractions.js';
import { i18n } from '../utils/Localization.js';

/**
 * MODULE: UIManager
 * Handles DOM manipulation, Input Injection, and Chart updates.
 */
export class UIManager {
    constructor() {
        this.dashboardInjected = false; // Track if dashboard structure is in DOM
        this.injectExtendedUI();
        this.chart = null;
        this.injectControlButtons(); // Inject main control buttons
        this.injectActionMenu(); // Inject action menu on init
        this.setupToggles(); // Setup display toggles on init
    }

    injectExtendedUI(targetElement = document.querySelector('.controls')) {
        if (!targetElement) return;
        // Inject dashboard structure if not already present
        this.injectDashboardStructure();

        // These are additional inputs in the controls section, not part of the dashboard itself
        // Inject new inputs for BMI Software features (using data-i18n for labels)
        const extraInputs = `
            <div class="input-group" data-i18n-group="systolicBP">
                <label data-i18n="systolicBP">Systolic BP (mmHg)</label>
                <input type="number" id="sysBP" value="120" data-tooltip-i18n="systolicBPTooltip"> <span class="tooltip-icon" data-tooltip-i18n="systolicBPTooltip">?</span>
            </div>
            <div class="input-group" data-i18n-group="diastolicBP">
                <label data-i18n="diastolicBP">Diastolic BP (mmHg)</label>
                <input type="number" id="diaBP" value="80" data-tooltip-i18n="diastolicBPTooltip"> <span class="tooltip-icon" data-tooltip-i18n="diastolicBPTooltip">?</span>
            </div>
            <div class="input-group" data-i18n-group="bodyFat">
                <label data-i18n="bodyFat">Body Fat (%)</label>
                <input type="number" id="bodyFat" value="15" data-tooltip-i18n="bodyFatTooltip"> <span class="tooltip-icon" data-tooltip-i18n="bodyFatTooltip">?</span>
            </div>
            <div class="input-group" style="grid-column: span 2;">
                <label data-i18n="deviceConnection">Device Connection <span class="tooltip-icon" data-tooltip-i18n="deviceConnectionTooltip">?</span></label>
                <div style="display: flex; gap: 10px;">
                    <button id="btnConnectSerial" class="btn-secondary" data-i18n="connectUSBDongle" data-tooltip-i18n="connectUSBDongleTooltip">Connect BMI Dongle (USB)</button>
                    <button id="btnConnectBT" class="btn-secondary" data-i18n="connectBluetoothLE" data-tooltip-i18n="connectBluetoothLETooltip">Connect BlueRobin/BT</button>
                </div>
            </div>
            <div class="input-group" data-i18n-group="analysisMode">
                <label data-i18n="analysisMode">Analysis Mode <span class="tooltip-icon" data-tooltip-i18n="analysisModeTooltip">?</span></label>
                <div style="display: flex; gap: 5px;">
                    <button id="btnAnalyzeMode" class="btn-secondary" data-tooltip-i18n="analyzeChartTooltip" data-i18n="analyzeChart">Analyze Chart</button>
                    <select id="calcSourceSelect" style="padding: 8px;" data-tooltip-i18n="calcSourceSelectTooltip">
                        <option value="filtered" data-i18n="filteredData" data-tooltip-i18n="filteredDataTooltip">Calc: Filtered Data</option>
                        <option value="raw" data-i18n="unfilteredData" data-tooltip-i18n="unfilteredDataTooltip">Calc: Unfiltered Data</option>
                    </select>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.style.display = 'contents';
        div.innerHTML = extraInputs;
        targetElement.insertBefore(div, targetElement.lastElementChild);

        // Report Editable
        const reportContent = document.getElementById('reportContent');
        if(reportContent) {
            reportContent.setAttribute('contenteditable', 'true');
            reportContent.style.border = "1px dashed #ccc";
            reportContent.style.padding = "10px";
            const editHint = document.createElement('small');
            editHint.style.color = '#7f8c8d'; // Keep style
            editHint.innerText = i18n.translate('textBelowEditable');
            reportContent.parentNode.insertBefore(editHint, reportContent);
        }
    }

    injectControlButtons(targetElement = document.querySelector('.controls')) {
        if (!targetElement) return;

        const existingButtons = document.getElementById('controlButtonsContainer');
        if (existingButtons) existingButtons.remove();

        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'controlButtonsContainer';
        buttonsContainer.style.display = 'contents'; // To keep grid flow
        buttonsContainer.innerHTML = `
            <button id="analyzeBtn" data-tooltip-i18n="generateReportTooltip" data-i18n="generateReport">${i18n.translate('generateReport')}</button>
            <button id="btnResetZoom" class="btn-secondary hidden" data-tooltip-i18n="resetZoomTooltip" data-i18n="resetZoom">${i18n.translate('resetZoom')}</button>
            <button id="btnMultiView" class="btn-secondary hidden" data-tooltip-i18n="multiViewTooltip" data-i18n="multiView">${i18n.translate('multiView')}</button>
            <button id="btnCropData" class="btn-secondary hidden" data-tooltip-i18n="cropToViewTooltip" data-i18n="cropToView">${i18n.translate('cropToView')}</button>
            <button id="btnLiveToggle" class="btn-secondary hidden" data-tooltip-i18n="startLiveFeedTooltip" data-i18n="startLiveFeed">${i18n.translate('startLiveFeed')}</button>
            <button id="saveAtdsBtn" class="btn-secondary hidden" data-tooltip-i18n="saveATDSTooltip" data-i18n="saveATDS">${i18n.translate('saveATDS')}</button>
            <button id="saveTxtBtn" class="btn-secondary hidden" data-tooltip-i18n="saveTXTTooltip" data-i18n="saveTXT">${i18n.translate('saveTXT')}</button>
            <button id="excelBtn" class="btn-secondary hidden" data-tooltip-i18n="saveExcelTooltip" data-i18n="saveExcel">${i18n.translate('saveExcel')}</button>
            <button id="pdfBtn" class="btn-danger hidden" data-tooltip-i18n="exportPDFTooltip" data-i18n="exportPDF">${i18n.translate('exportPDF')}</button>
            <button id="copyBtn" class="btn-secondary hidden" data-tooltip-i18n="copyTextTooltip" data-i18n="copyText">${i18n.translate('copyText')}</button>
        `;
        targetElement.appendChild(buttonsContainer);
    }

    injectActionMenu(targetElement = document.querySelector('.controls')) {
        if (!targetElement) return;

        const existingMenu = document.getElementById('actionMenuContainer');
        if (existingMenu) existingMenu.remove(); // Remove existing to re-inject with translations

        // Ensure the action menu is placed before other buttons if they are also injected
        const firstButton = targetElement.querySelector('button');

        const menuContainer = document.createElement('div');
        menuContainer.id = 'actionMenuContainer';
        menuContainer.className = 'input-group';
        menuContainer.innerHTML = `
            <label data-i18n="sessionActions">${i18n.translate('sessionActions')} <span class="tooltip-icon" data-tooltip-i18n="actionMenuTooltip">?</span></label>
            <select id="actionMenu" style="padding:10px; border-radius:6px; font-weight:bold;" data-tooltip-i18n="actionMenuTooltip"> <span class="tooltip-icon" data-tooltip-i18n="actionMenuTooltip">?</span>
                <option value="" data-i18n="selectTask">${i18n.translate('selectTask')}</option>
                <option value="test_rest" data-i18n="restTest">${i18n.translate('restTest')}</option>
                <option value="test_training" data-i18n="trainingSession">${i18n.translate('trainingSession')}</option>
                <option value="export_pdf" data-i18n="exportPDFReport">${i18n.translate('exportPDFReport')}</option>
                <option value="export_excel" data-i18n="exportExcelClinical">${i18n.translate('exportExcelClinical')}</option>
                <option value="open_faq" data-i18n="openECFAQManual">${i18n.translate('openECFAQManual')}</option>
                <option value="honour_stans" data-i18n="honourStans">${i18n.translate('honourStans')}</option>
            </select>
        `;
        targetElement.insertBefore(menuContainer, firstButton || targetElement.lastElementChild); // Insert before first button or at end
        document.getElementById('actionMenu').onchange = (e) => window.app.handleAction(e.target.value);
    }

    setupToggles(targetElement = document.querySelector('.controls')) {
        if (!targetElement) return;

        const existingToggles = document.getElementById('displaySettingsContainer');
        if (existingToggles) existingToggles.remove(); // Remove existing to re-inject with translations

        const viewSection = document.createElement('div');
        viewSection.id = 'displaySettingsContainer';
        viewSection.className = 'view-hide-controls input-group';
        viewSection.innerHTML = `
            <h4 data-i18n="displaySettings">${i18n.translate('displaySettings')} <span class="tooltip-icon" data-tooltip-i18n="displaySettingsTooltip">?</span></h4>
            <label><input type="checkbox" id="toggleZones" checked data-tooltip-i18n="showZonesTooltip"> <span data-i18n="showZones">${i18n.translate('showZones')}</span> <span class="tooltip-icon" data-tooltip-i18n="showZonesTooltip">?</span></label>
            <label><input type="checkbox" id="toggleFilter" checked data-tooltip-i18n="filterOnTooltip"> <span data-i18n="filterOn">${i18n.translate('filterOn')}</span> <span class="tooltip-icon" data-tooltip-i18n="filterOnTooltip">?</span></label>
            <label><input type="checkbox" id="toggleAdvanced" data-tooltip-i18n="showAdvancedChartsTooltip"> <span data-i18n="showAdvancedCharts">${i18n.translate('showAdvancedCharts')}</span> <span class="tooltip-icon" data-tooltip-i18n="showAdvancedChartsTooltip">?</span></label>
        `;
        targetElement.insertBefore(viewSection, targetElement.lastElementChild);
    }

    // Method to inject the dashboard HTML structure into resultsArea
    injectDashboardStructure(targetElement = document.getElementById('resultsArea')) {
        if (this.dashboardInjected && targetElement === document.getElementById('resultsArea')) {
            // If already injected into the default resultsArea, just ensure visibility
            return;
        }
        if (!targetElement) {
            console.error("UIManager: No target element to inject dashboard structure.");
            return;
        }

        // Clear existing content if not the initial load
        targetElement.innerHTML = '';

        const dashboardHtml = `
            <div class="dashboard" id="dashboardMetrics">
                <div class="stat-card">
                    <div class="stat-label" data-i18n="avgHeartRate">Avg Heart Rate <span class="tooltip-icon" data-tooltip-i18n="avgHeartRateTooltip">?</span></div>
                    <div class="stat-value" id="dispAvgHR">--</div>
                    <small data-i18n="bpmShort">BPM</small>
                </div>
                <div class="stat-card">
                    <div class="stat-label" data-i18n="tiTeRatio">Ti / Te Ratio <span class="tooltip-icon" data-tooltip-i18n="tiTeRatioTooltip">?</span></div>
                    <div class="stat-value" id="dispTiTe">--</div>
                    <small data-i18n="tiTeDesc">Inhale/Exhale Efficiency</small>
                </div>
                <div class="stat-card">
                    <div class="stat-label" data-i18n="breathRate">Breath Rate <span class="tooltip-icon" data-tooltip-i18n="breathRateTooltip">?</span></div>
                    <div class="stat-value" id="dispBreathRate">--</div>
                    <small data-i18n="brMin">Breaths/Min</small>
                </div>
                <div class="stat-card">
                    <div class="stat-label" data-i18n="hrvAmplitudeShort">HRV Amplitude <span class="tooltip-icon" data-tooltip-i18n="hrvAmplitudeTooltip">?</span></div>
                    <div class="stat-value" id="dispHrvAmp">--</div>
                    <small data-i18n="msRSA">ms (RSA)</small>
                </div>
                <!-- VO2 Max card is injected dynamically -->
            </div>

            <div class="chart-row">
                <div class="chart-wrapper" id="mainChartWrapper">
                    <canvas id="mainChart"></canvas>
                </div>
                <div class="chart-wrapper hidden" id="secondaryChartWrapper">
                    <canvas id="secondaryChart"></canvas>
                </div>
            </div>

            <div class="report-text">
                <h3 data-i18n="analysisSummary">Analysis Summary</h3>
                <p id="reportContent" data-i18n="uploadDataToSeeAnalysis">Upload data to see analysis.</p>
                
                <h4 data-i18n="trainingZones">Training Zones (Estimated)</h4>
                <table class="zone-table" id="zoneTable">
                    <!-- Populated by JS -->
                </table>
            </div>
        `;
        targetElement.innerHTML = dashboardHtml;

        // Dynamically add VO2 Max card after dashboard structure is in place
        const dashboardMetrics = targetElement.querySelector('#dashboardMetrics');
        if (dashboardMetrics) {
            const vo2Card = document.createElement('div');
            vo2Card.className = 'stat-card';
            vo2Card.innerHTML = `<div class="stat-label" data-i18n="vo2MaxEst">VO2 Max Est. <span class="tooltip-icon" data-tooltip-i18n="conditieTooltip">?</span></div><div class="stat-value" id="dispVO2">--</div><small id="dispVO2Class">--</small>`;
            dashboardMetrics.appendChild(vo2Card);

            // Dynamically add SDNN/RMSSD card
            const hrvCard = document.createElement('div');
            hrvCard.className = 'stat-card';
            hrvCard.innerHTML = `<div class="stat-label" data-i18n="sdnnRmssdShort">SDNN / RMSSD <span class="tooltip-icon" data-tooltip-i18n="herstelscoreTooltip">?</span></div><div class="stat-value" id="dispSDNNRMSSD">--</div><small data-i18n="msShort">ms</small>`;
            dashboardMetrics.appendChild(hrvCard);
        }
        this.dashboardInjected = true;
        i18n.applyTranslations(); // Re-apply translations to the newly injected elements
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
            label: i18n.translate('unfilteredHR'),
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
                    title: { display: true, text: isAnalyzeMode ? i18n.translate('analyzeModeTitle') : i18n.translate('rsaTitle') },
                    legend: { display: true },
                    tooltip: { enabled: !isAnalyzeMode }
                },
                onClick: (e, elements) => {
                    if (isAnalyzeMode && elements.length > 0) {
                        this.showDataMenu(e, elements[0].index, elements[0].datasetIndex);
                    }
                },
                scales: {
                    y: { title: { display: true, text: i18n.translate('heartRateBPM') } },
                    x: { title: { display: true, text: i18n.translate('beatCount') } }
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

        const datasetName = datasetIndex === 0 ? i18n.translate('filtered') : i18n.translate('unfiltered');

        menu.innerHTML = `
            <div style="font-weight:bold; border-bottom:1px solid #eee; padding:3px;">${i18n.translate('editPointTitle', { index: index, datasetName: datasetName })}</div>
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
        csv += `${i18n.translate('profile')},${profile.age}${i18n.translate('y')}, ${profile.weight}${i18n.translate('kg')}\n\n`;
        csv += `Index,RR(ms),BPM\n`;
        
        rrData.forEach((rr, i) => {
            csv += `${i+1},${rr},${Math.round(60000/rr)}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'report.csv'; a.click();
    }
}