'use client';
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant } from 'livekit-client';

interface StreamPlayerProps {
  wsUrl?: string;
  token?: string;
  playbackUrl?: string; // room name (legacy prop)
  title?: string;
}

export default function StreamPlayer({ wsUrl, token, playbackUrl, title }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!wsUrl || !token) {
      setError('Waiting for stream connection...');
      return;
    }

    const room = new Room();
    roomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Video && videoRef.current) {
        track.attach(videoRef.current);
      }
      if (track.kind === Track.Kind.Audio && audioRef.current) {
        track.attach(audioRef.current);
      }
    });

    room.on(RoomEvent.Connected, () => setConnected(true));
    room.on(RoomEvent.Disconnected, () => setConnected(false));

    room.connect(wsUrl, token).catch((err: any) => {
      setError('Failed to connect to stream');
      console.error('LiveKit connect error:', err);
    });

    return () => {
      room.disconnect();
      roomRef.current = null;
    };
  }, [wsUrl, token]);

  return (
    <div className="relative bg-black aspect-video rounded-xl overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <audio ref={audioRef} autoPlay />
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            {error ? (
              <p className="text-gray-400 text-sm">{error}</p>
            ) : (
              <>
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white text-sm">Connecting to stream...</p>
              </>
            )}
          </div>
        </div>
      )}
      {connected && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
        </div>
      )}
      {title && connected && (
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 text-white text-xs rounded-full">
          {title}
        </div>
      )}
    </div>
  );
}
