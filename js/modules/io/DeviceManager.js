/**
 * MODULE: DeviceManager
 * Handles Web Serial connection for BMI-USBCDC Transceivers.
 */
export class DeviceManager {
    constructor(onDataCallback) {
        this.onData = onDataCallback;
        this.port = null;
        this.reader = null;
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

            this.keepReading = true;
            this.readLoop();
            return true;
        } catch (err) {
            console.error("Serial Connection Error:", err);
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
            const rr = parseInt(line.trim());
            if (!isNaN(rr) && rr > 0 && rr < 2000) {
                this.onData(rr);
            }
        });
    }

    async disconnect() {
        this.keepReading = false;
        if (this.reader) await this.reader.cancel();
        if (this.port) await this.port.close();
    }
}