export interface ChipMetadata {
  description: string | undefined;
  features: string[] | undefined;
  crystalFreq: number | undefined;
  macAddress: string | undefined;
  pkgVersion: number | undefined;
  chipRevision: number | undefined;
  majorVersion: number | undefined;
  minorVersion: number | undefined;
  flashVendor: string | undefined;
  psramVendor: string | undefined;
  flashCap: number | undefined;
  psramCap: number | undefined;
  blockVersionMajor: number | undefined;
  blockVersionMinor: number | undefined;
}
