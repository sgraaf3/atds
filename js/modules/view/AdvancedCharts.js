/**
 * MODULE: AdvancedCharts
 * Handles Poincaré Plots and Histograms.
 */
export class AdvancedCharts {
    static renderPoincare(canvasId, rrData) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const points = [];
        for (let i = 0; i < rrData.length - 1; i++) {
            points.push({ x: rrData[i], y: rrData[i+1] });
        }

        return new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Poincaré (RR_n vs RR_n+1)',
                    data: points,
                    backgroundColor: 'rgba(52, 152, 219, 0.5)',
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'RR[n] (ms)' } },
                    y: { title: { display: true, text: 'RR[n+1] (ms)' } }
                }
            }
        });
    }

    static renderHistogram(canvasId, rrData) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const binSize = 50;
        const bins = {};
        let min = Infinity, max = -Infinity;

        rrData.forEach(rr => {
            if (rr < min) min = rr;
            if (rr > max) max = rr;
            const bin = Math.floor(rr / binSize) * binSize;
            bins[bin] = (bins[bin] || 0) + 1;
        });

        const labels = [];
        const data = [];
        const start = Math.floor(min / binSize) * binSize;
        const end = Math.ceil(max / binSize) * binSize;

        for (let b = start; b <= end; b += binSize) {
            labels.push(b);
            data.push(bins[b] || 0);
        }

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequency',
                    data: data,
                    backgroundColor: '#2c3e50'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}