// Helper functions for sound effects and haptic feedback

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window !== 'undefined' && !audioContext && (window.AudioContext || (window as any).webkitAudioContext)) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
            return null;
        }
    }
    return audioContext;
};

export const playSound = (type: 'start' | 'stop' | 'send') => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0, ctx.currentTime);

    switch (type) {
        case 'start':
            gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
            oscillator.frequency.setValueAtTime(400, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            break;
        case 'stop':
             gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            break;
        case 'send':
            gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
            oscillator.frequency.setValueAtTime(600, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
            break;
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
};


let hapticInterval: number | null = null;

export const startHapticPulse = () => {
    if ('vibrate' in navigator) {
        if (hapticInterval) clearInterval(hapticInterval);
        hapticInterval = window.setInterval(() => {
            navigator.vibrate([50, 100, 50]);
        }, 2000);
    }
};

export const stopHapticPulse = () => {
    if (hapticInterval) {
        clearInterval(hapticInterval);
        hapticInterval = null;
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }
    }
};