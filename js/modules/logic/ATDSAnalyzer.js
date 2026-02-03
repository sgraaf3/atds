/**
 * MODULE: ATDSAnalyzer
 * Handles RSA Phase Detection and Breath Analysis.
 */
export class ATDSAnalyzer {
    constructor() {
        this.CONSTANTS = {
            MAX_HRT_PERIOD: 1666, // ~36 BPM
            MIN_RR_INTERVAL: 240, // ~250 BPM
            PHASE_THRESHOLD: 15,  // Hysteresis threshold (ms)
            SMOOTHING_FACTOR: 5
        };
    }

    process(rrData) {
        // 1. Filter
        const cleanRR = rrData.filter(rr => 
            rr >= this.CONSTANTS.MIN_RR_INTERVAL && 
            rr <= this.CONSTANTS.MAX_HRT_PERIOD
        );

        if (cleanRR.length < 10) return null;

        // 2. Smooth
        let smoothedRR = [];
        for(let i=0; i<cleanRR.length; i++) {
            let val = cleanRR[i];
            if(i >= 2 && i < cleanRR.length - 2) {
                val = (cleanRR[i-2] + cleanRR[i-1] + cleanRR[i] + cleanRR[i+1] + cleanRR[i+2]) / 5;
            }
            smoothedRR.push(val);
        }

        // 3. Phase Detection (Inverted HR Logic)
        let bInhale = true;
        let maxInvHrt = 0;
        let minInvHrt = 9999;
        
        let tiSum = 0, teSum = 0;
        let breathCount = 0;
        let hrvAmpSum = 0;
        
        let phaseStartTime = 0;
        let currentTime = 0;

        for(let i=0; i<smoothedRR.length; i++) {
            let rr = smoothedRR[i];
            let invHrt = this.CONSTANTS.MAX_HRT_PERIOD - rr;

            // Track local extrema
            if (invHrt > maxInvHrt) maxInvHrt = invHrt;
            if (invHrt < minInvHrt) minInvHrt = invHrt;

            // Hysteresis Switching
            if (bInhale) {
                // If we drop significantly from peak, switch to Exhale
                if (invHrt < (maxInvHrt - this.CONSTANTS.PHASE_THRESHOLD)) {
                    bInhale = false;
                    tiSum += (currentTime - phaseStartTime);
                    phaseStartTime = currentTime;
                    minInvHrt = invHrt; // Reset valley tracker
                }
            } else {
                // If we rise significantly from valley, switch to Inhale
                if (invHrt > (minInvHrt + this.CONSTANTS.PHASE_THRESHOLD)) {
                    bInhale = true;
                    teSum += (currentTime - phaseStartTime);
                    breathCount++;
                    hrvAmpSum += (maxInvHrt - minInvHrt);
                    phaseStartTime = currentTime;
                    maxInvHrt = invHrt; // Reset peak tracker
                }
            }
            currentTime += rr;
        }

        // 4. Metrics
        const totalRR = cleanRR.reduce((a,b) => a+b, 0);
        const avgHR = 60000 / (totalRR / cleanRR.length);
        const durationMin = totalRR / 60000;

        return {
            avgHR: Math.round(avgHR),
            tiTe: teSum > 0 ? (tiSum / teSum).toFixed(2) : "1.00",
            breathRate: Math.round(breathCount / durationMin) || 0,
            hrvAmp: Math.round(hrvAmpSum / (breathCount || 1)),
            smoothedData: smoothedRR
        };
    }
}