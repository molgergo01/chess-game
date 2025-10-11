'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { formatTime } from '@/lib/utils/time.utils';

interface TimerProps {
    defaultTime: number;
    className?: string;
    onTick?: (timeLeft: number) => void;
}

export interface TimerRef {
    start: () => void;
    stop: () => void;
    isRunning: boolean;
    timeLeft: number;
    setTimeLeft: (time: number) => void;
}

interface TimeDisplayProps {
    timeLeft: number;
    className?: string;
    'data-cy'?: string;
}

export function TimeDisplay({ timeLeft, className, 'data-cy': dataCy }: TimeDisplayProps) {
    return (
        <div className={`flex items-center justify-center ${className || ''}`} data-cy={dataCy}>
            <div className={`text-2xl`}>{formatTime(timeLeft)}</div>
        </div>
    );
}

const Timer = forwardRef<TimerRef, TimerProps>(({ defaultTime, onTick }, ref) => {
    const [timeLeft, setTimeLeft] = useState(defaultTime);
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onTickRef = useRef(onTick);

    useEffect(() => {
        onTickRef.current = onTick;
    }, [onTick]);

    useEffect(() => {
        onTickRef.current?.(timeLeft);
    }, [timeLeft]);

    useImperativeHandle(ref, () => ({
        start: () => {
            setIsRunning((prev) => {
                if (!prev) {
                    setLastUpdateTime(Date.now());
                    return true;
                }
                return prev;
            });
        },
        stop: () => {
            setIsRunning(false);
        },
        isRunning,
        timeLeft,
        setTimeLeft: (time: number) => {
            setTimeLeft(time);
            setLastUpdateTime(Date.now());
        }
    }));

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prevTime) => {
                    const currentTime = Date.now();
                    if (prevTime <= 0) {
                        setIsRunning(false);
                        return 0;
                    }

                    const elapsedTime = lastUpdateTime === 0 ? 200 : currentTime - lastUpdateTime;
                    setLastUpdateTime(Date.now());

                    return prevTime - elapsedTime;
                });
            }, 200);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, lastUpdateTime, timeLeft]);

    return null;
});

Timer.displayName = 'Timer';

export default Timer;
