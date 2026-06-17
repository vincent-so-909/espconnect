export {};

declare global {
  interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
  }

  interface SerialPortFilter extends SerialPortInfo { }

  interface SerialOutputSignals {
    dataTerminalReady?: boolean;
    requestToSend?: boolean;
    break?: boolean;
  }

  interface SerialInputSignals {
    dataCarrierDetect?: boolean;
    clearToSend?: boolean;
    ringIndicator?: boolean;
    dataSetReady?: boolean;
  }

  interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
  }

  interface SerialPort extends EventTarget {
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    getInfo(): SerialPortInfo;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    setSignals(signals?: SerialOutputSignals): Promise<void>;
    getSignals(): Promise<SerialInputSignals>;
  }

  interface Serial extends EventTarget {
    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: { filters?: SerialPortFilter[] }): Promise<SerialPort>;
  }

  interface Navigator {
    serial: Serial;
  }
}
