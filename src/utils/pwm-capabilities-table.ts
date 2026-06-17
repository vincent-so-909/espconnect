// pwm-capabilities-table.ts
export const PWM_TABLE = {
  "ESP32": {
    hasLedc: true,
    ledcTimers: 4,
    ledcChannels: 16,   // 8 high-speed + 8 low-speed groups
    notes: "Classic ESP32 has dual LEDC speed groups, total 16 channels."
  },

  "ESP32-S2": {
    hasLedc: true,
    ledcTimers: 4,
    ledcChannels: 8,
    notes: "Single LEDC group (no HS/LS separation)."
  },

  "ESP32-S3": {
    hasLedc: true,
    ledcTimers: 4,
    ledcChannels: 8,
    notes: "Single LEDC group."
  },

  "ESP32-C2": {
    hasLedc: true,
    ledcTimers: 4,
    ledcChannels: 6,
    notes: "Single LEDC group."
  },

  "ESP32-C3": {
    hasLedc: true,
    ledcTimers: 4,
    ledcChannels: 6,
    notes: "Single LEDC group."
  },

  "ESP32-C6": {
    hasLedc: true,
    ledcTimers: 4,
    ledcChannels: 6,
    notes: "Single LEDC group."
  },

  "ESP32-H2": {
    hasLedc: true,
    ledcTimers: 4,
    ledcChannels: 6,
    notes: "Single LEDC group."
  },

  "ESP32-P4": {
    hasLedc: true,
    ledcTimers: 4,
    ledcChannels: 8,
    notes: "Per preliminary P4 documentation."
  },

  "ESP8266": {
    hasLedc: false,
    notes: "No LEDC hardware; uses software PWM."
  }
};
