import React, { useMemo, useRef, useState } from "react";

function formatTime(totalSeconds) {
  const seconds = Math.floor(totalSeconds || 0);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

const MusicSection = ({ playlist = [] }) => {
  const audioRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);

  const song = useMemo(() => playlist[currentSong], [playlist, currentSong]);

  // Empty state
  if (!playlist || playlist.length === 0) {
    return (
      <section id="music" className="section active">
        <div className="music-card">
          <h2 className="section-title">Our Love Song</h2>
          <div className="empty-state">
            <div className="empty-state-icon">🎵</div>
            <p className="empty-state-text">No songs in the playlist yet</p>
            <p className="empty-state-hint">
              The birthday playlist will be available soon
            </p>
          </div>
        </div>
      </section>
    );
  }

  const playSong = async (index = currentSong) => {
    if (!audioRef.current || !playlist.length) return;
    const nextSong = playlist[index];
    if (!nextSong) return;
    audioRef.current.src = nextSong.url;
    audioRef.current.volume = volume / 100;
    await audioRef.current.play();
    setIsPlaying(true);
  };

  const togglePlay = async () => {
    if (!audioRef.current || !playlist.length) return;
    if (!audioRef.current.src) {
      await playSong(currentSong);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const nextSong = async () => {
    if (!playlist.length) return;
    const nextIndex = (currentSong + 1) % playlist.length;
    setCurrentSong(nextIndex);
    setCurrentTime(0);
    if (isPlaying) await playSong(nextIndex);
  };

  const prevSong = async () => {
    if (!playlist.length) return;
    const prevIndex = (currentSong - 1 + playlist.length) % playlist.length;
    setCurrentSong(prevIndex);
    setCurrentTime(0);
    if (isPlaying) await playSong(prevIndex);
  };

  const onSeek = (event) => {
    const value = Number(event.target.value);
    setCurrentTime(value);
    if (audioRef.current) audioRef.current.currentTime = value;
  };

  const onVolumeChange = (event) => {
    const value = Number(event.target.value);
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value / 100;
  };

  const selectSong = async (index) => {
    setCurrentSong(index);
    setCurrentTime(0);
    if (isPlaying) await playSong(index);
  };

  return (
    <section id="music" className="section active">
      <div className="music-card">
        <h2 className="section-title">Our Love Song</h2>
        <audio
          ref={audioRef}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onTimeUpdate={() =>
            setCurrentTime(audioRef.current?.currentTime || 0)
          }
          onEnded={nextSong}
        />

        <div className="music-player">
          <div className="album-art">
            <div className="album-placeholder">MUSIC</div>
          </div>

          <div className="song-info">
            <h3>{song?.name || "Love Song"}</h3>
            <p>{song?.artist || "Playing your favorite music"}</p>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
            <input
              type="range"
              className="progress-slider"
              min="0"
              max={Math.floor(duration || song?.duration || 0)}
              value={Math.floor(currentTime)}
              onChange={onSeek}
            />
          </div>

          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || song?.duration || 0)}</span>
          </div>

          <div className="controls">
            <button type="button" className="control-btn" onClick={prevSong}>
              ⏮
            </button>
            <button
              type="button"
              className="control-btn play-btn"
              onClick={togglePlay}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button type="button" className="control-btn" onClick={nextSong}>
              ⏭
            </button>
          </div>

          <div className="volume-control">
            <span>Low</span>
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="100"
              value={volume}
              onChange={onVolumeChange}
            />
            <span>High</span>
          </div>
        </div>

        <div className="playlist">
          <h3>Romantic Playlist</h3>
          <div className="playlist-items">
            {playlist.map((item, index) => (
              <button
                key={`${item.name}-${index}`}
                type="button"
                className="playlist-item"
                onClick={() => selectSong(index)}
                style={{
                  background:
                    currentSong === index
                      ? "rgba(255, 107, 157, 0.3)"
                      : "rgba(255, 240, 245, 0.8)",
                }}
              >
                <span className="song-number">{index + 1}</span>
                <span className="song-title">{item.name}</span>
                <span className="song-duration">
                  {formatTime(item.duration)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MusicSection;
