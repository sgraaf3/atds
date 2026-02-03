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
        return {
            id: 'atLinePlugin',
            defaults: {
                yValue: initialValue,
                isDragging: false,
                dragThreshold: 10 // pixels tolerance for grabbing the line
            },
            afterDraw: (chart, args, options) => {
                const { ctx, chartArea: { left, right }, scales: { y } } = chart;
                
                // Convert BPM value to pixel position
                const yPixel = y.getPixelForValue(options.yValue);

                // Don't draw if out of bounds
                if (yPixel < chart.chartArea.top || yPixel > chart.chartArea.bottom) return;

                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = options.isDragging ? 'rgba(231, 76, 60, 1)' : 'rgba(231, 76, 60, 0.7)';
                ctx.lineWidth = options.isDragging ? 3 : 2;
                ctx.setLineDash([6, 4]);
                ctx.moveTo(left, yPixel);
                ctx.lineTo(right, yPixel);
                ctx.stroke();

                // Draw Label
                ctx.fillStyle = 'rgba(231, 76, 60, 1)';
                ctx.font = 'bold 12px Segoe UI';
                ctx.fillText(`AT: ${Math.round(options.yValue)} BPM (Drag to Adjust)`, left + 10, yPixel - 8);
                ctx.restore();
            },
            afterEvent: (chart, args, options) => {
                const { event } = args;
                const { y } = chart.scales;
                const yValue = y.getValueForPixel(event.y);
                
                // Check hover proximity
                const yPixel = y.getPixelForValue(options.yValue);
                const isNear = Math.abs(event.y - yPixel) < options.dragThreshold;

                if (event.type === 'mousedown' && isNear) {
                    options.isDragging = true;
                    chart.canvas.style.cursor = 'ns-resize';
                } else if (event.type === 'mousemove') {
                    if (options.isDragging) {
                        options.yValue = yValue; // Update line position live
                        chart.canvas.style.cursor = 'ns-resize';
                        chart.draw(); // Re-draw immediately
                    } else {
                        chart.canvas.style.cursor = isNear ? 'ns-resize' : 'default';
                    }
                } else if (event.type === 'mouseup' || event.type === 'mouseout') {
                    if (options.isDragging) {
                        options.isDragging = false;
                        if (onUpdate) onUpdate(options.yValue); // Trigger callback
                    }
                    chart.canvas.style.cursor = 'default';
                }
            }
        };
    }
}