let RecordRTC: any = null;
let RecordRTCPromisesHandler: any = null;

if (typeof window !== 'undefined') {
  import('recordrtc').then((recordrtc) => {
    RecordRTC = recordrtc.default || recordrtc;
    RecordRTCPromisesHandler = recordrtc.RecordRTCPromisesHandler;
  });
}

export { RecordRTC, RecordRTCPromisesHandler }; 