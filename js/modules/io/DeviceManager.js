/**
 * MODULE: DeviceManager
 * Handles Web Serial connection for BMI-USBCDC Transceivers.
 */
export class DeviceManager {
    constructor(onDataCallback, onStatusCallback) {
        this.onData = onDataCallback;
        this.onStatus = onStatusCallback;
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.btDevice = null;
        this.keepReading = false;
    }

    /**
     * Connects to the BMI Dongle using Web Serial API.
     * Filters for VID 0x2047 (TI/BMI) and specific PIDs from INF.
     */
    async connect() {
        if (!("serial" in navigator)) {
            alert("Web Serial API not supported. Please use Chrome or Edge.");
            return false;
        }

        try {
            const filters = [
                { usbVendorId: 0x2047, usbProductId: 0x0921 }, // BM-USBD1
                { usbVendorId: 0x2047, usbProductId: 0x08B4 }, // BM-USBD4
                { usbVendorId: 0x2047, usbProductId: 0x08BB }  // BM-USBRTX4
            ];

            this.port = await navigator.serial.requestPort({ filters });
            await this.port.open({ baudRate: 115200 });

            // Setup Writer
            const textEncoder = new TextEncoderStream();
            const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
            this.writer = textEncoder.writable.getWriter();

            this.keepReading = true;
            this.readLoop();

            // Query Firmware Version
            setTimeout(() => this.send("v\r\n"), 500);

            return true;
        } catch (err) {
            console.error("Serial Connection Error:", err);
            return false;
        }
    }

    /**
     * Connects to a Bluetooth LE device (e.g., BlueRobin or Standard HR Monitor).
     * Requests Heart Rate and Device Information services to trigger bonding if required.
     */
    async connectBluetooth() {
        if (!("bluetooth" in navigator)) {
            alert("Web Bluetooth API not supported.");
            return false;
        }

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['battery_service', 'device_information']
            });

            const server = await device.gatt.connect();
            this.btDevice = device;

            // Attempt to read Firmware Revision to trigger bonding/pairing on secure devices
            try {
                const infoService = await server.getPrimaryService('device_information');
                const fwChar = await infoService.getCharacteristic('firmware_revision_string');
                const decoder = new TextDecoder('utf-8');
                const fwVal = await fwChar.readValue();
                const fwStr = decoder.decode(fwVal);
                if (this.onStatus) this.onStatus({ type: 'firmware', value: fwStr });
            } catch (e) {
                console.warn("Bonding info skipped or not available:", e);
            }

            // Subscribe to Heart Rate Notifications
            const service = await server.getPrimaryService('heart_rate');
            const char = await service.getCharacteristic('heart_rate_measurement');
            await char.startNotifications();
            char.addEventListener('characteristicvaluechanged', (e) => this.handleBluetoothData(e));

            // Read Battery Level if available
            try {
                const battService = await server.getPrimaryService('battery_service');
                const battChar = await battService.getCharacteristic('battery_level');
                const val = await battChar.readValue();
                const level = val.getUint8(0);
                if (this.onStatus) this.onStatus({ type: 'battery', value: level });
            } catch (e) {
                console.log("Battery service not available");
            }

            device.addEventListener('gattserverdisconnected', () => this.disconnect());
            
            return true;
        } catch (err) {
            console.error("Bluetooth Connection Error:", err);
            if (err.name === 'SecurityError') alert("Pairing failed. Please check device bonding.");
            else alert("Bluetooth connection failed: " + err.message);
            return false;
        }
    }

    async readLoop() {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        this.reader = reader;

        try {
            while (this.keepReading) {
                const { value, done } = await reader.read();
                if (done) {
                    reader.releaseLock();
                    break;
                }
                if (value) {
                    this.processData(value);
                }
            }
        } catch (error) {
            console.error("Read Error:", error);
        } finally {
            reader.releaseLock();
        }
    }

    processData(textChunk) {
        // Parse incoming stream (assuming newline separated RR intervals)
        const lines = textChunk.split(/[\r\n]+/);
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.includes("V1_5") || trimmed.startsWith("BM-")) {
                if (this.onStatus) this.onStatus({ type: 'firmware', value: trimmed });
                return;
            }

            const rr = parseInt(trimmed);
            if (!isNaN(rr) && rr > 0 && rr < 2000) {
                this.onData(rr);
            }
        });
    }

    handleBluetoothData(event) {
        const value = event.target.value;
        const flags = value.getUint8(0);

        // Check Sensor Contact Status (Bit 1 = supported, Bit 2 = contact detected)
        const contactSupported = (flags & 0x02) !== 0;
        const contactDetected = (flags & 0x04) !== 0;
        if (contactSupported && !contactDetected) {
            if (this.onStatus) this.onStatus({ type: 'signal', value: 'poor_contact' });
        }
        
        // Check for RR intervals (Bit 4 set)
        if (flags & 0x10) {
            let offset = (flags & 1) ? 3 : 2; // 16-bit or 8-bit HR format
            if (flags & 0x08) offset += 2; // Energy Expended present
            
            while (offset + 1 < value.byteLength) {
                const rrRaw = value.getUint16(offset, true);
                // Bluetooth RR is in 1/1024 seconds. Convert to ms.
                const rrMs = Math.round((rrRaw / 1024) * 1000);
                if (this.onData) this.onData(rrMs);
                offset += 2;
            }
        } else {
            // Fallback: Convert BPM to RR if no RR intervals provided
            const hr = (flags & 1) ? value.getUint16(1, true) : value.getUint8(1);
            if (hr > 0) {
                const rr = Math.round(60000 / hr);
                if (this.onData) this.onData(rr);
            }
        }
    }

    async send(data) {
        if (this.writer) {
            await this.writer.write(data);
        }
    }

    async disconnect() {
        this.keepReading = false;
        if (this.reader) await this.reader.cancel();
        if (this.writer) {
            await this.writer.close();
            this.writer = null;
        }
        if (this.port) await this.port.close();
        if (this.btDevice && this.btDevice.gatt.connected) {
            this.btDevice.gatt.disconnect();
        }
        this.btDevice = null;
    }
}