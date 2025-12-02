import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { recordAttendance } from '../lib/attendanceService';
import { toast } from 'react-hot-toast';

interface AttendanceCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    userRole: string;
    eventType: 'login' | 'logout';
    onSuccess?: () => void;
}

export const AttendanceCapture: React.FC<AttendanceCaptureProps> = ({
    isOpen,
    onClose,
    userId,
    userName,
    userRole,
    eventType,
    onSuccess
}) => {
    const webcamRef = useRef<Webcam>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cameraError, setCameraError] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [ipAddress, setIpAddress] = useState<string>('');

    useEffect(() => {
        const fetchIp = async () => {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                setIpAddress(data.ip);
            } catch (error) {
                console.error('Error fetching IP:', error);
            }
        };
        fetchIp();
    }, []);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: 'user'
    };

    const handleCapture = useCallback(() => {
        setIsCapturing(true);
        setCountdown(3);

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownInterval);

                    // Capture the image
                    if (webcamRef.current) {
                        const imageSrc = webcamRef.current.getScreenshot();
                        if (imageSrc) {
                            setCapturedImage(imageSrc);
                            toast.success('Image captured successfully!');
                        } else {
                            toast.error('Failed to capture image. Please try again.');
                        }
                    }

                    setIsCapturing(false);
                    setCountdown(null);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleRetake = useCallback(() => {
        setCapturedImage(null);
        setCameraError(false);
    }, []);

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Ensure we have an IP address before submitting
            let finalIpAddress = ipAddress;
            if (!finalIpAddress) {
                try {
                    const response = await fetch('https://api.ipify.org?format=json');
                    const data = await response.json();
                    finalIpAddress = data.ip;
                    setIpAddress(finalIpAddress);
                } catch (error) {
                    console.error('Error fetching IP on submit:', error);
                    // Continue without IP if fetch fails
                    finalIpAddress = 'Unknown';
                }
            }

            const result = await recordAttendance(
                userId,
                userName,
                userRole,
                eventType,
                capturedImage || undefined,
                finalIpAddress
            );

            if (result.success) {
                toast.success(`${eventType === 'login' ? 'Login' : 'Logout'} recorded successfully!`);
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.error || 'Failed to record attendance');
            }
        } catch (error: any) {
            console.error('Error submitting attendance:', error);
            toast.error(error.message || 'Failed to record attendance');
        } finally {
            setIsSubmitting(false);
        }
    };



    const handleUserMediaError = useCallback(() => {
        setCameraError(true);
        toast.error('Unable to access camera. Please grant camera permissions.');
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {eventType === 'login' ? 'Login' : 'Logout'} Attendance
                            </h2>
                            <p className="text-blue-100 text-sm">
                                Capture your image for attendance verification
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {cameraError ? (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
                            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-red-900 mb-2">
                                Camera Access Denied
                            </h3>
                            <p className="text-red-700 mb-4">
                                Unable to access your camera. Please grant camera permissions in your browser settings and try again.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={handleRetake}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Retry
                                </button>

                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Camera/Preview Box */}
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                {capturedImage ? (
                                    <img
                                        src={capturedImage}
                                        alt="Captured"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={videoConstraints}
                                        onUserMediaError={handleUserMediaError}
                                        className="w-full h-full object-cover"
                                    />
                                )}

                                {/* Countdown Overlay */}
                                {countdown !== null && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <div className="text-white text-8xl font-bold animate-pulse">
                                            {countdown}
                                        </div>
                                    </div>
                                )}

                                {/* Capture Guide Overlay */}
                                {!capturedImage && countdown === null && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="border-4 border-white border-opacity-50 rounded-full w-64 h-64"></div>
                                        </div>
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <p className="text-white text-sm bg-black bg-opacity-50 inline-block px-4 py-2 rounded-full">
                                                Position your face within the circle
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Success Indicator */}
                                {capturedImage && (
                                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-sm font-medium">Captured</span>
                                    </div>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-900 font-medium">
                                            {eventType === 'login' ? 'Welcome back!' : 'See you next time!'}
                                        </p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Your attendance image will be securely stored for reporting purposes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end">
                                {capturedImage ? (
                                    <>
                                        <button
                                            onClick={handleRetake}
                                            disabled={isSubmitting}
                                            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Retake
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center gap-2 disabled:opacity-50 shadow-lg"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            {isSubmitting ? 'Processing...' : 'Submit Attendance'}
                                        </button>
                                    </>
                                ) : (
                                    <>

                                        <button
                                            onClick={handleCapture}
                                            disabled={isCapturing}
                                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center gap-2 disabled:opacity-50 shadow-lg"
                                        >
                                            <Camera className="h-4 w-4" />
                                            {isCapturing ? 'Capturing...' : 'Capture Image'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
