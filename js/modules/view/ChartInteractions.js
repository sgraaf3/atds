/**
 * MODULE: ChartInteractions
 * Custom Chart.js plugins for interactive analysis tools.
 */
export class ChartInteractions {
    /**
     * Creates a plugin to draw and interact with a horizontal AT Threshold line.
     * @param {number} initialValue - Y-axis value (BPM) for the line
     * @param {Function} onUpdate - Callback when line is moved (newValue) => void
     */
    static getATLinePlugin(initialValue, onUpdate) {
        const pluginState = {
            yValue: initialValue,
            isDragging: false,
            dragThreshold: 10
        };

        return {
            id: 'atLinePlugin',
            afterDraw: (chart) => {
                const { ctx, chartArea: { left, right }, scales: { y } } = chart;
                
                // Convert BPM value to pixel position
                const yPixel = y.getPixelForValue(pluginState.yValue);

                // Don't draw if out of bounds
                if (yPixel < chart.chartArea.top || yPixel > chart.chartArea.bottom) return;

                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = pluginState.isDragging ? 'rgba(231, 76, 60, 1)' : 'rgba(231, 76, 60, 0.7)';
                ctx.lineWidth = pluginState.isDragging ? 3 : 2;
                ctx.setLineDash([6, 4]);
                ctx.moveTo(left, yPixel);
                ctx.lineTo(right, yPixel);
                ctx.stroke();

                // Draw Label
                ctx.fillStyle = 'rgba(231, 76, 60, 1)';
                ctx.font = 'bold 12px Segoe UI';
                ctx.fillText(`AT: ${Math.round(pluginState.yValue)} BPM (Drag to Adjust)`, left + 10, yPixel - 8);
                ctx.restore();
            },
            afterEvent: (chart, args) => {
                const { event } = args;
                const { y } = chart.scales;
                const yValue = y.getValueForPixel(event.y);
                
                // Check hover proximity
                const yPixel = y.getPixelForValue(pluginState.yValue);
                const isNear = Math.abs(event.y - yPixel) < pluginState.dragThreshold;

                if (event.type === 'mousedown' && isNear) {
                    pluginState.isDragging = true;
                    chart.canvas.style.cursor = 'ns-resize';
                } else if (event.type === 'mousemove') {
                    if (pluginState.isDragging) {
                        pluginState.yValue = yValue; // Update line position live
                        chart.canvas.style.cursor = 'ns-resize';
                        args.changed = true; // Re-draw
                    } else {
                        chart.canvas.style.cursor = isNear ? 'ns-resize' : 'default';
                    }
                } else if (event.type === 'mouseup' || event.type === 'mouseout') {
                    if (pluginState.isDragging) {
                        pluginState.isDragging = false;
                        if (onUpdate) onUpdate(pluginState.yValue); // Trigger callback
                        args.changed = true;
                    }
                    chart.canvas.style.cursor = 'default';
                }
            }
        };
    }
}