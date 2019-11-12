import React, { FC, createContext, useEffect, useState, useReducer } from 'react';

export const MediaDeviceListContext = createContext<MediaDeviceInfo[]>([]);

type EmptyFn = () => void;

const deviceRequestEffect = (deviceType: 'camera' | 'microphone', forceDeviceRequest: EmptyFn): EmptyFn =>  {
    let mediaPermissions: PermissionStatus | null = null;
    navigator.permissions.query({ name: deviceType }).then(result => {
        mediaPermissions = result;
        if (result.state !== 'granted') {
            result.onchange = () => {
                if (result.state === 'granted') {
                    forceDeviceRequest();
                }
            };
        }
    });

    return () => {
        if (mediaPermissions) {
            mediaPermissions.onchange = null;
            mediaPermissions = null;
        }
    };
};

const MediaDeviceListProvider: FC = ({ children }) => {
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            setDevices(devices);
            navigator.mediaDevices.ondevicechange = () => {
                navigator.mediaDevices.enumerateDevices().then(setDevices)
            };
        });

        return () => {
            navigator.mediaDevices.ondevicechange = null;
        }
    }, []);

    const [deviceRequestCounter, forceDeviceRequest] = useReducer<(s: number) => number>((state: number) => (state + 1), 0);

    useEffect(() => {
        if (deviceRequestCounter > 0) {
            navigator.mediaDevices.enumerateDevices().then(setDevices);
        }
    }, [deviceRequestCounter]);

    useEffect(() => deviceRequestEffect('camera', forceDeviceRequest as EmptyFn), []);
    useEffect(() => deviceRequestEffect('microphone', forceDeviceRequest as EmptyFn), []);

    return <MediaDeviceListContext.Provider value={devices}>
        {children}
    </MediaDeviceListContext.Provider>;
};

export default MediaDeviceListProvider;
