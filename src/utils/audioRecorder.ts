// Real browser audio recorder using MediaRecorder and AudioContext

export interface AudioRecordResult {
  blob: Blob;
  audioUrl: string;
  duration: number;
}

export class RealAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;

  async start(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      this.startTime = Date.now();
      return true;
    } catch (err) {
      console.warn('Microphone access not available or denied:', err);
      return false;
    }
  }

  async stop(): Promise<AudioRecordResult | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve(null);
        return;
      }

      const duration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

      this.mediaRecorder.onstop = () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          this.cleanup();
          resolve({ blob: audioBlob, audioUrl, duration });
        } catch {
          this.cleanup();
          resolve(null);
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        this.cleanup();
        resolve(null);
      }
    });
  }

  cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

// Global real audio player
let currentActiveAudio: HTMLAudioElement | null = null;

export function playRealAudio(
  url: string,
  onProgress: (pct: number) => void,
  onEnded: () => void
): () => void {
  stopRealAudio();

  try {
    const audio = new Audio(url);
    currentActiveAudio = audio;

    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const pct = (audio.currentTime / audio.duration) * 100;
        onProgress(Math.min(pct, 100));
      }
    };

    audio.onended = () => {
      onProgress(100);
      onEnded();
    };

    audio.onerror = () => {
      onEnded();
    };

    audio.play().catch(() => {
      onEnded();
    });

    return () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    };
  } catch {
    onEnded();
    return () => {};
  }
}

export function stopRealAudio() {
  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
    } catch {}
    currentActiveAudio = null;
  }
}
