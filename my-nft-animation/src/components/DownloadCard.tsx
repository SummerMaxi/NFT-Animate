export const DownloadCard = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-6">Download</h2>
      <ScreenRecorder containerRef={containerRef} />
    </div>
  );
}; 