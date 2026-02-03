import { ChartInteractions } from './ChartInteractions.js';
import { i18n } from '../utils/Localization.js';
import { i18n } from '../utils/Localization.js';

export class ChartManager {
    constructor(canvasId) {
        this.ctx = document.getElementById(canvasId).getContext('2d');
        this.chart = null;
    }

    render(data, atValue, onATChange, isAnalyzeMode = false, smoothedData = null, onPointClick = null) {
        if (this.chart) this.chart.destroy();

        // Plugins
        const plugins = [];
        if (atValue && onATChange) {
            plugins.push(ChartInteractions.getATLinePlugin(atValue, onATChange));
        }

        const datasets = [];
        
        // Main Dataset (Working RR)
        datasets.push({
            label: isAnalyzeMode ? `${i18n.translate('raw')} (${i18n.translate('editable')})` : i18n.translate('heartRateBPM'), // Translated label
            data: data.map(rr => Math.round(60000/rr)),
            borderColor: isAnalyzeMode ? '#e74c3c' : '#3498db',
            backgroundColor: isAnalyzeMode ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)',
            fill: !isAnalyzeMode,
            tension: isAnalyzeMode ? 0 : 0.2,
            pointRadius: isAnalyzeMode ? 4 : 0,
            pointHoverRadius: isAnalyzeMode ? 6 : 0,
            borderWidth: isAnalyzeMode ? 1 : 1.5,
            borderDash: isAnalyzeMode ? [5, 5] : [],
            order: 2
        });

        // Smoothed Dataset (Only in Analyze Mode)
        if (isAnalyzeMode && smoothedData) {
            datasets.push({
                label: `${i18n.translate('smoothed')} / ${i18n.translate('filtered')}`, // Translated label
                data: smoothedData.map(rr => Math.round(60000/rr)),
                borderColor: '#3498db',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false,
                order: 1
            });
        }

        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => i),
                datasets: datasets
            },
            plugins: plugins,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: isAnalyzeMode ? 'nearest' : 'index',
                    intersect: isAnalyzeMode,
                },
                onClick: (e, elements) => {
                    if (isAnalyzeMode && onPointClick && elements.length > 0) {
                        const index = elements[0].index;
                        const datasetIndex = elements[0].datasetIndex;
                        // Ensure we are clicking the editable dataset (index 0)
                        if (datasetIndex === 0) {
                            onPointClick(e, index);
                        }
                    }
                },
                plugins: {
                    zoom: { // Chart.js zoom plugin doesn't have i18n for its internal labels
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'x',
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(52, 152, 219, 0.3)',
                                borderColor: 'rgba(52, 152, 219, 1)',
                                borderWidth: 1
                            }
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        }
                    }
                },
                scales: { // Use i18n for axis titles
                    x: { title: { display: true, text: i18n.translate('beatCount') } },
                    y: { title: { display: true, text: i18n.translate('heartRateBPM') }, min: 30, max: 220 }
                }
            }
        });
    }

    updateLive(rrValue) {
        if (!this.chart) return;
        
        const label = this.chart.data.labels.length;
        const bpm = Math.round(60000/rrValue);
        
        this.chart.data.labels.push(label);
        // Assuming dataset 0 is the live one
        this.chart.data.datasets[0].data.push(bpm);
        
        // Moving window (e.g., 100 points)
        const WINDOW_SIZE = 100;
        if (this.chart.data.labels.length > WINDOW_SIZE) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }
        
        this.chart.update('none');
    }

    resetZoom() {
        if (this.chart && this.chart.resetZoom) {
            this.chart.resetZoom();
        }
    }

    getVisibleRange() {
        if (!this.chart) return null;
        return { start: this.chart.scales.x.min, end: this.chart.scales.x.max };
    }
}