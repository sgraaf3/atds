/**
 * MODULE: PhysioMetrics
 * Handles advanced physiological estimations and normative comparisons.
 */
export class PhysioMetrics {
    /**
     * Estimates VO2 Max using Max HR and Resting HR.
     * Formula: VO2max = 15.3 * (MHR / RHR)
     * @param {number} age - User age
     * @param {string} gender - 'male' or 'female'
     * @param {number} restingHR - Measured minimum/resting heart rate
     * @returns {number} Estimated VO2 Max (ml/kg/min)
     */
    static calculateVO2Max(age, gender, restingHR) {
        const maxHR = 220 - age;
        if (!restingHR || restingHR <= 0) return null;
        
        let vo2 = 15.3 * (maxHR / restingHR);
        
        // Gender correction: Females typically have lower VO2max for same fitness level
        if (gender === 'female') vo2 *= 0.85;
        
        return Math.round(vo2 * 10) / 10;
    }

    /**
     * Compares VO2 Max against ACSM normative data.
     * @returns {string} Classification (Poor, Fair, Good, Excellent, Superior)
     */
    static evaluateVO2(vo2, age, gender) {
        // Simplified ACSM Norms (ml/kg/min)
        const norms = {
            male: [
                { maxAge: 29, poor: 34, fair: 43, good: 51, excellent: 56 },
                { maxAge: 39, poor: 32, fair: 41, good: 49, excellent: 54 },
                { maxAge: 49, poor: 30, fair: 39, good: 47, excellent: 52 },
                { maxAge: 59, poor: 28, fair: 37, good: 44, excellent: 49 },
                { maxAge: 99, poor: 25, fair: 34, good: 41, excellent: 46 }
            ],
            female: [
                { maxAge: 29, poor: 27, fair: 36, good: 40, excellent: 45 },
                { maxAge: 39, poor: 26, fair: 34, good: 38, excellent: 43 },
                { maxAge: 49, poor: 24, fair: 32, good: 36, excellent: 40 },
                { maxAge: 59, poor: 23, fair: 30, good: 33, excellent: 37 },
                { maxAge: 99, poor: 21, fair: 28, good: 31, excellent: 34 }
            ]
        };

        const table = norms[gender] || norms.male;
        const group = table.find(g => age <= g.maxAge) || table[table.length - 1];

        if (vo2 < group.poor) return "Poor";
        if (vo2 < group.fair) return "Fair";
        if (vo2 < group.good) return "Good";
        if (vo2 < group.excellent) return "Excellent";
        return "Superior";
    }

    /**
     * Evaluates HRV Amplitude (RSA) against age-based norms.
     * @param {number} hrvAmp - HRV Amplitude in ms
     * @param {number} age - User age
     * @returns {string} Classification
     */
    static evaluateHRV(hrvAmp, age) {
        // RSA Amplitude norms (ms) - approximate
        let low, high;
        if (age <= 30) { low = 50; high = 100; }
        else if (age <= 50) { low = 30; high = 60; }
        else { low = 15; high = 35; }

        if (hrvAmp < low) return "Low";
        if (hrvAmp > high) return "High";
        return "Normal";
    }

    /**
     * Evaluates Breath Rate.
     * @param {number} br - Breaths per minute
     * @returns {string} Classification
     */
    static evaluateBreathRate(br) {
        if (br < 10) return "Slow";
        if (br > 20) return "Fast";
        return "Normal";
    }
}