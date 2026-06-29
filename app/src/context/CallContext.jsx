import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { getToken } from '../api/auth';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
    const { user } = useAuth();
    const [callState, setCallState] = useState({
        isActive: false,
        isReceiving: false,
        isInCall: false,
        callerId: null,
        callerName: 'Unknown',
        referenceId: null,
        category: 'garage',
        isMinimized: false
    });

    const [remoteStream, setRemoteStream] = useState(null);
    const [callDuration, setCallDuration] = useState(0);

    const connectionRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteAudioRef = useRef(new Audio());
    const durationIntervalRef = useRef(null);

    // Initialize Global SignalR Connection for Calls
    useEffect(() => {
        const token = getToken('AccessToken');
        if (!token) return;

        const connectSignalR = async () => {
            const connection = new signalR.HubConnectionBuilder()
                .withUrl("https://localhost:7108/hubs/chat", { accessTokenFactory: () => token })
                .withAutomaticReconnect()
                .build();

            connection.on("ReceiveWebRTCSignal", async (signalPayload) => {
                const signal = JSON.parse(signalPayload);
                if (signal.type === 'offer') {
                    handleReceiveOffer(signal.offer, signal.referenceId, signal.category, signal.callerName);
                } else if (signal.type === 'answer') {
                    if (peerConnectionRef.current) {
                        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.answer));
                    }
                } else if (signal.type === 'ice-candidate') {
                    if (peerConnectionRef.current) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    }
                } else if (signal.type === 'end-call') {
                    handleRemoteEndCall();
                }
            });

            try {
                await connection.start();
                connectionRef.current = connection;
            } catch (err) {
                console.error("Global Call SignalR Connection Error: ", err);
            }
        };

        connectSignalR();

        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
            }
            cleanupCall();
        };
    }, [user]);

    // Listen to global events to start a call
    useEffect(() => {
        const handleStartGlobalCall = (e) => {
            const { bookingId, category = 'garage', receiverName } = e.detail;
            startCall(bookingId, category, receiverName);
        };
        window.addEventListener('START_GLOBAL_CALL', handleStartGlobalCall);
        return () => window.removeEventListener('START_GLOBAL_CALL', handleStartGlobalCall);
    }, []);

    const setupWebRTC = async (referenceId, category) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && connectionRef.current) {
                const signal = JSON.stringify({ type: 'ice-candidate', candidate: event.candidate, referenceId, category });
                connectionRef.current.invoke("SendWebRTCSignal", category, Number(referenceId), signal);
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            remoteAudioRef.current.srcObject = event.streams[0];
            remoteAudioRef.current.play().catch(e => console.error("Audio play error", e));
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        } catch (err) {
            toast.error("Microphone access denied or not available.");
            throw err;
        }

        peerConnectionRef.current = pc;
        return pc;
    };

    const startCall = async (referenceId, category, receiverName) => {
        if (!connectionRef.current) return toast.error("Call server not connected.");
        
        try {
            setCallState({
                isActive: true,
                isReceiving: false,
                isInCall: true,
                callerName: receiverName || 'User',
                referenceId,
                category,
                isMinimized: false
            });
            startDurationTimer();

            const pc = await setupWebRTC(referenceId, category);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            const signal = JSON.stringify({ type: 'offer', offer, referenceId, category, callerName: "Incoming Call" }); // Sender's name could be passed if needed
            await connectionRef.current.invoke("SendWebRTCSignal", category, Number(referenceId), signal);
            
        } catch (error) {
            console.error(error);
            endCall();
        }
    };

    const handleReceiveOffer = async (offer, referenceId, category, callerName) => {
        if (callState.isActive) return; // Busy
        
        setCallState({
            isActive: true,
            isReceiving: true,
            isInCall: false,
            callerName: callerName || 'Incoming Caller',
            referenceId,
            category,
            isMinimized: false
        });

        // Store offer to be answered later
        peerConnectionRef.current = { pendingOffer: offer }; 
    };

    const answerCall = async () => {
        const { pendingOffer } = peerConnectionRef.current || {};
        if (!pendingOffer) return;

        try {
            const pc = await setupWebRTC(callState.referenceId, callState.category);
            await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const signal = JSON.stringify({ type: 'answer', answer, referenceId: callState.referenceId, category: callState.category });
            await connectionRef.current.invoke("SendWebRTCSignal", callState.category, Number(callState.referenceId), signal);

            setCallState(prev => ({ ...prev, isReceiving: false, isInCall: true }));
            startDurationTimer();
        } catch (error) {
            console.error(error);
            endCall();
        }
    };

    const endCall = async () => {
        if (callState.isActive && connectionRef.current && callState.referenceId) {
            const signal = JSON.stringify({ type: 'end-call', referenceId: callState.referenceId, category: callState.category });
            await connectionRef.current.invoke("SendWebRTCSignal", callState.category, Number(callState.referenceId), signal).catch(() => {});
        }
        cleanupCall();
    };

    const handleRemoteEndCall = () => {
        toast("Call ended.");
        cleanupCall();
    };

    const cleanupCall = () => {
        if (peerConnectionRef.current && peerConnectionRef.current.close) {
            peerConnectionRef.current.close();
        }
        peerConnectionRef.current = null;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }

        stopDurationTimer();

        setCallState({
            isActive: false,
            isReceiving: false,
            isInCall: false,
            callerId: null,
            callerName: 'Unknown',
            referenceId: null,
            category: 'garage',
            isMinimized: false
        });
        setRemoteStream(null);
    };

    const startDurationTimer = () => {
        setCallDuration(0);
        durationIntervalRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const stopDurationTimer = () => {
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
    };

    const toggleMinimize = () => {
        setCallState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
    };

    return (
        <CallContext.Provider value={{
            ...callState,
            callDuration,
            startCall,
            answerCall,
            endCall,
            toggleMinimize
        }}>
            {children}
        </CallContext.Provider>
    );
};
