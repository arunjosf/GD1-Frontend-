import React from 'react';
import { useCall } from '../context/CallContext';
import { Phone, PhoneOff, MicOff, Maximize2, Minimize2, User } from 'lucide-react';

export default function CallOverlay() {
    const { 
        isActive, 
        isReceiving, 
        isInCall, 
        callerName, 
        callDuration, 
        isMinimized, 
        toggleMinimize, 
        answerCall, 
        endCall 
    } = useCall();

    if (!isActive) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-[9999] bg-green-600 rounded-full shadow-2xl flex items-center p-2 pr-4 gap-3 cursor-pointer hover:bg-green-700 transition-colors" onClick={toggleMinimize}>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                    <Phone className="text-white" size={20} />
                </div>
                <div className="text-white">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider text-left">Ongoing Call</p>
                    <p className="text-sm font-bold">{formatTime(callDuration)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0b141a] flex flex-col items-center justify-center animate-fade-in">
            {/* Top Bar */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-center">
                <button onClick={toggleMinimize} className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Minimize2 size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center gap-6 mt-[-10vh]">
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-700 shadow-2xl">
                    <User size={64} className="text-gray-500" />
                </div>
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-2">{callerName}</h2>
                    <p className="text-gray-400 text-lg">
                        {isReceiving ? "Incoming Call..." : isInCall ? formatTime(callDuration) : "Ringing..."}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-16 flex gap-6">
                {isReceiving ? (
                    <>
                        <button onClick={endCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110">
                            <PhoneOff size={28} />
                        </button>
                        <button onClick={answerCall} className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110 animate-bounce">
                            <Phone size={28} />
                        </button>
                    </>
                ) : (
                    <>
                        <button className="w-16 h-16 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white shadow-xl transition-colors">
                            <MicOff size={24} />
                        </button>
                        <button onClick={endCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110">
                            <PhoneOff size={28} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
