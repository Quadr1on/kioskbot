/**
 * AudioWorklet processor that captures mic audio and outputs 16-bit PCM at 16kHz.
 * The browser's AudioContext typically runs at 44.1kHz or 48kHz, so we resample down to 16kHz.
 */
class PCMWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // Send chunks of this size
    this.buffer = new Float32Array(0);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono channel

    // Accumulate samples
    const newBuffer = new Float32Array(this.buffer.length + channelData.length);
    newBuffer.set(this.buffer);
    newBuffer.set(channelData, this.buffer.length);
    this.buffer = newBuffer;

    // When we have enough samples, resample and send
    while (this.buffer.length >= this.bufferSize) {
      const chunk = this.buffer.slice(0, this.bufferSize);
      this.buffer = this.buffer.slice(this.bufferSize);

      // Resample from sampleRate to 16000
      const ratio = sampleRate / 16000;
      const outputLength = Math.floor(chunk.length / ratio);
      const resampled = new Int16Array(outputLength);

      for (let i = 0; i < outputLength; i++) {
        const srcIndex = Math.floor(i * ratio);
        // Clamp to [-1, 1] and convert to 16-bit PCM
        const sample = Math.max(-1, Math.min(1, chunk[srcIndex]));
        resampled[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }

      // Convert to base64 and post to main thread
      const bytes = new Uint8Array(resampled.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      
      this.port.postMessage({
        type: 'audio',
        data: btoa(binary),
      });
    }

    return true;
  }
}

registerProcessor('pcm-worklet-processor', PCMWorkletProcessor);
