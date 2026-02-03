import { ChartInteractions } from './ChartInteractions.js';

export class ChartManager {
    constructor(canvasId) {
        this.ctx = document.getElementById(canvasId).getContext('2d');
        this.chart = null;
    }

    render(data, atValue, onATChange) {
        if (this.chart) this.chart.destroy();

        // Plugins
        const plugins = [];
        if (atValue && onATChange) {
            plugins.push(ChartInteractions.getATLinePlugin(atValue, onATChange));
        }

        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => i),
                datasets: [{
                    label: 'Heart Rate (BPM)',
                    data: data.map(rr => Math.round(60000/rr)),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 0,
                    borderWidth: 1.5
                }]
            },
            plugins: plugins,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    zoom: {
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Beat Count' } },
                    y: { title: { display: true, text: 'BPM' }, min: 30, max: 220 }
                }
            }
        });
    }

    getVisibleRange() {
        if (!this.chart) return null;
        return { start: this.chart.scales.x.min, end: this.chart.scales.x.max };
    }
}