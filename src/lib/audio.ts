export const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator and gain node
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Notification chime sound (subtle and engaging)
    oscillator.type = 'sine';
    
    // Play slightly high pitched chime
    const now = audioCtx.currentTime;
    
    // Frequencies for a pleasant "ding-ding" (perfect fourth/fifth)
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.setValueAtTime(659.25, now + 0.15); // E5
    
    // Envelope to make it subtle and plucky
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Decay
    
    oscillator.start(now);
    oscillator.stop(now + 0.6);
  } catch (e) {
    console.error('Audio playback failed', e);
  }
};
