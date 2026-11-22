import * as fs from "fs";
import * as path from "path";

/**
 * Script to generate clean PCM WAV audio files for the 9 PRD v1 sounds.
 * WAV format: 16-bit PCM, 44.1 kHz, mono.
 */

function createWavHeader(dataLength: number, sampleRate = 44100, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  // RIFF chunk descriptor
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);

  // fmt sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

function synthesizeTone(
  frequencies: number[],
  durationSec: number,
  pattern: "arpeggio" | "alternating" | "decay" | "double_beep",
  sampleRate = 44100
): Buffer {
  const totalSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(totalSamples * 2);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (pattern === "alternating") {
      // 0.25s switches between freq[0] and freq[1]
      const freqIndex = Math.floor(t / 0.25) % frequencies.length;
      const freq = frequencies[freqIndex];
      sample = Math.sin(2 * Math.PI * freq * t) * 0.8;
    } else if (pattern === "arpeggio") {
      // smooth sequential note steps
      const stepDuration = durationSec / frequencies.length;
      const freqIndex = Math.min(Math.floor(t / stepDuration), frequencies.length - 1);
      const freq = frequencies[freqIndex];
      const stepT = t % stepDuration;
      const envelope = Math.sin((stepT / stepDuration) * Math.PI);
      sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.75;
    } else if (pattern === "double_beep") {
      // Beep at 0.0 - 0.2s and 0.35 - 0.55s
      const inFirstBeep = t < 0.2;
      const inSecondBeep = t > 0.35 && t < 0.55;
      if (inFirstBeep) {
        sample = Math.sin(2 * Math.PI * frequencies[0] * t) * 0.8;
      } else if (inSecondBeep) {
        sample = Math.sin(2 * Math.PI * (frequencies[1] || frequencies[0]) * t) * 0.8;
      }
    } else {
      // decay chime
      const envelope = Math.exp(-3 * t);
      sample = Math.sin(2 * Math.PI * frequencies[0] * t) * envelope * 0.8;
      if (frequencies.length > 1) {
        sample += Math.sin(2 * Math.PI * frequencies[1] * t) * envelope * 0.4;
      }
    }

    // Clip and write int16
    const intVal = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intVal, i * 2);
  }

  return Buffer.concat([createWavHeader(buffer.length, sampleRate), buffer]);
}

const SOUND_DEFS = [
  // Vendor Sounds
  { name: "new_order_ring", freqs: [880, 1175], duration: 3.0, pattern: "alternating" as const },
  { name: "order_reminder", freqs: [660, 880], duration: 1.2, pattern: "double_beep" as const },
  { name: "order_warning", freqs: [740, 520], duration: 1.5, pattern: "decay" as const },
  { name: "money_success", freqs: [523, 659, 784, 1046], duration: 1.2, pattern: "arpeggio" as const },
  { name: "default_chime", freqs: [587, 880], duration: 1.0, pattern: "decay" as const },
  // User Sounds
  { name: "user_success", freqs: [440, 880], duration: 0.8, pattern: "arpeggio" as const },
  { name: "user_alert", freqs: [600, 450], duration: 0.9, pattern: "double_beep" as const },
  { name: "user_arrival", freqs: [523, 659, 1046], duration: 1.2, pattern: "arpeggio" as const },
  { name: "user_promo", freqs: [440, 554, 659, 880], duration: 1.2, pattern: "arpeggio" as const },
];

const TARGET_DIRS = [
  path.join(process.cwd(), "public", "sounds"),
  path.join(process.cwd(), "intrihub-business", "android", "app", "src", "main", "res", "raw"),
  path.join(process.cwd(), "intrihub-business", "assets", "sounds"),
  path.join(process.cwd(), "intrihub-mobile", "android", "app", "src", "main", "res", "raw"),
  path.join(process.cwd(), "intrihub-mobile", "assets", "sounds"),
];

async function main() {
  console.log("🔊 Generating PRD v1 9 sound assets...");

  for (const dir of TARGET_DIRS) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  for (const sound of SOUND_DEFS) {
    const wavBuffer = synthesizeTone(sound.freqs, sound.duration, sound.pattern);
    console.log(`  ✓ Generated ${sound.name}.wav (${(wavBuffer.length / 1024).toFixed(1)} KB)`);

    for (const dir of TARGET_DIRS) {
      const dest = path.join(dir, `${sound.name}.wav`);
      fs.writeFileSync(dest, wavBuffer);
    }
  }

  console.log("🎉 All 9 notification sounds successfully generated across web and mobile projects!");
}

main().catch(console.error);
