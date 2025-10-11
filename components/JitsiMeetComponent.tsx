import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const JitsiMeetComponent = ({ roomName, displayName }) => {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (window.JitsiMeetExternalAPI && containerRef.current) {
      const domain = "meet.jit.si";
      const options = {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName },
      };
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    }
    return () => apiRef.current?.dispose();
  }, [roomName, displayName]);

  return (
    <div
  ref={containerRef}
  className="w-full h-full rounded-2xl border border-[#4a9951]/40 shadow-[0_0_25px_rgba(46,125,50,0.3)] bg-white"
/>
  );
};

export default JitsiMeetComponent;
