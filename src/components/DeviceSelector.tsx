import React, { Component } from 'react';
import { MediaDeviceListContext } from './MediaDeviceListProvider';

type State = {
    selectedDevice: string;
};

type Props = {
    deviceType: MediaDeviceKind;
    selectDevice(deviceId: string): void;
};

function getDeviceNameByKind(deviceKind: MediaDeviceKind): string {
    switch(deviceKind) {
        case 'audioinput': return 'Microphone';
        case 'audiooutput': return 'Speakers';
        case 'videoinput': return 'Camera';
    }
}

function getDeviceName(device: MediaDeviceInfo, i: number): string {
    if (device.deviceId === 'default' && !device.label) {
        return 'Default ' + getDeviceNameByKind(device.kind); 
    }
    return device.label || getDeviceNameByKind(device.kind) + ' ' + String(i+1);
}

class DeviceSelector extends Component<Props, State> {
    state: State = {
        selectedDevice: '',
    };

    static contextType = MediaDeviceListContext;
    context!: React.ContextType<typeof MediaDeviceListContext>;
    
    render() {
        const { deviceType, selectDevice } = this.props;
        const devices = this.context.filter(device => device.kind === deviceType);

        return <div className='media-selector'>
            <label>{getDeviceNameByKind(deviceType)}:
                <select onChange={e => selectDevice(e.target.value)}>
                    {devices.map((device, i) => 
                        <option key={device.deviceId} value={device.deviceId}>
                            {getDeviceName(device, i)}
                        </option>
                    )}
                </select>
            </label>
        </div>;
    }
}

export default DeviceSelector;
