import React, { FC, createContext, useEffect, useState } from 'react';

export const MediaDeviceListContext = createContext<MediaDeviceInfo[]>([]);

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

    return <MediaDeviceListContext.Provider value={devices}>
        {children}
    </MediaDeviceListContext.Provider>;
}

export default MediaDeviceListProvider;
