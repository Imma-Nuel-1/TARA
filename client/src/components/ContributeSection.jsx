import React, { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const RELATIONSHIP_OPTIONS = [
  "Friend",
  "Sister",
  "Brother",
  "Close Friend",
  "Cousin",
  "Coursemate",
  "Family",
  "Other",
];

function detectMediaTypeFromData(dataUrl) {
  if (!dataUrl) return "image";
  return dataUrl.startsWith("data:video/") ? "video" : "image";
}

const ContributeSection = ({ onContributionSaved }) => {
  const [form, setForm] = useState({
    name: "",
    role: "Friend",
    otherRole: "",
    message: "",
    caption: "",
    avatarFileData: null,
    avatarFileName: "",
    mediaFiles: [], // { fileData, fileName, mediaType }
  });
  const [recordedVideo, setRecordedVideo] = useState(null); // { fileData, fileName, mediaType }

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [cameraError, setCameraError] = useState(null); // for retry UI
  const [loading, setLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const previewVideoRef = useRef(null);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.role) e.role = true;
    if (form.role === "Other" && !form.otherRole.trim()) e.otherRole = true;
    // require avatar
    if (!form.avatarFileData) e.avatar = true;

    // require either a message or a recorded camera video
    const hasRecordedVideo = Boolean(recordedVideo);
    if (!form.message.trim() && !hasRecordedVideo) e.content = true;
    if (form.mediaFiles.length === 0) e.memories = true;
    // if media available require caption
    if (form.mediaFiles.length > 0 && !form.caption.trim()) e.caption = true;
    return e;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((p) => ({ ...p, avatarFileData: reader.result, avatarFileName: file.name }));
      setErrors((prev) => ({ ...prev, avatar: false }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const toAdd = [];
    let done = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        toAdd.push({ fileData: reader.result, fileName: file.name, mediaType: detectMediaTypeFromData(reader.result), recorded: false });
        done++;
        if (done === files.length) {
          setForm((p) => ({ ...p, mediaFiles: [...p.mediaFiles, ...toAdd] }));
          setErrors((prev) => ({ ...prev, content: false }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (idx) => {
    setForm((p) => ({ ...p, mediaFiles: p.mediaFiles.filter((_, i) => i !== idx) }));
  };

  const startRecording = async () => {
    try {
      setStatus('Requesting camera access...');
      
      // Try with mobile-optimized constraints first
      let stream;
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: true,
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback to basic constraints if mobile-specific fails
        console.warn('Mobile constraints failed, trying basic constraints:', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      mediaStreamRef.current = stream;
      
      // Ensure video element is properly configured for mobile
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.muted = true;
        previewVideoRef.current.playsInline = true;
        previewVideoRef.current.setAttribute('playsinline', 'true');
        previewVideoRef.current.play().catch((e) => {
          console.error('Play failed:', e);
        });
      }

      recordedChunksRef.current = [];
      
      // Try VP9 first, fallback to VP8 for better compatibility
      let options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }

      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;
      
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };
      
      mr.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          try {
            if (previewVideoRef.current) {
              try { previewVideoRef.current.srcObject = null; } catch {
                // ignore clearing srcObject failures
              }
              previewVideoRef.current.src = reader.result;
              previewVideoRef.current.muted = true;
              previewVideoRef.current.playsInline = true;
              previewVideoRef.current.play().catch(() => {});
            }
          } catch {
            // ignore playback errors in preview mode
          }

          setRecordedVideo({ fileData: reader.result, fileName: `wish-${Date.now()}.webm`, mediaType: 'video' });
          setErrors((prev) => ({ ...prev, content: false }));
          setStatus('');
        };
        reader.readAsDataURL(blob);
        // stop tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };
      
      mr.start();
      setIsRecording(true);
      setCameraError(null); // clear any previous error
      setRecordingSeconds(0);
      setStatus('Recording started...');
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error('Camera error:', err);
      let errMsg = 'Camera access denied or unavailable';
      if (err.name === 'NotAllowedError') {
        errMsg = 'Camera permission denied. Tap "Retry Camera" below and allow access when prompted.';
      } else if (err.name === 'NotFoundError') {
        errMsg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errMsg = 'Camera is already in use by another app. Close other apps using the camera and try again.';
      } else if (err.message) {
        errMsg = `Camera error: ${err.message}`;
      }
      setCameraError(errMsg);
      setStatus(errMsg);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const uploadFile = async (fileData, fileName) => {
    const res = await fetch(`${API_BASE}/api/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: fileData, filename: fileName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    return json.url;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      setStatus('Please complete the required fields.');
      return;
    }

    setLoading(true);
    setStatus('Submitting...');

    try {
      let avatarUrl = '';
      if (form.avatarFileData) {
        setStatus('Uploading profile image...');
        avatarUrl = await uploadFile(form.avatarFileData, form.avatarFileName || `avatar-${Date.now()}`);
      }

      let recordedVideoUrl = '';
      if (recordedVideo) {
        setStatus('Uploading recorded video...');
        recordedVideoUrl = await uploadFile(recordedVideo.fileData, recordedVideo.fileName || `video-${Date.now()}.webm`);
      }

      if (recordedVideoUrl) {
        setStatus('Saving recorded video to gallery...');
        const recordedCaption = form.caption.trim() || form.message.trim() || `Recorded video from ${form.name}`;
        const res = await fetch(`${API_BASE}/api/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'image',
            title: `Recorded video from ${form.name}`,
            data: { url: recordedVideoUrl, caption: recordedCaption, mediaType: 'video' },
            createdBy: form.name,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save recorded video');
        onContributionSaved?.({
          type: 'image',
          galleryItem: { imageUrl: recordedVideoUrl, caption: recordedCaption, mediaType: 'video' },
        });
      }

      // Upload media files first
      const uploadedMedia = [];
      for (let i = 0; i < form.mediaFiles.length; i++) {
        const mf = form.mediaFiles[i];
        setStatus(`Uploading media ${i + 1} of ${form.mediaFiles.length}...`);
        const url = await uploadFile(mf.fileData, mf.fileName || `media-${Date.now()}`);
        uploadedMedia.push({ url, caption: form.caption, mediaType: mf.mediaType || detectMediaTypeFromData(mf.fileData) });
      }

      // Create message content or a video-backed message
      if (form.message.trim() || recordedVideoUrl) {
        setStatus('Saving message...');
        const resolvedRole = form.role === 'Other' ? form.otherRole.trim() : form.role;
        const res = await fetch(`${API_BASE}/api/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'message',
            title: recordedVideoUrl && !form.message.trim() ? `Video memory from ${form.name}` : `Message from ${form.name}`,
            data: { message: form.message, videoUrl: recordedVideoUrl, role: resolvedRole, avatarUrl },
            createdBy: form.name,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save message');
        onContributionSaved?.({ type: 'message', note: { name: form.name, role: resolvedRole, avatarUrl, message: form.message, videoUrl: recordedVideoUrl } });
      }

      // Save uploaded media entries
      for (let i = 0; i < uploadedMedia.length; i++) {
        const m = uploadedMedia[i];
        setStatus('Saving media entry...');
        const res = await fetch(`${API_BASE}/api/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: m.mediaType === 'video' ? 'image' : 'image',
            title: `Memory from ${form.name}`,
            data: { url: m.url, caption: m.caption, mediaType: m.mediaType },
            createdBy: form.name,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save media');
        onContributionSaved?.({ type: 'image', galleryItem: { imageUrl: m.url, caption: m.caption, mediaType: m.mediaType } });
      }

      setStatus('Successfully shared. Thank you!');
      setForm({ name: '', role: 'Friend', otherRole: '', message: '', caption: '', avatarFileData: null, avatarFileName: '', mediaFiles: [] });
      setRecordedVideo(null);
      setErrors({});
    } catch (err) {
      setStatus(`Failed: ${err.message || 'Connection error'}`);
    }

    setLoading(false);
  };

  return (
    <section id="contribute" className="section active">
      <div className="contribute-container">
        <h2 className="section-title">Share a Wish</h2>
        <p className="contribute-subtitle">Send a personal message or record/upload a photo or video wish.</p>

        <form className="contribute-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input id="name" type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} disabled={loading} className={errors.name ? 'input-error' : ''} required />
          </div>

          <div className="form-group">
            <label htmlFor="role">Relationship</label>
            <select id="role" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} disabled={loading} className={errors.role ? 'input-error' : ''} required>
              {RELATIONSHIP_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {form.role === 'Other' && (
            <div className="form-group">
              <label htmlFor="otherRole">Type your relationship</label>
              <input id="otherRole" type="text" value={form.otherRole} onChange={(e) => setForm((p) => ({ ...p, otherRole: e.target.value }))} disabled={loading} className={errors.otherRole ? 'input-error' : ''} required />
            </div>
          )}

            <div className="form-group">
              <label htmlFor="avatar">Profile Image</label>
              <input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} onClick={(e) => { e.target.value = ''; }} disabled={loading} className={errors.avatar ? 'input-error' : ''} required />
            </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="contribute-card" style={{ padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
              <h3 style={{ margin: '0 0 6px 0' }}>1) Write a Message</h3>
              <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>Type a short text message — saved as a message entry and shown under <strong>My Messages</strong>. This does not create a gallery item.</div>
              <div style={{ color: '#555', fontSize: 13, marginTop: 6 }}>
                <div>- Use this for personal notes or wishes.</div>
                <div>- Visible on the messages feed and linked to your profile image.</div>
              </div>
              <div className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea id="message" rows={4} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} disabled={loading} placeholder="Write your heartfelt wish here..." style={{ width: '100%' }}></textarea>
              </div>
            </div>

            <div className="contribute-card" style={{ padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
              <h3 style={{ margin: '0 0 6px 0' }}>2) Record a Video</h3>
              <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>Record a short video from your device camera. This is part of step 2, not step 3. If you don't type a message, the recorded video will become your message entry.</div>
              <div style={{ color: '#555', fontSize: 13, marginTop: 6 }}>
                <div>- Use this to capture a spoken wish or short clip.</div>
                <div>- The recorded clip stays in this section so step 3 remains only for Memories uploads.</div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={loading} aria-pressed={isRecording} style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    border: 'none',
                    background: isRecording ? '#d32f2f' : '#f0f0f0',
                    color: isRecording ? '#fff' : '#111',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isRecording ? 'Stop' : 'Record'}
                  </button>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 10, background: isRecording ? '#d32f2f' : '#ccc', display: 'inline-block' }} />
                    <span style={{ color: '#666', fontSize: 13 }}>{isRecording ? 'Recording' : 'Ready'}</span>
                  </div>
                  {cameraError && !isRecording && (
                    <button
                      type="button"
                      onClick={() => {
                        setCameraError(null);
                        startRecording();
                      }}
                      disabled={loading}
                      style={{
                        marginTop: 12,
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#ff9800',
                        color: '#fff',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Retry Camera
                    </button>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 6 }}>
                    {isRecording ? `Recording — ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}` : 'Preview / Playback'}
                  </div>
                  <video ref={previewVideoRef} style={{ width: '100%', borderRadius: 6, background: '#000' }} controls />
                  {recordedVideo && !isRecording && (
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: '#555', fontSize: 13 }}>Recorded clip ready for step 2 submission.</span>
                      <button type="button" onClick={() => setRecordedVideo(null)} disabled={loading}>Remove clip</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="contribute-card" style={{ padding: 12, borderRadius: 8, border: '1px solid #e6e6e6' }}>
              <h3 style={{ margin: '0 0 6px 0' }}>3) Add Memories (Photo / Video)</h3>
              <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>Upload photos or videos to be saved as <strong>Memories</strong> in the gallery. This section is required. Each uploaded memory creates a gallery item and requires a caption.</div>
              <div style={{ color: '#555', fontSize: 13, marginTop: 6 }}>
                <div>- Use this to contribute images or videos that should appear in the public gallery.</div>
                <div>- Captions are required for each memory so visitors have context.</div>
              </div>
              <div className="form-group">
                <label>Memories Upload</label>
                <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} onClick={(e) => { e.target.value = ''; }} disabled={loading} />
              </div>

              {errors.memories && <div className="form-error">Please add at least one memory upload.</div>}

              {form.mediaFiles.length > 0 && (
                <div className="file-list" style={{ marginTop: '0.5rem' }}>
                  {form.mediaFiles.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                      <span>{f.fileName || `memory-${idx + 1}`} ({f.mediaType})</span>
                      <button type="button" onClick={() => removeMedia(idx)} disabled={loading}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="caption">Caption (required for memories)</label>
            <input id="caption" type="text" value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} disabled={loading} className={errors.caption ? 'input-error' : ''} />
          </div>

          {errors.content && <div className="form-error">Please provide a message or upload a photo/video.</div>}

          <button type="submit" className="contribute-submit-btn" disabled={loading}>{loading ? 'Submitting...' : 'Share'}</button>
        </form>

        {status && <div className={`contribute-status ${status.toLowerCase().includes('successfully') ? 'success' : 'error'}`}>{status}</div>}
      </div>
    </section>
  );
};

export default ContributeSection;
