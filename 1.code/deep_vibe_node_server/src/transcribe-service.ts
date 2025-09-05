import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  AudioStream,
  LanguageCode,
} from "@aws-sdk/client-transcribe-streaming";
import { Readable } from "stream";

interface TranscribeStream {
  streamName: string;
  isActive: boolean;
  startTime: Date;
  languageCode: string;
  audioStream: Readable;
  abortController: AbortController;
}

interface TranscribeResult {
  transcript: string;
  isPartial: boolean;
  confidence: number;
}

interface TranscribeResponse {
  streamName?: string;
  status: string;
}

class TranscribeService {
  private transcribeClient: TranscribeStreamingClient;
  private activeStreams: Map<string, TranscribeStream>;
  private socketCallback?: (socketId: string, result: TranscribeResult) => void;

  constructor() {
    this.transcribeClient = new TranscribeStreamingClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.activeStreams = new Map();
  }

  setSocketCallback(
    callback: (socketId: string, result: TranscribeResult) => void
  ) {
    this.socketCallback = callback;
  }

  async startTranscription(
    socketId: string,
    languageCode: string = "ko-KR"
  ): Promise<TranscribeResponse> {
    const streamName = `transcribe-${socketId}-${Date.now()}`;

    try {
      const audioStream = new Readable({ read() {} });
      const abortController = new AbortController();

      const stream: TranscribeStream = {
        streamName,
        isActive: true,
        startTime: new Date(),
        languageCode,
        audioStream,
        abortController,
      };

      this.activeStreams.set(socketId, stream);
      this.startAWSTranscribeStream(socketId, stream);

      console.log(`AWS Transcribe session started: ${streamName}`);
      return { streamName, status: "started" };
    } catch (error) {
      console.error("Transcribe start error:", error);
      throw error;
    }
  }

  private async startAWSTranscribeStream(
    socketId: string,
    stream: TranscribeStream
  ) {
    try {
      const audioGenerator = this.createAudioGenerator(stream.audioStream);

      const command = new StartStreamTranscriptionCommand({
        LanguageCode: stream.languageCode as LanguageCode,
        MediaEncoding: "pcm",
        MediaSampleRateHertz: 16000,
        AudioStream: audioGenerator,
        EnablePartialResultsStabilization: true,
        PartialResultsStability: "low",
      });

      const response = await this.transcribeClient.send(command, {
        abortSignal: stream.abortController.signal,
      });

      if (response.TranscriptResultStream) {
        this.processTranscriptStream(socketId, response.TranscriptResultStream);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("AWS Transcribe stream error:", error);
      }
    }
  }

  private async processTranscriptStream(
    socketId: string,
    transcriptStream: any
  ) {
    try {
      for await (const event of transcriptStream) {
        if (event.TranscriptEvent?.Transcript?.Results) {
          const results = event.TranscriptEvent.Transcript.Results;

          for (const result of results) {
            if (result.Alternatives && result.Alternatives.length > 0) {
              const alternative = result.Alternatives[0];

              if (alternative.Transcript) {
                const transcribeResult: TranscribeResult = {
                  transcript: alternative.Transcript,
                  isPartial: result.IsPartial || false,
                  confidence: alternative.Confidence || 0.0,
                };

                // 짧은 구간으로 나누기 위해 partial이 아닌 결과도 즉시 전송
                if (
                  !transcribeResult.isPartial ||
                  transcribeResult.transcript.length > 10
                ) {
                  this.emitTranscribeResult(socketId, transcribeResult);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Transcript stream processing error:", error);
    }
  }

  private emitTranscribeResult(socketId: string, result: TranscribeResult) {
    if (this.socketCallback) {
      this.socketCallback(socketId, result);
    }
  }

  async processAudioChunk(socketId: string, audioData: any): Promise<void> {
    const stream = this.activeStreams.get(socketId);
    if (!stream || !stream.isActive) {
      return;
    }

    try {
      const audioBuffer = this.convertAudioData(audioData);
      if (audioBuffer.length > 0) {
        stream.audioStream.push(audioBuffer);
      }
    } catch (error) {
      console.error("Audio processing error:", error);
    }
  }

  private convertAudioData(audioData: any): Buffer {
    if (audioData instanceof ArrayBuffer) {
      return Buffer.from(audioData);
    } else if (Buffer.isBuffer(audioData)) {
      return audioData;
    } else if (typeof audioData === "string") {
      return Buffer.from(audioData, "base64");
    } else {
      return Buffer.from(audioData);
    }
  }

  private async *createAudioGenerator(
    audioStream: Readable
  ): AsyncGenerator<AudioStream, void, unknown> {
    for await (const chunk of audioStream) {
      yield {
        AudioEvent: {
          AudioChunk: chunk,
        },
      };
    }
  }

  async stopTranscription(socketId: string): Promise<TranscribeResponse> {
    const stream = this.activeStreams.get(socketId);
    if (stream) {
      stream.isActive = false;
      stream.abortController.abort();
      stream.audioStream.push(null); // End stream
      this.activeStreams.delete(socketId);
      console.log(`AWS Transcribe session stopped: ${stream.streamName}`);
      return { status: "stopped" };
    }
    return { status: "not_found" };
  }
}

export default TranscribeService;
