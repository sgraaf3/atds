/* eslint-disable */
export class Calculate {
  TRAINING_REST = 2
  TRAINING_EXERCISE = 3
  TRAINING_AT_TEST_RUN = 4
  TRAINING_AT_TEST_BICYCLE = 5
  TRAINING_TYPE_CHRON_VERM = 6
  TRAINING_TYPE_AT_TRAINING = 7
  TRAINING_REST_FREE = 8
  TRAINING_INSPANNING = 9

  TRAINING_SPORT_NONE = 0
  TRAINING_SPORT_CYCLING = 1
  TRAINING_SPORT_ROWING = 2
  TRAINING_SPORT_JOGGING = 3
  TRAINING_SPORT_SKATING = 4
  TRAINING_SPORT_STEPS = 5
  TRAINING_SPORT_WALKING = 6

  TRAINING_AT_TYPE_DAY = 0
  TRAINING_AT_TYPE_INPUT_CLEAR = 1
  TRAINING_AT_TYPE_INPUT_REST = 2

  // HRV typical (rest) value, averaged with first measured delta to get initial amplitude
  HB_BS_TYP_AMPL = 35 // start value for amplitude

  // definitions for the breath-signal and HRV state derivation
  HB_MAX_HRT_PERIOD = 1666 // equals 36 beats/min
  HB_TYP_HRT_PERIOD = 800 // equals 75 beats/min
  HB_MIN_HRT_PERIOD = 240 // equals 210 beats/min

  // Amplitude calculation, minimum threshold, 8 sec timeout en averaging count
  INVHRT_THRESH_RATIO = 8 // ratio amplitude / std threshold
  INVHRT_MINIMUM_THRESH = 1 // in rel to HRT (ampl about 100)
  INVHRT_THRESH_TIMEOUT = 8000 // derived breath signal timeout, msec

  HRV_VALUE_LIMIT = 99 // MAX variance change in one step
  HRV_END_MAX = 10 // HRV end MAX range
  HRV_BEGIN_MAX = 70 // HRV begin MAX range
  HRV_BEGIN_HIGH = 40 // HRV begin HIGH range
  HRV_BEGIN_MEDIUM = 10 // HRV begin medium range
  HRV_BEGIN_LOW = 5 // HRV begin low range

  // (Aerobic-Threshold, AT) Constants for calculation / scaling of the derived respiration
  HB_BS_AMPLIF = 2 // iAdem Amplification
  HB_BS_BREATH_MULTIPLIER = 1.0 // BREATH_MULTIPLIER
  HB_BS_MEDIAN = 500 // centre of iAdem graph
  HB_BS_DELTA_SMALL = 20 // offset corr when in view
  HB_BS_DELTA_LARGE = 4 // offset corr when out of view
  HB_BS_DELTA_MIN = 10

  // Default HF threshold multiplication factors, times 100
  // Variables can be modified from a PC using the Sync protocol
  HF_BEGIN_MEDIUM = 112 // 1.12 * calculated threshold
  HF_BEGIN_HIGH = 125 // 1.25 * calculated threshold
  HF_BEGIN_CRITICAL = 140 // 1.40 * calculated threshold

  // Default filter factors, can be customized using PC sync
  iMowAverageSize = 8

  FILTERD_MAX_COUNT = 5
  // Define minimum HRT below which first AT can be reached, and second
  // calculated
  // Corresponds to HF of about 99 beats/min for 1st AT, and 124 for 2nd AT
  // (anearobic)
  // This avoids false 'lock-in' into endurance training states at too low HF
  // The threshold is still below the values specified for a 70-year old (1st
  // at 105)
  HB_AT1_MAX_HRT_PERIOD = 606

  HRVHF_UNKNOWN = 0 // Neutral, no value known or not implemented (yet)
  HRV_MAX = 1 // HRV >     70   maximum    (cyan,   Relax)
  HRV_HIGH = 2 // HRV 40 .. 69   high       (purple, Rest)
  HRV_MEDIUM = 3 // HRV 10 .. 39   medium     (white,  Active)
  HRV_LOW = 4 // HRV  5 .. 9    low        (yellow, Warm-up Cool-down)

  // HRV < 5,  HF Aerobic Threshold equals 1.00 * HF
  HF_LOW = 5 // HF  > 0.97 * Aerobic Thr. (green,  Endurance 1)
  HF_MEDIUM = 6 // HF  > 1.12 * Aerobic Thr. (blue,   Endurance 2)
  HF_HIGH = 7 // HF  > 1.25 * Aerobic Thr. (orange, Endurance 3)
  HF_INTENS = 8 // HF  > 1.40 * Aerobic Thr. (red,    Intensive)
  HF_INTENS2 = 9 // HF  > 1.40 * AT + 10      (red,    Intense-2)

  // Exposed to be used by BlueRobin.c display function
  HRVHF_NONE = this.HRVHF_UNKNOWN
  HRV_RELAX = this.HRV_MAX
  HRV_REST = this.HRV_HIGH
  HRV_ACTIVE = this.HRV_MEDIUM
  HRV_WUPCDN = this.HRV_LOW

  // HRV < 5, HF Aerobic Threshold equals 1.00 * HF
  HF_END1 = this.HF_LOW
  HF_END2 = this.HF_MEDIUM
  HF_END3 = this.HF_HIGH
  HF_INTENSE = this.HF_INTENS
  HF_INTENSE2 = this.HF_INTENS2

  // Breath Band Filter for Bioharness variable
  LP_FILTER_SIZE = 3

  FILTER_REST_AMP_DIFF = 200
  FILTER_REST_AMP_SAMPLES = 6

  FILTER_EX_AMP_DIFF = 5
  FILTER_EX_AMP_SAMPLES = 6

  uiPrevHrt = 0

  // Variable At from in put
  bUseAtFromInput = false
  iAtFromInput = 0
  sATDSData
  sTiTeData
  sHFState
  sAtdsFilter
  sAtdsBreath
  iAdem = 0

  constructor() {
      this.sATDSData = new ATDSData()
      this.sTiTeData = new TiTeData()
      this.sHFState = new HFState()
      this.sAtdsFilter = new AtdsFilter()
      this.sAtdsBreath = new ATDSBreath()
      this.atdsResetCalc()

      this.sTiTeData.dHrvBeginMax = this.HRV_BEGIN_MAX
      this.sTiTeData.dHrvBeginHigh = this.HRV_BEGIN_HIGH
      this.sTiTeData.dHrvBeginMedium = this.HRV_BEGIN_MEDIUM
      this.sTiTeData.dHrvBeginLow = this.HRV_BEGIN_LOW

      // TDEC level thresholds for HeartFreq, can be synced
      this.sTiTeData.dHfBeginMedium = this.HF_BEGIN_MEDIUM
      this.sTiTeData.dHfBeginHigh = this.HF_BEGIN_HIGH
      this.sTiTeData.dHfBeginCritical = this.HF_BEGIN_CRITICAL

      this.sTiTeData.mTiTime = new MovAverage(this.iMowAverageSize)
      this.sTiTeData.mTeTime = new MovAverage(this.iMowAverageSize)
      this.sATDSData.mHrtAverage = new MovAverage(25)

      this.sAtdsBreath.mAveragePeriode = new MovAverage(8)
      this.sAtdsBreath.ulPeriodeMaxTime = 0
      this.sAtdsBreath.ulPeriodeMinTime = 0

      this.sATDSData.iTrainingSport = this.TRAINING_SPORT_NONE

      this.sAtdsFilter.uiFilterType = this.TRAINING_REST
      this.sAtdsFilter.uiAmpSamples = 10

      this.sAtdsFilter.uiExMaxRR = 2000
      this.sAtdsFilter.uiExMinRR = 240
      this.sAtdsFilter.uiReMaxRR = 3000
      this.sAtdsFilter.uiReMinRR = 100

      this.sAtdsFilter.uiExAmpDiff = this.FILTER_EX_AMP_DIFF
      this.sAtdsFilter.uiExAmpSamples = this.FILTER_EX_AMP_SAMPLES

      this.sAtdsFilter.uiReAmpDiff = this.FILTER_REST_AMP_DIFF
      this.sAtdsFilter.uiReAmpSamples = this.FILTER_REST_AMP_SAMPLES

      this.sTiTeData.dBreathMultiplier = this.HB_BS_BREATH_MULTIPLIER
  }

  calculateHrvAmplitude(heartRate) {
      if (this.sTiTeData.iMinInvHrtValueLow != 0)
          this.sTiTeData.iMinInvHrtValueLow += 10 // iMaxInvHrtValueLow
      if (this.sTiTeData.iMaxInvHrtValueLow != 0)
          this.sTiTeData.iMaxInvHrtValueLow -= 10 // iMinInvHrtValue
      this.sATDSData.iHbTimeBase += this.sATDSData.usHRTInput
      let usNewBF
      let usDelta
      let usThisInvHrt
      let bCalcAdemTop = false
      let bCalcAdemBottom = false
      // System.out.println("ATDS usThisHrt: "+ usThisHrt);
      // Update our realtime timebase with this HRT value
      this.sTiTeData.ulHbTimeBase += heartRate
      usThisInvHrt = (this.HB_MAX_HRT_PERIOD - heartRate)

      if (this.sATDSData.dHrvAmplitude == 0) { // Check Filter
          this.sATDSData.dHrvAmplitude = this.HB_BS_TYP_AMPL * 2

      }

      // Process one RR-vale (heartbeat interval) derived from Co2ntrol
      // embedded software algorithm
      if (this.sTiTeData.bBreathInhalePhase) { // inhalation phase
          if (usThisInvHrt > this.sTiTeData.usMaxInvHrtValue) { // new maximum
              this.sTiTeData.usMaxInvHrtValue = usThisInvHrt
              this.sTiTeData.ulMaxInvHrtTime = this.sTiTeData.ulHbTimeBase
          } else if ((usThisInvHrt < (this.sTiTeData.usMaxInvHrtValue - this.sTiTeData.usInvHrtThresh)) && (this.sTiTeData.usMaxInvHrtValue > this.sTiTeData.iMaxInvHrtValueLow)) {
              this.sTiTeData.iMaxInvHrtValueLow = this.sTiTeData.usMaxInvHrtValue

              this.sTiTeData.ulTiTime = this.sTiTeData.ulMaxInvHrtTime - this.sTiTeData.ulMinInvHrtTime
              this.sTiTeData.mTiTime.movAvg(this.sTiTeData.ulTiTime)
              this.sTiTeData.dTiTime = this.sTiTeData.mTiTime.dAverage / 1000.0

              // Calculate Breath feq mac time
              this.sAtdsBreath.ulPeriodeMaxTime = this.sTiTeData.ulMaxInvHrtTime - this.sTiTeData.ulMinInvHrtTime
              // Calculate Breath signal
              this.sTiTeData.ulBreathTime = this.sTiTeData.ulMaxInvHrtTime - this.sTiTeData.ulMinInvHrtTime

              this.sTiTeData.bBreathInhalePhase = false // exhalation start phase
              this.sTiTeData.usMinInvHrtValue = usThisInvHrt
              this.sTiTeData.ulMinInvHrtTime = this.sTiTeData.ulHbTimeBase
              this.calcIadem(usThisInvHrt)
              bCalcAdemTop = true
          } else if ((this.sTiTeData.ulHbTimeBase - this.sTiTeData.ulMaxInvHrtTime) > this.INVHRT_THRESH_TIMEOUT) {
              // System.out.println("Too long period since last maximum");
              // Too long period since last maximum, reset threshold
              this.sTiTeData.ulMaxInvHrtTime = this.sTiTeData.ulHbTimeBase // reset timeout condition
              this.sTiTeData.ulMinInvHrtTime = this.sTiTeData.ulHbTimeBase // reset timeout condition
              this.sTiTeData.usInvHrtThresh = this.INVHRT_MINIMUM_THRESH // Reset threshold to minimum

              if (this.sATDSData.dHrvAmplitude > this.sTiTeData.dHrvBeginLow) {
                  // Slowly yield down to just above the Amplitude threshold
                  this.sATDSData.dHrvAmplitude = ((this.sATDSData.dHrvAmplitude - this.HRV_BEGIN_LOW) * 0.707) + this.HRV_BEGIN_LOW
                  this.sAtdsFilter.dFilterAmpAverage = ((this.sAtdsFilter.dFilterAmpAverage - this.HRV_BEGIN_LOW) * 0.707) + this.HRV_BEGIN_LOW
              }

              // Adjust last seen max/min value to close to the current value
              // to avoid seeing a large (artificial) peak after the reset
              // Last min/max most likely came from a noise peak ...
              this.sTiTeData.usMinInvHrtValue = usThisInvHrt - (2 * this.INVHRT_MINIMUM_THRESH)
              this.sTiTeData.usMaxInvHrtValue = usThisInvHrt + (2 * this.INVHRT_MINIMUM_THRESH)
          }
      } else { // exhalation phase
          if (usThisInvHrt < this.sTiTeData.usMinInvHrtValue) { // new minimum
              this.sTiTeData.usMinInvHrtValue = usThisInvHrt
              this.sTiTeData.ulMinInvHrtTime = this.sTiTeData.ulHbTimeBase
          } else if ((usThisInvHrt >= (this.sTiTeData.usMinInvHrtValue + this.sTiTeData.usInvHrtThresh)) && (this.sTiTeData.usMinInvHrtValue < this.sTiTeData.iMinInvHrtValueLow)) {
              this.sTiTeData.iMinInvHrtValueLow = this.sTiTeData.usMinInvHrtValue

              this.sTiTeData.ulTeTime = this.sTiTeData.ulMinInvHrtTime - this.sTiTeData.ulMaxInvHrtTime
              this.sTiTeData.mTeTime.movAvg(this.sTiTeData.ulTeTime)
              this.sTiTeData.dTeTime = this.sTiTeData.mTeTime.dAverage / 1000
              this.sTiTeData.dTiTeTime = this.sTiTeData.dTiTime / this.sTiTeData.dTeTime

              this.sTiTeData.ulBreathTime += (this.sTiTeData.ulMinInvHrtTime - this.sTiTeData.ulMaxInvHrtTime)
              if (this.sTiTeData.ulBreathTime != 0) {
                  usNewBF = (60000 / (this.sTiTeData.ulBreathTime))
              } else {
                  usNewBF = this.sATDSData.usBreathFreq
              }
              this.sATDSData.usBreathFreq = ((this.sATDSData.usBreathFreq * 7) + usNewBF) / 8

              // Calc BreathFrey from periode time. Filter 1 / 8
              this.sAtdsBreath.ulPeriodeMinTime = this.sTiTeData.ulMinInvHrtTime - this.sTiTeData.ulMaxInvHrtTime
              // this.sATDSData.usBreathFreq = this.calcBreathAvrageFilter()
              if (this.sATDSData.usBreathFreq < 5) { // Check min Breath freq/
                  this.sATDSData.usBreathFreq = 5
              }

              // Determine new threshold as an average for current and amplitude ratio
              this.sTiTeData.usInvHrtThresh = (this.sTiTeData.usInvHrtThresh + ((this.sTiTeData.usMaxInvHrtValue - this.sTiTeData.usMinInvHrtValue) / this.INVHRT_THRESH_RATIO)) / 2
              if (this.sTiTeData.usInvHrtThresh <= this.INVHRT_MINIMUM_THRESH) {
                  this.sTiTeData.usInvHrtThresh = this.INVHRT_MINIMUM_THRESH
              }

              usDelta = this.sTiTeData.usMaxInvHrtValue - this.sTiTeData.usMinInvHrtValue // new value
              if (usDelta < (this.HB_MAX_HRT_PERIOD / 2)) { // sanity check ...
                  if (usDelta > this.HRV_VALUE_LIMIT) {
                      usDelta = this.HRV_VALUE_LIMIT // limit variance in graph
                  }
                  if (this.sATDSData.dHrvAmplitude == 0) {
                      // First amplitude known, average with 'typical' rest amplitude
                      this.sATDSData.dHrvAmplitude = (this.HB_BS_TYP_AMPL + usDelta) / 2
                      this.sAtdsFilter.dFilterAmpAverage = (this.HB_BS_TYP_AMPL + usDelta) / 2
                  } else {
                      // New HRV amplitude, weighted average; new weight 1/4
                      this.sATDSData.dHrvAmplitude = ((3 * this.sATDSData.dHrvAmplitude) + usDelta) / 4
                      this.sAtdsFilter.dFilterAmpAverage = ((this.sAtdsFilter.uiAmpSamples * this.sAtdsFilter.dFilterAmpAverage) + usDelta) / (this.sAtdsFilter.uiAmpSamples + 1)
                  }
              }

              this.sTiTeData.bBreathInhalePhase = true // initial phase inhalation
              this.sTiTeData.usMaxInvHrtValue = usThisInvHrt
              this.sTiTeData.ulMaxInvHrtTime = this.sTiTeData.ulHbTimeBase
              this.calcIadem(usThisInvHrt)
              bCalcAdemBottom = true
          } else if ((this.sTiTeData.ulHbTimeBase - this.sTiTeData.ulMinInvHrtTime) > this.INVHRT_THRESH_TIMEOUT) {
              // Too long period since last minium, reset threshold
              this.sTiTeData.ulMaxInvHrtTime = this.sTiTeData.ulHbTimeBase // reset timeout condition
              this.sTiTeData.ulMinInvHrtTime = this.sTiTeData.ulHbTimeBase // reset timeout condition
              this.sTiTeData.usInvHrtThresh = this.INVHRT_MINIMUM_THRESH // Reset threshold to minimum

              this.sATDSData.dHrvAmplitude *= 0.8
              this.sAtdsFilter.dFilterAmpAverage *= 0.8
              // Adjust last seen max/min value to close to the current value
              // to avoid seeing a large (artificial) peak after the reset
              // Last min/max most likely came from a noise peak ...
              this.sTiTeData.usMinInvHrtValue = usThisInvHrt - (2 * this.INVHRT_MINIMUM_THRESH)
              this.sTiTeData.usMaxInvHrtValue = usThisInvHrt + (2 * this.INVHRT_MINIMUM_THRESH)
          }
      }

      let iNewAdem = (usThisInvHrt - this.sTiTeData.iInvHrtOffset) * this.HB_BS_AMPLIF
      this.sATDSData.iAdem = (iNewAdem * this.sTiTeData.dBreathMultiplier)

      // Log.d(LOG_TAG, "HRT: " + usThisInvHrt + " Adem: " + sATDSData.iAdem + " Multi: " + sTiTeData.dBreathMultiplier + " Offset: " + sTiTeData.iInvHrtOffset + " T " + bCalcAdemTop +" B " + bCalcAdemBottom);
      if ((this.sATDSData.iAdem > 500) || (this.sATDSData.iAdem < -500)) {
          this.sTiTeData.dBreathMultiplier -= 0.1
      }

      if (((bCalcAdemTop) && (this.sATDSData.iAdem > 0) && (this.sATDSData.iAdem < 400)) || ((bCalcAdemBottom) && (this.sATDSData.iAdem < 0) && (this.sATDSData.iAdem > -400))) {
          this.sTiTeData.dBreathMultiplier += 0.1
      }

      this.sATDSData.iAdem = ((usThisInvHrt - this.sTiTeData.iInvHrtOffset) * this.HB_BS_AMPLIF * this.sTiTeData.dBreathMultiplier)

      // Log.d(LOG_TAG, "HRT: " + usThisInvHrt + " Adem: " + sATDSData.iAdem + " Multi: " + sTiTeData.dBreathMultiplier + " Offset: " + sTiTeData.iInvHrtOffset);

      this.sATDSData.iAdem += this.HB_BS_MEDIAN
      // Breathe limited to 0..999 or chart range
      this.sATDSData.iAdem = (this.sATDSData.iAdem > 999) ? 999 : (this.sATDSData.iAdem < 0) ? 0 : this.sATDSData.iAdem
      return this.sATDSData.iAdem
  }

  calcBreathAvrageFilter() {
      let ulPeriodeTime = this.sAtdsBreath.ulPeriodeMaxTime + this.sAtdsBreath.ulPeriodeMinTime // change 2018-03-14 wim before this make nagative value
      this.sAtdsBreath.mAveragePeriode.movAvg(ulPeriodeTime)

      const dPeriodeTime = this.sAtdsBreath.mAveragePeriode.dAverage
      return Math.round(60000.0 / dPeriodeTime)
  }

  Atds_ProcessHeartBeat(usHeartRate) {
      this.sATDSData.usHRTInput = this.atds_FilterSpike(usHeartRate);


      if (this.sATDSData.usHRTInput != 0) {
          this.sATDSData.usHRTFiltered = this.atds_FilterHrt(this.sATDSData.usHRTInput);
          this.sATDSData.iHbTimeBase += this.sATDSData.usHRTInput;

          // Calculate breathing frequency and HRT variation
          this.calculateHrvAmplitude(this.sATDSData.usHRTFiltered);
          // this.calculateHrvAmplitude(usHeartRate);

          // With the amplitude and BF, set the state

          this.atds_AvgHrt(this.sATDSData.usHRTInput);
          if (this.bUseAtFromInput)
              this.determineHRvHFStateFromInput(Math.round(this.sATDSData.dHrtAverage));
          else
              this.determineHRvHFState(Math.round(this.sATDSData.dHrtAverage));

          //            CalculateTrainingAverage();
      }
      return this.sATDSData.usHRTInput;
  }

  atds_FilterSpike(usHeartb) {
      let uiFilteredHRT = usHeartb;

      if (this.sAtdsFilter.uiPrefHRTSpike == 0) {
          this.sAtdsFilter.uiPrefHRTSpike = usHeartb;
          //			sAtdsFilter.uiFilterSpikeCount = 0;
      }
      if (this.sAtdsFilter.uiFilterSpikeCount >= this.FILTERD_MAX_COUNT) {
          this.sAtdsFilter.uiFilterSpikeCount = 0;
          this.sAtdsFilter.uiPrefHRTSpike = usHeartb;
          uiFilteredHRT = 0;
      } else // Filter Exersice
      {
          if ((usHeartb < this.HB_MIN_HRT_PERIOD) ||
              (usHeartb > this.HB_MAX_HRT_PERIOD) ||
              (usHeartb > (2 * this.sAtdsFilter.uiPrefHRTSpike))) {
              uiFilteredHRT = 0;
              this.sAtdsFilter.uiFilterSpikeCount++;
          } else {
              this.sAtdsFilter.uiPrefHRTSpike = ((this.sAtdsFilter.uiPrefHRTSpike * 2) + uiFilteredHRT) / 3;
              this.sAtdsFilter.uiFilterSpikeCount = 0;
          }
      }
      if ((uiFilteredHRT < this.HB_MIN_HRT_PERIOD) || // Min en max filter
          (uiFilteredHRT > this.HB_MAX_HRT_PERIOD)) {
          uiFilteredHRT = 0;
      }
      //System.out.println("Filter usThisHrt out: "+ uiFilteredHRT);
      return uiFilteredHRT;
  }

  atds_ProcessHeartBeat(usHeartRate) {
      this.sATDSData.usHRTInput = this.atds_FilterSpike(usHeartRate);


      if (this.sATDSData.usHRTInput != 0) {
          this.sATDSData.usHRTFiltered = this.atds_FilterHrt(this.sATDSData.usHRTInput);
          this.sATDSData.iHbTimeBase += this.sATDSData.usHRTInput;

          // Calculate breathing frequency and HRT variation
          this.calculateHRvAmplitude(this.sATDSData.usHRTFiltered);

          // With the amplitude and BF, set the state

          this.atds_AvgHrt(this.sATDSData.usHRTInput);
          if (this.bUseAtFromInput)
              this.determineHRvHFStateFromInput(Math.round(this.sATDSData.dHrtAverage));
          else
              this.determineHRvHFState(Math.round(this.sATDSData.dHrtAverage));

          //            CalculateTrainingAverage();
      }
      return this.sATDSData.usHRTInput;
  }

  atds_FilterHrt(usHeartb) {
      let uiFilteredHRT = 0;
      //System.out.println("Filter usThisHrt in: "+ usHeartb);
      if (this.sAtdsFilter.uiFilterCount >= this.FILTERD_MAX_COUNT) {
          this.sAtdsFilter.dFilterAmpAverage = this.HB_BS_TYP_AMPL * 2;
          this.sAtdsFilter.uiFilterCount = 0;
          this.sAtdsFilter.iFilterHrtAverage = ((this.sAtdsFilter.iFilterHrtAverage * 4) + usHeartb) / 5;

          if (this.sAtdsFilter.iFilterHrtAverage > this.HB_MAX_HRT_PERIOD)
              this.sAtdsFilter.iFilterHrtAverage = usHeartb;
          this.sTiTeData.bBreathInhalePhase = true;
      }

      if ((this.uiPrevHrt == 0) || (this.sAtdsFilter.dFilterAmpAverage == 0)) {
          uiFilteredHRT = usHeartb;
          this.uiPrevHrt = usHeartb;
          this.sAtdsFilter.iFilterHrtAverage = usHeartb;
          this.sAtdsFilter.dFilterAmpAverage = this.HB_BS_TYP_AMPL * 2;
      } else if ((this.sAtdsFilter.uiFilterType == this.TRAINING_REST) || (this.sAtdsFilter.uiFilterType == this.TRAINING_REST_FREE)) // Filter Rest
      {
          this.sAtdsFilter.uiAmpSamples = this.sAtdsFilter.uiReAmpSamples;
          if ((usHeartb > (this.sAtdsFilter.iFilterHrtAverage + ((this.sAtdsFilter.dFilterAmpAverage / 2) + this.sAtdsFilter.uiReAmpDiff))) ||
              (usHeartb < (this.sAtdsFilter.iFilterHrtAverage - ((this.sAtdsFilter.dFilterAmpAverage / 2) + this.sAtdsFilter.uiReAmpDiff)))) {
              uiFilteredHRT = this.uiPrevHrt;
              this.sAtdsFilter.uiFilterCount++;
          } else {
              uiFilteredHRT = usHeartb;
              this.uiPrevHrt = usHeartb;
              this.sAtdsFilter.uiFilterCount = 0;
              this.sAtdsFilter.iFilterHrtAverage = ((this.sAtdsFilter.iFilterHrtAverage * 9) + usHeartb) / 10;
          }
      } else {
          this.sAtdsFilter.uiAmpSamples = this.sAtdsFilter.uiExAmpSamples;

          if ((usHeartb > (this.sAtdsFilter.iFilterHrtAverage + ((this.sAtdsFilter.dFilterAmpAverage / 3) + this.sAtdsFilter.uiExAmpDiff))) ||
              (usHeartb < (this.sAtdsFilter.iFilterHrtAverage - ((this.sAtdsFilter.dFilterAmpAverage / 3) + this.sAtdsFilter.uiExAmpDiff)))) {
              uiFilteredHRT = this.uiPrevHrt;
              this.sAtdsFilter.uiFilterCount++;
          } else {
              uiFilteredHRT = usHeartb;
              this.uiPrevHrt = usHeartb;
              this.sAtdsFilter.uiFilterCount = 0;
              this.sAtdsFilter.iFilterHrtAverage = ((this.sAtdsFilter.iFilterHrtAverage * 9) + usHeartb) / 10;
          }
      }
      //System.out.println("Filter usThisHrt out: "+ uiFilteredHRT);
      return uiFilteredHRT;
  }

  // ---------------------------------------------------------------------------
  // Class: AtdsCalc
  // Function: Atds_AvgHrt (unsigned int HeartRateTime)
  //
  // Description: Average the filtered HRT input
  // ---------------------------------------------------------------------------
  atds_AvgHrt(usHrtFilt) {
      // When no average is determined, set to initial received value
      if (usHrtFilt != 0) {
          this.sATDSData.mHrtAverage.movAvg(usHrtFilt);
          if (this.sATDSData.dHFAverage == 0) {
              this.sATDSData.dHrtAverage = this.HB_MAX_HRT_PERIOD;
              if ((usHrtFilt >= this.HB_MIN_HRT_PERIOD) && (usHrtFilt <= this.HB_MAX_HRT_PERIOD))
                  this.sATDSData.dHrtAverage = usHrtFilt;
              this.sATDSData.dHFAverage = 60000.0 / this.sATDSData.dHrtAverage;
          } else {
              // Weighted average, new sample has weight 1/25
              this.sATDSData.dHrtAverage = ((this.sATDSData.dHrtAverage * 24.0) + usHrtFilt) / 25.0;
              this.sATDSData.dHFAverage = 60000.0 / this.sATDSData.dHrtAverage;
          }
          //			Log.d(LOG_TAG, "Atds In " + usHrtFilt + " " + 60000 / usHrtFilt + " Hf " + Math.round(sATDSData.dHFAverage) + " mov: " + Math.round(60000.0 / sATDSData.mHrtAverage.dAverage) + " RR " + Math.round(sATDSData.mHrtAverage.dAverage));
      }
  }

  determineHRvHFState(usNewHRT) {
      let usAt

      // unsigned int usHeartFreq; // Heart Frequency corresponding to
      // averaged HRT
      // u32 ulHRTx100; // HRTfromHF value, times one-hundred

      /*
       * if (iHrtFromHF == 0) { // Get initial HF from current strap HR
       * (somewhat averaged) sUniAtds.uHeartRate = sBlueRobin.heartrate;
       * iHeartFreq = sUniAtds.uHeartRate; iHrtFromHF = (60000 / iHeartFreq);
       * } else { // Calculate new average HRT and HF value, weight new is
       * 1/25 iHrtFromHF = ((iHrtFromHF * 24) + iNewHRT) / 25;
       *
       * iHeartFreq = (60000 / iHrtFromHF); // Corresponding HF value
       * sUniAtds.uHeartRate = (u8) iHeartFreq; }
       */

      // Only run state machine when Amplitude is calculated
      if (this.sATDSData.dHrvAmplitude == 0) {
          return; // No state changes until first amplitude known
      }

      // console.log('check state', this.sATDSData.ucState)
      // HRV/HF training state machine, determine color to be shown
      switch (this.sATDSData.ucState) {
          case this.HRV_RELAX:
              this.sATDSData.iStateProgress = 0;
              if (this.sATDSData.dHrvAmplitude < this.HRV_BEGIN_MAX) {
                  // HRT value for Tmax
                  this.sHFState.usHrtHrvMax = usNewHRT;
                  this.sATDSData.ucState = this.HRV_REST;
              }
              break;

          case this.HRV_REST:
              this.sATDSData.iStateProgress = 0;
              if (this.sATDSData.dHrvAmplitude > this.HRV_BEGIN_MAX) {
                  if (usNewHRT > this.sHFState.usHrtHrvMax) // HF below 'barrier' value
                  {
                      this.sATDSData.ucState = this.HRV_RELAX;
                  } else {
                      // HF still above barrier, no state change allowed yet,
                      // but reduce barrier by lowering the HRT limit value
                      this.sHFState.usHrtHrvMax -= 2;
                  }
              } else {
                  if (this.sATDSData.dHrvAmplitude < this.HRV_BEGIN_HIGH) {
                      // Set 1st HRT value for Thigh
                      this.sHFState.usHrtHrvHigh = usNewHRT;
                      this.sATDSData.ucState = this.HRV_ACTIVE;
                  }
              }
              break;

          default: // From UNKNOWN, go to medium
              this.sATDSData.ucState = this.HRV_ACTIVE;

          case this.HRV_ACTIVE:
              this.sATDSData.iStateProgress = 0;
              if (this.sATDSData.dHrvAmplitude > this.HRV_BEGIN_HIGH) {
                  if (usNewHRT > this.sHFState.usHrtHrvHigh) // HF below 'barrier'
                  // value
                  {
                      this.sATDSData.ucState = this.HRV_REST;
                  } else {
                      // HF still above barrier, no state change allowed yet,
                      // but reduce barrier by lowering the HRT limit value
                      this.sHFState.usHrtHrvHigh -= 2;
                  }
              } else {
                  if (this.sATDSData.dHrvAmplitude < this.HRV_BEGIN_MEDIUM) {
                      // HRT value for Tmed
                      this.sHFState.usHrtHrvMed = usNewHRT;
                      this.sATDSData.ucState = this.HRV_WUPCDN;
                  }
              }
              break;

          case this.HRV_WUPCDN:
              this.sATDSData.iStateProgress = 0;
              if (this.sATDSData.dHrvAmplitude > this.HRV_BEGIN_MEDIUM) {
                  if (usNewHRT > this.sHFState.usHrtHrvMed) // HF below 'barrier' value
                  {
                      this.sATDSData.ucState = this.HRV_ACTIVE;
                  } else {
                      // HF still above barrier, no state change allowed yet,
                      // but reduce barrier by lowering the HRT limit value
                      this.sHFState.usHrtHrvMed -= 2;
                  }
              } else {
                  // Low amplitude AND a low enough HRT (HF high enough, sanity
                  // check)
                  if ((this.sATDSData.dHrvAmplitude < this.HRV_BEGIN_LOW) &&
                      (usNewHRT < this.HB_AT1_MAX_HRT_PERIOD)) {
                      // new aerobic-transition found, AT is 1.40 * HF at this
                      // point, rounded down
                      usAt = (this.sATDSData.dHFAverage * 1.4);

                      if (this.sATDSData.usAt == 0) // Only assign once after reset
                      {
                          this.sATDSData.usAt = usAt;
                          let dHfCalc = this.sATDSData.dHFAverage;
                          if (this.sATDSData.iTrainingSport == this.TRAINING_SPORT_JOGGING) {
                              this.sATDSData.usAt += 10;
                              dHfCalc += 10;
                          } else if (this.sATDSData.iTrainingSport == this.TRAINING_SPORT_STEPS) {
                              this.sATDSData.usAt += 5;
                              dHfCalc += 5;
                          }

                          // Adjust iHrtHrv... thresholds upwards here, so the Cool-down, Rest
                          // and Relax states are reached at a slightly higher HF after training
                          this.sHFState.usHrtHrvMax = ((2 * this.sHFState.usHrtHrvMax) + this.sHFState.usHrtHrvMed) / 3; // 1/3 towards End1
                          this.sHFState.usHrtHrvHigh = ((2 * this.sHFState.usHrtHrvHigh) + this.sATDSData.dHrtAverage) / 3; // 1/3 towards AT
                          this.sHFState.usHrtHrvMed = ((2 * this.sHFState.usHrtHrvMed) + this.sATDSData.dHrtAverage) / 3; // 1/3 towards AT
                          // JdP: Typecast!!???!?!?
                          // sATDSData.iTrainingSport = TRAINING_SPORT_NONE;

                          this.sHFState.usHrtHfEnd1 = Math.round(60000.0 / (dHfCalc * 0.97)); // 3% hysteresis 	// end 1 was 	0.97
                          this.sHFState.usHrtHfEnd2 = Math.round(60000.0 / (dHfCalc * 1.10)); // end 2		1.12
                          this.sHFState.usHrtHfEnd3 = Math.round(60000.0 / (dHfCalc * 1.30)); // end 3		1.25
                          this.sHFState.usHrtHfIntense = Math.round(60000.0 / (dHfCalc * 1.40)); // int 1		1.40 + 0.5
                          this.sHFState.usHrtHfIntense2 = Math.round(60000.0 / (dHfCalc * 1.45)); // int 2		1.40 + 9.5
                          // console.log(this.sHFState.usHrtHfEnd1, this.sHFState.usHrtHfEnd2, this.sHFState.usHrtHfEnd3, this.sHFState.usHrtHfIntense)
                      }
                      this.sATDSData.ucState = this.HF_END1;
                  }
              }
              break;

          case this.HF_END1:
              if (usNewHRT <= this.sHFState.usHrtHfEnd2) // HRT below, HF above 1.12
              {
                  this.sATDSData.ucState = this.HF_END2;
              } else {
                  // Ampl above lowest threshold, plus HF below 0.97
                  if ((usNewHRT > this.sHFState.usHrtHfEnd1) &&
                      (this.sATDSData.dHrvAmplitude > this.HRV_BEGIN_LOW)) {
                      this.sATDSData.ucState = this.HRV_WUPCDN;
                  }
              }
              // console.log('state update')
              this.sATDSData.iStateProgress = this.CalcStateProgress(usNewHRT, this.sHFState.usHrtHfEnd1, this.sHFState.usHrtHfEnd2);
              break;

          case this.HF_END2:
              if (usNewHRT <= this.sHFState.usHrtHfEnd3) // HRT below, HF above 1.25
              {
                  this.sATDSData.ucState = this.HF_END3;
              } else {
                  if (usNewHRT > this.sHFState.usHrtHfEnd2) // HRT above, HF below 1.12
                  {
                      this.sATDSData.ucState = this.HF_END1;
                  }
              }
              // console.log('state update')
              this.sATDSData.iStateProgress = this.CalcStateProgress(usNewHRT, this.sHFState.usHrtHfEnd2, this.sHFState.usHrtHfEnd3);
              break;

          case this.HF_END3:
              if (usNewHRT <= this.sHFState.usHrtHfIntense) // HRT below, HF above 1.40
              {
                  this.sATDSData.ucState = this.HF_INTENSE;
              } else {
                  if (usNewHRT > this.sHFState.usHrtHfEnd3) // HRT above, HF below 1.25
                  {
                      this.sATDSData.ucState = this.HF_END2;
                  }
              }
              // console.log('state update')
              this.sATDSData.iStateProgress = this.CalcStateProgress(usNewHRT, this.sHFState.usHrtHfEnd3, this.sHFState.usHrtHfIntense);
              break;

          case this.HF_INTENSE:
              if (usNewHRT <= this.sHFState.usHrtHfIntense2) // HRT below, HF above
              // 1.40 + 10
              {
                  this.sATDSData.ucState = this.HF_INTENSE2;
              } else {
                  if (usNewHRT > this.sHFState.usHrtHfIntense) // HRT above, HF below
                  // 1.40
                  {
                      this.sATDSData.ucState = this.HF_END3;
                  }
              }
              this.sATDSData.iStateProgress = this.CalcStateProgress(usNewHRT, this.sHFState.usHrtHfIntense, this.sHFState.usHrtHfIntense2);
              break;

          case this.HF_INTENSE2:
              if (usNewHRT > this.sHFState.usHrtHfIntense2) // HRT above, HF below 1.40
              // + 10
              {
                  this.sATDSData.ucState = this.HF_INTENSE;
              }
              this.sATDSData.iStateProgress = 50;
              break;
      }
  }

  CalcStateProgress(iNewHrt, iLowHrt, iHighHrt) {
      // Log.d(LOG_TAG, "iNewHrt " + iNewHrt +" iLowHrt "+ iLowHrt + " iHighHrt " + iHighHrt );
      if ((iLowHrt != 0) && (iHighHrt != 0) && (iHighHrt != iLowHrt))
          return (100 * (iNewHrt - iLowHrt) / (iHighHrt - iLowHrt));
      else
          return 0;
  }

  // Statemachine to maintain HRv/HF training status based on HRT info
  // ---------------------------------------------------------------------------
  determineHRvHFStateFromInput(usNewHRT) {
      // calc endurance level values
      if ((this.sHFState.usHrtHfEnd1 == 0) || (this.sATDSData.usAt == 0)) // Only assign once after reset
      {
          this.sATDSData.iStateProgress = 0;
          this.sATDSData.usAt = this.iAtFromInput;
          if (this.sATDSData.iTrainingSport == this.TRAINING_SPORT_JOGGING) {
              this.sATDSData.usAt += 10;
          } else if (this.sATDSData.iTrainingSport == this.TRAINING_SPORT_STEPS) {
              this.sATDSData.usAt += 5;
          }

          this.sATDSData.dHFAverage = (this.sATDSData.usAt / 1.4);
          // JdP: Typecast!!???!?!?
          this.sHFState.usHrtHfEnd1 = Math.round(60000.0 / (this.sATDSData.dHFAverage * 0.97)); // 3% hysteresis 	// end 1 was 	0.97
          this.sHFState.usHrtHfEnd2 = Math.round(60000.0 / (this.sATDSData.dHFAverage * 1.10)); // end 2		1.12
          this.sHFState.usHrtHfEnd3 = Math.round(60000.0 / (this.sATDSData.dHFAverage * 1.30)); // end 3		1.25
          this.sHFState.usHrtHfIntense = Math.round(60000.0 / (this.sATDSData.dHFAverage * 1.40)); // int 1		1.40 + 0.5
          this.sHFState.usHrtHfIntense2 = Math.round(60000.0 / (this.sATDSData.dHFAverage * 1.45)); // int 2		1.40 + 9.5
      }

      // Only run state machine when Amplitude is calculated
      if (this.sATDSData.dHrvAmplitude == 0) {
          return; // No state changes until first amplitude known
      }

      // console.log(this.sHFState.usHrtHfEnd1, this.sHFState.usHrtHfEnd2, this.sHFState.usHrtHfEnd3, this.sHFState.usHrtHfIntense)

      // HRV/HF training state machine, determine color to be shown
      switch (this.sATDSData.ucState) {
          case this.HRV_RELAX:
              this.sATDSData.iStateProgress = 0;
              if (this.sATDSData.dHrvAmplitude < this.HRV_BEGIN_MAX) {
                  // HRT value for Tmax
                  this.sHFState.usHrtHrvMax = usNewHRT;
                  
                  this.sATDSData.ucState = this.HRV_REST;
              }
              if (usNewHRT < this.sHFState.usHrtHfEnd1) // At is form input not calc with the AT.
              {
                  this.sATDSData.ucState = this.HF_END1;
              }
              break;

          case this.HRV_REST:
              this.sATDSData.iStateProgress = 0;
              if (this.sATDSData.dHrvAmplitude > this.HRV_BEGIN_MAX) {
                  if (usNewHRT > this.sHFState.usHrtHrvMax) // HF below 'barrier' value
                  {
                      this.sATDSData.ucState = this.HRV_RELAX;
                  } else {
                      // HF still above barrier, no state change allowed yet,
                      // but reduce barrier by lowering the HRT limit value
                      this.sHFState.usHrtHrvMax -= 2;
                  }
              } else {
                  if (this.sATDSData.dHrvAmplitude < this.HRV_BEGIN_HIGH) {
                      // Set 1st HRT value for Thigh
                      this.sHFState.usHrtHrvHigh = usNewHRT;
                      this.sATDSData.ucState = this.HRV_ACTIVE;
                  }
              }
              if (usNewHRT < this.sHFState.usHrtHfEnd1) // At is form input not calc with the AT.
              {
                  this.sATDSData.ucState = this.HF_END1;
              }
              break;

          case this.HRV_ACTIVE:
              this.sATDSData.iStateProgress = 0;
              if (this.sATDSData.dHrvAmplitude > this.HRV_BEGIN_HIGH) {
                  if (usNewHRT > this.sHFState.usHrtHrvHigh) // HF below 'barrier'
                  // value
                  {
                      this.sATDSData.ucState = this.HRV_REST;
                  } else {
                      // HF still above barrier, no state change allowed yet,
                      // but reduce barrier by lowering the HRT limit value
                      this.sHFState.usHrtHrvHigh -= 2;
                  }
              } else {
                  if (this.sATDSData.dHrvAmplitude < this.HRV_BEGIN_MEDIUM) {
                      // HRT value for Tmed
                      this.sHFState.usHrtHrvMed = usNewHRT;
                      this.sATDSData.ucState = this.HRV_WUPCDN;
                  }
              }
              if (usNewHRT < this.sHFState.usHrtHfEnd1) // At is form input not calc with the AT.
              {
                  this.sATDSData.ucState = this.HF_END1;
              }
              break;

          default: // From UNKNOWN, go to medium
              this.sATDSData.ucState = this.HRV_WUPCDN;
              this.sATDSData.iStateProgress = 0;
              break;



          case this.HRV_WUPCDN:
              // new aerobic-transition found, AT is 1.40 * HF at this
              // point, rounded down

              if (this.sATDSData.dHrvAmplitude > this.HRV_BEGIN_MEDIUM) {
                  if (usNewHRT > this.sHFState.usHrtHrvMed) // HF below 'barrier' value
                  {
                      this.sATDSData.ucState = this.HRV_ACTIVE;
                  } else {
                      // HF still above barrier, no state change allowed yet,
                      // but reduce barrier by lowering the HRT limit value
                      this.sHFState.usHrtHrvMed -= 2;
                  }
              }
              if (usNewHRT < this.sHFState.usHrtHfEnd1) // At is form input not calc with the AT.
              {
                  this.sATDSData.ucState = this.HF_END1;
              }
              break;

          case this.HF_END1:
              if (usNewHRT <= this.sHFState.usHrtHfEnd2) // HRT below, HF above 1.12
              {
                  this.sATDSData.ucState = this.HF_END2;
              } else if (usNewHRT > this.sHFState.usHrtHfEnd1) {
                  // Ampl above lowest threshold, plus HF below 0.97
                  this.sATDSData.ucState = this.HRV_WUPCDN;
              }
              this.sATDSData.iStateProgress = this.CalcStateProgress(usNewHRT, this.sHFState.usHrtHfEnd1, this.sHFState.usHrtHfEnd2);
              break;

          case this.HF_END2:
              if (usNewHRT <= this.sHFState.usHrtHfEnd3) // HRT below, HF above 1.25
              {
                  this.sATDSData.ucState = this.HF_END3;
              } else {
                  if (usNewHRT > this.sHFState.usHrtHfEnd2) // HRT above, HF below 1.12
                  {
                      this.sATDSData.ucState = this.HF_END1;
                  }
              }
              this.sATDSData.iStateProgress = this.CalcStateProgress(usNewHRT, this.sHFState.usHrtHfEnd2, this.sHFState.usHrtHfEnd3);
              break;

          case this.HF_END3:
              if (usNewHRT <= this.sHFState.usHrtHfIntense) // HRT below, HF above 1.40
              {
                  this.sATDSData.ucState = this.HF_INTENSE;
              } else {
                  if (usNewHRT > this.sHFState.usHrtHfEnd3) // HRT above, HF below 1.25
                  {
                      this.sATDSData.ucState = this.HF_END2;
                  }
              }
              this.sATDSData.iStateProgress = this.CalcStateProgress(usNewHRT, this.sHFState.usHrtHfEnd3, this.sHFState.usHrtHfIntense);
              break;

          case this.HF_INTENSE:
              if (usNewHRT <= this.sHFState.usHrtHfIntense2) // HRT below, HF above
              // 1.40 + 10
              {
                  this.sATDSData.ucState = this.HF_INTENSE2;
              } else {
                  if (usNewHRT > this.sHFState.usHrtHfIntense) // HRT above, HF below
                  // 1.40
                  {
                      this.sATDSData.ucState = this.HF_END3;
                  }
              }
              this.sATDSData.iStateProgress = this.CalcStateProgress(usNewHRT, this.sHFState.usHrtHfIntense, this.sHFState.usHrtHfIntense2);
              break;

          case this.HF_INTENSE2:
              if (usNewHRT > this.sHFState.usHrtHfIntense2) // HRT above, HF below 1.40
              // + 10
              {
                  this.sATDSData.ucState = this.HF_INTENSE;
              }
              this.sATDSData.iStateProgress = 50;
              break
      }

      //		Log.d(LOG_TAG, "NewHRT:"+ usNewHRT + " Progress " +sATDSData.iStateProgress);
  }

  calcStateProgress(iNewHrt, iLowHrt, iHighHrt) {
      // Log.d(LOG_TAG, "iNewHrt " + iNewHrt +" iLowHrt "+ iLowHrt + " iHighHrt " + iHighHrt );
      if ((iLowHrt != 0) && (iHighHrt != 0) && (iHighHrt != iLowHrt)) {
          return (100 * (iNewHrt - iLowHrt) / (iHighHrt - iLowHrt))
      } else {
          return 0
      }
  }

  Atds_SetAtFromRest(iLastAt, iLevel) {

      let dNewLevel = iLevel;
      let dNewAt = iLastAt;

      if (dNewLevel > 10)
          dNewLevel = 10;
      if (dNewLevel < -10)
          dNewLevel = -10;

      let dPercentage = ((dNewLevel / 2.0) / 100.0) + 1.0;

      dNewAt = dNewAt * dPercentage;
      let iAtIn = Math.round(dNewAt);

      if (iAtIn != 0) {
          this.bUseAtFromInput = true;
          this.iAtFromInput = iAtIn;
          // console.log('ATIN')
          this.sATDSData.usAt = this.iAtFromInput;
      } else
          this.bUseAtFromInput = false;

      return this.iAtFromInput
  }

  Atds_SetAtFromInput(bOn, iAtIn) {
      this.bUseAtFromInput = bOn;
      if ((bOn) && (iAtIn != 0)) {
          this.iAtFromInput = iAtIn;
      } else {
          this.iAtFromInput = 0;
      }

      this.sATDSData.usAt = this.iAtFromInput;
      return this.iAtFromInput
  }

  calcIadem(usThisHrt) {
      let iAverage
      let iDelta
      // derive breath signal (HRV: invert and amplify)
      // iAdem is for display purposes only since it is
      // distorted by the dynamic scaling used
      usThisHrt = (this.HB_MAX_HRT_PERIOD - usThisHrt)
      if (this.sTiTeData.iInvHrtOffset == 0) { // start of scale
          // iInvHrtOffset approaches the average of the iInverseHrt signal
          // so the plotted iAdem line will be centered in the graph
          // Initial values based on average of 1st real and typical HB period
          this.sTiTeData.iInvHrtOffset = this.HB_MAX_HRT_PERIOD - ((2 * usThisHrt + this.HB_TYP_HRT_PERIOD) / 3)
      } else {
          iAverage = (this.sTiTeData.usMaxInvHrtValue + this.sTiTeData.usMinInvHrtValue) / 2
          iDelta = Math.abs(iAverage - this.sTiTeData.iInvHrtOffset)
          if (iDelta > this.HB_BS_DELTA_MIN) { // when off-center too much
              if (iDelta > (this.HB_BS_MEDIAN / this.HB_BS_AMPLIF)) { // off graph area
                  iDelta /= this.HB_BS_DELTA_LARGE
              } else { // small adjustments towards median
                  iDelta /= this.HB_BS_DELTA_SMALL
                  if (iDelta == 0) {
                      iDelta = 1 // minimal correction
                  }
              }
              //System.out.println("Delta 2 "+ iDelta);
              if (this.sTiTeData.iInvHrtOffset > iAverage) {
                  this.sTiTeData.iInvHrtOffset -= iDelta
              } else {
                  this.sTiTeData.iInvHrtOffset += iDelta
              }
          }
          //Log.d(AtdsCalc.LOG_TAG, "HrtOffset "+ sTiTeData.iInvHrtOffset);
      }
  }

  atdsResetCalc() {
      this.sATDSData.usHRTInput = 10
      this.sATDSData.usHRTFiltered = 0
      this.sATDSData.dHrtAverage = 0
      this.sATDSData.dHFAverage = 0
      this.sATDSData.dHrvAmplitude = 50.5
      this.sATDSData.ucState = this.HRVHF_UNKNOWN
      this.sATDSData.usAt = 0
      this.sATDSData.usBreathFreq = 8 // Reasonable start value
      this.sATDSData.iHbTimeBase = 0

      this.sTiTeData.bBreathInhalePhase = true
      this.sTiTeData.ulHbTimeBase = 0
      this.sTiTeData.usMaxInvHrtValue = 0
      this.sTiTeData.usMinInvHrtValue = 0
      this.sTiTeData.usInvHrtThresh = this.INVHRT_MINIMUM_THRESH

      this.sTiTeData.ulMaxInvHrtTime = 0
      this.sTiTeData.ulMinInvHrtTime = 0
      this.sTiTeData.ulBreathTime = 0

      this.sTiTeData.iMaxInvHrtValueLow = 1000 // iMinInvHrtValue
      this.sTiTeData.iMinInvHrtValueLow = 400 // iMaxInvHrtValueLow
      this.sTiTeData.iMaxInvHrtValueCalc = 1000 // iMaxInvHrtValueLow

      this.sHFState.usHrtHfEnd1 = 0
      this.sHFState.usHrtHfEnd2 = 0
      this.sHFState.usHrtHfEnd3 = 0
      this.sHFState.usHrtHfIntense = 0
      this.sHFState.usHrtHfIntense2 = 0

      this.sHFState.usHrtHrvMed = 0
      this.sHFState.usHrtHrvHigh = 0
      this.sHFState.usHrtHrvMax = 0

      // Reset Filter
      this.sAtdsFilter.uiFilterCount = 0
      this.sAtdsFilter.dFilterAmpAverage = 0
      this.sAtdsFilter.uiFilterSpikeCount = 0

      this.bUseAtFromInput = false
      this.iAtFromInput = 0

      this.sAtdsBreath.mAveragePeriode = new MovAverage(8)
      this.sAtdsBreath.ulPeriodeMaxTime = 0
      this.sAtdsBreath.ulPeriodeMinTime = 0
  }

  Atds_ResetCalcStartTr(bResetAt) {
      this.sATDSData.iHbTimeBase = 0

      if (bResetAt) {
          this.sATDSData.usAt = 0
          this.bUseAtFromInput = false
          this.iAtFromInput = 0;
      }

      this.sHFState.usHrtHfEnd1 = 0;
      this.sHFState.usHrtHfEnd2 = 0;
      this.sHFState.usHrtHfEnd3 = 0;
      this.sHFState.usHrtHfIntense = 0;
      this.sHFState.usHrtHfIntense2 = 0;

      this.sHFState.usHrtHrvMed = 0;
      this.sHFState.usHrtHrvHigh = 0;
      this.sHFState.usHrtHrvMax = 0;
  }

  Atds_SetMeasurementType(iType, iTypeSport) {
      this.sAtdsFilter.uiFilterType = iType;
      this.sATDSData.iTrainingSport = iTypeSport;
  }
}

class TiTeData {
  bBreathInhalePhase
  ulHbTimeBase = 0
  // Configuration variables
  dBreathMultiplier = 0
  iInvHrtOffset = 0
  // Level thresholds for Amplitude, can be synced
  // Value is 4 times (AMPL-MULTI) actual threshold in msec
  dHrvBeginMax = 0
  dHrvBeginHigh = 0
  dHrvBeginMedium = 0
  dHrvBeginLow = 0

  // TDEC level thresholds for HeartFreq, can be synced
  dHfBeginMedium = 0
  dHfBeginHigh = 0
  dHfBeginCritical = 0

  //int usPrevInvHrtValue;
  usMaxInvHrtValue = 0
  usMinInvHrtValue = 0
  usInvHrtThresh = 0

  ulMaxInvHrtTime = 0
  ulMinInvHrtTime = 0

  ulBreathTime = 0
  ulTiTime = 0
  ulTeTime = 0

  dTeTime = 0
  dTiTime = 0
  dTiTeTime = 0

  mTiTime = new MovAverage()
  mTeTime = new MovAverage()

  iMaxInvHrtValueLow = 0 // iMinInvHrtValue
  iMinInvHrtValueLow = 0 // iMaxInvHrtValueLow
  iMaxInvHrtValueCalc = 0 // iMaxInvHrtValueLow
}

class ATDSData {
  usHRTInput = 0 // Raw BMI strap data
  usHRTFiltered = 0 // After function: Atds_FilterHrt()
  usAt = 0
  usBreathFreq = 0
  // int usBreathFreq2;
  dHFAverage = 0 // After functions: Atds_FilterHrt() & Atds_AvgHrt()
  dHrtAverage = 0
  dHrvAmplitude = 0
  ucState = 0
  iStateProgress = 0
  iHbTimeBase = 0
  iAdem = 0

  iTrainingSport = 0

  mHrtAverage = new MovAverage()
}

class ATDSBreath {
  mAveragePeriode = new MovAverage()
  ulPeriodeMaxTime = 0
  ulPeriodeMinTime = 0
}

class HFState {
  // HRT dynamic threshold values used in the HRvHF state machine
  usHrtHfEnd1 = 0
  usHrtHfEnd2 = 0
  usHrtHfEnd3 = 0
  usHrtHfIntense = 0
  usHrtHfIntense2 = 0

  usHrtHrvMed = 0
  usHrtHrvHigh = 0
  usHrtHrvMax = 0
}

class AtdsFilter {
  // ATDS filter setttings
  uiPrefHRTSpike = 0

  uiFilterType = 0
  uiReMaxRR = 0
  uiReMinRR = 0
  uiReAmpDiff = 0
  uiReAmpSamples = 0

  uiExMaxRR = 0
  uiExMinRR = 0
  uiExAmpDiff = 0
  uiExAmpSamples = 0

  uiAmpSamples = 0
  dFilterAmpAverage = 0
  iFilterHrtAverage = 0

  uiFilterCount = 0
  uiFilterSpikeCount = 0
}

class MovAverage {
  dTable = []
  dAverage = 0
  iTableSize = 8
  constructor(size = 8) {
      this.dTable = Array(size)
      if (size > 0) {
          this.iTableSize = size
      }
      this.dAverage = 0
  }

  movAvg(dInput) {
      let dTotal = 0.0
      let iIndex = 0
      if ((!isNaN(dInput)) && (isFinite(dInput))) {
          if (this.dTable.length >= this.iTableSize) {
              // use prepend and removeLast
              // this.dTable.splice(this.dTable.length - 1,1)
              this.dTable.splice(0, 1)
          }
          this.dTable.push(dInput)
          for (iIndex = 0; iIndex < this.dTable.length; iIndex++) {
              if (this.dTable[iIndex] != null)
                  dTotal += this.dTable[iIndex]
          }

          this.dAverage = dTotal / this.dTable.length
      }
      if (this.dAverage > 99999999) {
          this.dAverage = 0
      }
  }

  movGetTotal() {
      let dTotal = 0.0
      for (iIndex = 0; iIndex < this.dTable.length; iIndex++) {
          dTotal += this.dTable[iIndex]
      }
      return dTotal
  }
}

export default new Calculate()
