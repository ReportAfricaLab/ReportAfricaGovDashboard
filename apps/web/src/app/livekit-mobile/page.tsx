'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Room, RoomEvent, Track, createLocalTracks, RemoteTrack } from 'livekit-client';

function LiveKitMobileContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'viewer';
  const token = searchParams.get('token') || '';
  const wsUrl = searchParams.get('wsUrl') || '';

  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !wsUrl) {
      setError('Missing token or wsUrl');
      setStatus('error');
      return;
    }

    const room = new Room();
    roomRef.current = room;

    if (mode === 'viewer') {
      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
        }
        if (track.kind === Track.Kind.Audio) {
          const audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          track.attach(audioEl);
          document.body.appendChild(audioEl);
        }
      });

      room.on(RoomEvent.Connected, () => setStatus('connected'));
      room.on(RoomEvent.Disconnected, () => setStatus('error'));

      room.connect(wsUrl, token).catch(() => {
        setError('Failed to connect to stream');
        setStatus('error');
      });
    } else {
      room.connect(wsUrl, token).then(async () => {
        const tracks = await createLocalTracks({
          audio: true,
          video: { resolution: { width: 1280, height: 720 }, facingMode: 'environment' },
        });

        for (const track of tracks) {
          await room.localParticipant.publishTrack(track);
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
          }
        }
        setStatus('connected');
      }).catch(() => {
        setError('Failed to start broadcast');
        setStatus('error');
      });
    }

    return () => {
      room.disconnect();
      roomRef.current = null;
    };
  }, [token, wsUrl, mode]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', margin: 0, padding: 0, overflow: 'hidden' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={mode === 'broadcaster'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {status === 'connecting' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
          <p style={{ color: '#fff', fontSize: '14px' }}>
            {mode === 'broadcaster' ? 'Starting camera...' : 'Connecting to stream...'}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
          <p style={{ color: '#f87171', fontSize: '14px' }}>{error || 'Connection failed'}</p>
        </div>
      )}

      {status === 'connected' && (
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span style={{ backgroundColor: mode === 'broadcaster' ? '#dc2626' : '#059669', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
            {mode === 'broadcaster' ? '● LIVE' : '● WATCHING'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function LiveKitMobilePage() {
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#fff' }}>Loading...</p></div>}>
      <LiveKitMobileContent />
    </Suspense>
  );
}
