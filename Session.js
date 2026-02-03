/**
 * MODULE: Session
 * Manages the state of the current analysis session (Data, Profile, Settings).
 */
export class Session {
    constructor() {
        this.rawRR = [];          // The immutable original load
        this.workingRR = [];      // The data currently being analyzed (cropped/edited)
        this.profile = {
            age: 30,
            weight: 75,
            gender: 'male',
            sys: 120,
            dia: 80,
            fat: 15
        };
        this.analysis = {
            manualAT: null,       // User override for AT
            autoAT: null          // Calculated AT
        };
    }

    loadData(rrArray) {
        this.rawRR = [...rrArray];
        this.workingRR = [...rrArray];
        this.calculateAutoAT();
    }

    setProfile(profileData) {
        this.profile = { ...this.profile, ...profileData };
        this.calculateAutoAT();
    }

    calculateAutoAT() {
        const maxHR = 220 - this.profile.age;
        this.analysis.autoAT = Math.round(maxHR * 0.85);
    }

    getAT() {
        return this.analysis.manualAT || this.analysis.autoAT;
    }

    setManualAT(value) {
        this.analysis.manualAT = value;
    }

    resetAT() {
        this.analysis.manualAT = null;
        return this.analysis.autoAT;
    }

    cropData(startIndex, endIndex) {
        if (startIndex < 0) startIndex = 0;
        if (endIndex >= this.workingRR.length) endIndex = this.workingRR.length - 1;
        
        if (startIndex < endIndex) {
            this.workingRR = this.workingRR.slice(startIndex, endIndex + 1);
        }
    }

    /**
     * Serializes the current session state for saving to .atds file.
     * @returns {string} JSON string of the session data.
     */
    saveAtds() {
        const data = {
            profile: this.profile,
            analysis: this.analysis,
            rrData: this.workingRR
        };
        return JSON.stringify(data, null, 2);
    }
}