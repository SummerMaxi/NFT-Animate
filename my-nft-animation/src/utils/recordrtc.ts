import RecordRTC from 'recordrtc';

export const createRecorder = (stream: MediaStream, options: RecordRTC.Options) => {
  return new RecordRTC(stream, options);
}; 