// securityInfo.ts

/**
 * Raw structure returned by getSecurityInfo().
 * Mirrors the stub / esptool get_security_info output.
 */
export interface SecurityInfo {
  flags: number;
  flashCryptCnt: number;
  keyPurposes: number[];
  chipId: number;
  apiVersion: number;
}

/**
 * Decoded bitfields from `flags`.
 * Mapping comes from Espressif's explanation of get_security_info flags:
 * https://esp32.com/viewtopic.php?t=30498
 */
export interface DecodedSecurityFlags {
  /** Secure Boot enabled */
  secureBootEnabled: boolean;
  /** Aggressive revocation strategy for Secure Boot digests */
  secureBootAggressiveRevoke: boolean;
  /** Secure Download Mode (ROM restricted command set) */
  secureDownloadMode: boolean;
  /** Secure Boot key digest 0/1/2 revoked */
  secureBootKeyRevoked: [boolean, boolean, boolean];
  /** JTAG disabled via soft fuse */
  softJtagDisabled: boolean;
  /** JTAG disabled via hard fuse */
  hardJtagDisabled: boolean;
  /** USB disabled (on USB-capable SoCs) */
  usbDisabled: boolean;
  /** Instruction/Data cache disabled in download mode */
  downloadDCacheDisabled: boolean;
  downloadICacheDisabled: boolean;
}

/**
 * High-level interpretation of key purpose values.
 * Values 0–3 are the classic ESP32 esp_efuse_purpose_t mapping. :contentReference[oaicite:2]{index=2}
 * Other values are left as "Unknown / SoC-specific" to avoid guessing.
 */
export interface DecodedKeyPurpose {
  index: number;
  raw: number;
  label: string;
}

/**
 * Combination of raw info + decoded views.
 */
export interface DecodedSecurityInfo {
  raw: SecurityInfo;
  flags: DecodedSecurityFlags;
  flashEncryptionEnabled: boolean;
  flashCryptCntSetBits: number;
  keyPurposes: DecodedKeyPurpose[];
}

/**
 * Count the number of bits set in a value.
 */
export function countSetBits(value: number): number {
  let v = value >>> 0;
  let count = 0;
  while (v) {
    v &= v - 1;
    count++;
  }
  return count;
}

/**
 * Espressif: flash encryption is enabled if FLASH_CRYPT_CNT (SPI_BOOT_CRYPT_CNT)
 * has an odd number of bits set. :contentReference[oaicite:3]{index=3}
 *
 * Many SoCs use only the low 3 bits, but masking isn't strictly required;
 * we keep it configurable & explicit.
 */
export function isFlashEncryptionEnabled(flashCryptCnt: number, mask: number = 0x7): boolean {
  const masked = flashCryptCnt & mask;
  const ones = countSetBits(masked);
  return (ones & 1) === 1;
}

/**
 * Decode the esptool get_security_info flags bitfield.
 * Sources: Espressif staff explanation. :contentReference[oaicite:4]{index=4}
 */
export function decodeSecurityFlags(flags: number): DecodedSecurityFlags {
  return {
    secureBootEnabled: !!(flags & (1 << 0)),
    secureBootAggressiveRevoke: !!(flags & (1 << 1)),
    secureDownloadMode: !!(flags & (1 << 2)),
    secureBootKeyRevoked: [
      !!(flags & (1 << 3)),
      !!(flags & (1 << 4)),
      !!(flags & (1 << 5)),
    ],
    softJtagDisabled: !!(flags & (1 << 6)),
    hardJtagDisabled: !!(flags & (1 << 7)),
    usbDisabled: !!(flags & (1 << 8)),
    downloadDCacheDisabled: !!(flags & (1 << 9)),
    downloadICacheDisabled: !!(flags & (1 << 10)),
  };
}

/**
 * Map a raw key purpose value to a human-readable label.
 *
 * NOTE:
 *  - For classic ESP32: 0–3 match esp_efuse_purpose_t exactly. :contentReference[oaicite:5]{index=5}
 *  - For newer SoCs (C3/S2/S3/C6/H2) there are more purposes
 *    (XTS AES, HMAC, Secure Boot digests, etc.). Their numeric IDs aren’t
 *    consistently documented in public API, so we *do not* guess them here.
 */
export function describeKeyPurpose(raw: number): string {
  switch (raw) {
    case 0:
      return "User / unspecified key (ESP_EFUSE_KEY_PURPOSE_USER)";
    case 1:
      return "System key (ESP_EFUSE_KEY_PURPOSE_SYSTEM)";
    case 2:
      return "Flash encryption key (ESP_EFUSE_KEY_PURPOSE_FLASH_ENCRYPTION)";
    case 3:
      return "Secure Boot V2 key / digest (ESP_EFUSE_KEY_PURPOSE_SECURE_BOOT_V2)";
    default:
      // You can extend this for your own SoC-specific mapping if you want.
      return `Unknown or SoC-specific purpose (raw=${raw})`;
  }
}

/**
 * Decode the entire keyPurposes[] array.
 */
export function decodeKeyPurposes(keyPurposes: number[]): DecodedKeyPurpose[] {
  return keyPurposes.map((raw, index) => ({
    index,
    raw,
    label: describeKeyPurpose(raw),
  }));
}

/**
 * Produce a structured decoded view of SecurityInfo.
 */
export function decodeSecurityInfo(info: SecurityInfo): DecodedSecurityInfo {
  const flagsDecoded = decodeSecurityFlags(info.flags);
  const flashCryptCntSetBits = countSetBits(info.flashCryptCnt & 0x7);
  const flashEncEnabled = isFlashEncryptionEnabled(info.flashCryptCnt);

  return {
    raw: info,
    flags: flagsDecoded,
    flashEncryptionEnabled: flashEncEnabled,
    flashCryptCntSetBits,
    keyPurposes: decodeKeyPurposes(info.keyPurposes),
  };
}

/**
 * Generate a human-readable multi-line summary string.
 */
// Keep your existing types & helpers:
// - SecurityInfo
// - decodeSecurityInfo(info)
// - DecodedSecurityFlags, etc.

export interface SecurityFact {
  label: string;
  value: string;
  /**
   * Optional hint you can use in the UI
   * (e.g. icon, color, grouping).
   */
  kind?: "status" | "detail" | "note";
}

/**
 * Build a reusable list of labeled security facts.
 * This is what you'll feed into pushFact().
 */
export function buildSecurityFacts(
  info: SecurityInfo,
  chipName?: string
): SecurityFact[] {
  const decoded = decodeSecurityInfo(info);
  const f = decoded.flags;

  const facts: SecurityFact[] = [];

  // If you decide later to surface this, just uncomment:
  // facts.push({
  //   label: "Chip ID",
  //   value: `0x${info.chipId.toString(16)} (API v${info.apiVersion})`,
  //   kind: "detail",
  // });

//   if (chipName) {
//     facts.push({
//       label: "Chip Variant",
//       value: chipName,
//       kind: "detail",
//     });
//   }

  // FLASH ENCRYPTION (status)
  facts.push({
    label: "Flash Encryption",
    value: decoded.flashEncryptionEnabled ? "ENABLED" : "disabled",
    kind: "status",
  });

  // FLASH ENCRYPTION DETAILS (kept compact so you can show it or not)
  facts.push({
    label: "Flash Encryption Details",
    value: `FLASH_CRYPT_CNT=0x${info.flashCryptCnt.toString(
      16,
    )} (set bits=${decoded.flashCryptCntSetBits})`,
    kind: "detail",
  });

  // CHIP-SPECIFIC NOTES ABOUT FLASH ENCRYPTION
  if (chipName?.startsWith("ESP32-S3") || chipName?.startsWith("ESP32-C3")) {
    facts.push({
      label: "Flash Encryption Mode",
      value: "XTS AES (supported on this chip)",
      kind: "note",
    });
  } else if (chipName?.startsWith("ESP32")) {
    facts.push({
      label: "Flash Encryption Mode",
      value: "AES-128 (original ESP32 scheme)",
      kind: "note",
    });
  }

  // SECURE BOOT
  const sbStatus = f.secureBootEnabled ? "ENABLED" : "disabled";
  const sbExtra = f.secureBootAggressiveRevoke ? " (aggressive revoke)" : "";
  facts.push({
    label: "Secure Boot",
    value: sbStatus + sbExtra,
    kind: "status",
  });

  // CHIP-SPECIFIC SECURE BOOT NOTES
  if (chipName?.startsWith("ESP32-S3") || chipName?.startsWith("ESP32-C3")) {
    facts.push({
      label: "Secure Boot Type",
      value: "v2 (digest-based, supports revocation)",
      kind: "note",
    });
  } else if (chipName?.startsWith("ESP32") && !chipName.includes("S")) {
    facts.push({
      label: "Secure Boot Type",
      value: "v1 (RSA, original ESP32)",
      kind: "note",
    });
  }

  // JTAG PROTECTION
  const jtagStatus = f.hardJtagDisabled
    ? "HARD disabled"
    : f.softJtagDisabled
    ? "SOFT disabled"
    : "enabled";

  facts.push({
    label: "JTAG Protection",
    value: jtagStatus,
    kind: "status",
  });

  // USB PROTECTION — Only applies if chip has USB
  if (chipName?.includes("S2") || chipName?.includes("S3") || chipName?.includes("H2")) {
    facts.push({
      label: "USB Protection",
      value: f.usbDisabled ? "disabled" : "enabled",
      kind: "status",
    });
  } else {
    facts.push({
      label: "USB Protection",
      value: "not applicable for this chip",
      kind: "detail",
    });
  }

  // CACHE PROTECTION
  if (f.downloadDCacheDisabled || f.downloadICacheDisabled) {
    const caches = [
      f.downloadDCacheDisabled ? "DCache" : "",
      f.downloadICacheDisabled ? "ICache" : "",
    ]
      .filter(Boolean)
      .join(", ");

    facts.push({
      label: "Download-Mode Caches",
      value: `disabled: ${caches}`,
      kind: "detail",
    });
  }

  // decoded.keyPurposes.forEach((kp) => {
  //   facts.push({
  //     label: `Key ${kp.index} Purpose`,
  //     value: kp.label,
  //     kind: "detail",
  //   });
  // });

  // CHIP-SPECIFIC EXTENDED NOTES
  if (chipName?.startsWith("ESP32-S3")) {
    facts.push({
      label: "Security Note",
      value: "ESP32-S3 supports XTS encryption, HMAC key slots, and flexible key purposes.",
      kind: "note",
    });
  }

  return facts;
}

