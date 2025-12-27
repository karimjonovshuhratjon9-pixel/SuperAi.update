
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { MODELS, SYSTEM_INSTRUCTION } from '../constants';

const VoiceView: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const startVoiceMode = async () => {
    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Request audio with processing to improve input quality
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: MODELS.VOICE,
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              setTranscription(prev => prev + ' ' + msg.serverContent?.outputTranscription?.text);
            }
            
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
              sourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error(e),
          onclose: () => {
            setIsConnected(false);
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION + " Ovozli muloqot rejimidasan. Qisqa va lo'nda javob ber. Ovozli muloqot juda tez va aniq bo'lishi kerak.",
          speechConfig: {
            // Using Zephyr as it's generally clearer than Kore
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const stopVoiceMode = () => {
    sessionRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    setIsConnected(false);
    setTranscription('');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
      <div className="relative">
        <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${
          isConnected ? (isSpeaking ? 'bg-blue-600 scale-110 shadow-[0_0_80px_rgba(37,99,235,0.7)]' : 'bg-blue-600/40 scale-100 shadow-[0_0_40px_rgba(37,99,235,0.2)]') : 'bg-slate-800'
        }`}>
           {isConnected ? (
             <div className="flex space-x-1.5 items-center">
                {[1,2,3,4,5,6,7].map(i => (
                  <div key={i} className={`w-1.5 bg-white rounded-full transition-all duration-300 ${
                    isSpeaking ? 'animate-bounce h-16' : 'h-6 opacity-40'
                  }`} style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
             </div>
           ) : (
             <svg className="w-20 h-20 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeWidth="1.5"/></svg>
           )}
        </div>
      </div>

      <div className="max-w-lg space-y-4">
        <h2 className="text-3xl font-bold">{isConnected ? 'Sizni eshityapman...' : 'Kristaldek tiniq ovozli muloqot'}</h2>
        <p className="text-slate-400">
          {isConnected 
            ? 'SuperAI bilan jonli muloqot. Iltimos, gapiring.' 
            : 'Gemini 3 texnologiyasi asosida ultra-tezkor va aniq ovozli muloqot. Chatgptdan ancha tez va tiniq.'}
        </p>
        
        {transcription && (
          <div className="p-5 glass rounded-2xl text-base italic text-blue-100 max-h-40 overflow-y-auto border border-blue-500/20 shadow-inner">
             "{transcription}"
          </div>
        )}
      </div>

      <button
        onClick={isConnected ? stopVoiceMode : startVoiceMode}
        disabled={isConnecting}
        className={`px-16 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all active:scale-95 transform hover:-translate-y-1 ${
          isConnected 
            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/40'
        }`}
      >
        {isConnecting ? 'Ulanmoqda...' : (isConnected ? 'To\'xtatish' : 'Muloqotni boshlash')}
      </button>

      <div className="flex space-x-8 text-xs text-slate-500 uppercase tracking-widest font-semibold">
         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Ultra Low Latency</span>
         <span>Uzbek/Russian/English</span>
         <span>Zephyr HD Voice</span>
      </div>
    </div>
  );
};

export default VoiceView;
