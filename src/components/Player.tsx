import React, { Component, createRef, RefObject, Fragment } from 'react';
import DeviceSelector from './DeviceSelector';
import MediaDeviceListProvider from './MediaDeviceListProvider';


type State = {
    currentMic: string;
    currentSpeakers: string;
    currentCamera: string;
    isPiP: boolean;
};

declare global {
    interface MediaDevices {
        getDisplayMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
    }

    interface HTMLVideoElement {
        requestPictureInPicture(): Promise<void>;
    }

    interface Document {
        pictureInPictureEnabled: boolean;
        exitPictureInPicture(): Promise<void>;
    }
}

const CAMERA = 'CAMERA';
const DESKTOP = 'DESKTOP';

function makeConstraint(deviceId: string) {
    return !deviceId ? true : { deviceId };
}

class Player extends Component<{}, State> {
    state: State = {
        currentMic: '',
        currentSpeakers: '',
        currentCamera: '',
        isPiP: false,
    };

    videoElement: RefObject<HTMLVideoElement> = createRef();

    stream?: MediaStream;

    acquireStream = (type: typeof CAMERA | typeof DESKTOP = CAMERA) => {
        const getStream = type === CAMERA 
            ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
            : navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
        const constraints: MediaStreamConstraints = type === CAMERA 
            ? { audio: makeConstraint(this.state.currentMic), video: makeConstraint(this.state.currentCamera) }
            : { video: true };
        getStream(constraints).then(
            (stream: MediaStream) => {
                this.stream = stream;
                const videoEl = this.videoElement.current;
                if (videoEl) {
                    videoEl.srcObject = stream;
                    if (videoEl.paused) {
                        videoEl.play().catch((e: DOMException) => {
                            console.log(e.name, e.message);
                        })
                    }
                }
            }
        )
    };

    revokeVideo = () => {
        const videoEl = this.videoElement.current as HTMLVideoElement;
        if(!videoEl.paused) {
            videoEl.pause();
        }
        videoEl.srcObject = null; 
        if  (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = undefined;
        }
    };

    setMic = (currentMic: string) => {
        this.setState({ currentMic });
    };

    setSpeakers = (currentSpeakers: string) => {
        this.setState({ currentSpeakers });
    };

    setCamera = (currentCamera: string) => {
        this.setState({ currentCamera });
    };

    togglePiP = () => {
        const { isPiP } = this.state;
        if (isPiP) {
            document.exitPictureInPicture();
        } else {
            this.videoElement.current!.requestPictureInPicture();
        }
        this.setState({ isPiP: !isPiP });
    }

    render() {
        const pipEnabled = 'pictureInPictureEnabled' in document;
        const { isPiP } = this.state;

        return <Fragment>
            {pipEnabled && 
            <button onClick={this.togglePiP}>
                {isPiP ? 'Exit PiP' : 'Enter PiP'}
            </button>}
            <MediaDeviceListProvider>
                <DeviceSelector deviceType='audioinput' selectDevice={this.setMic}/>
                <DeviceSelector deviceType='audiooutput' selectDevice={this.setSpeakers}/>
                <DeviceSelector deviceType='videoinput' selectDevice={this.setCamera}/>
            </MediaDeviceListProvider>
            <div className='video-player'>
            <button onClick={() => this.acquireStream()}>Get video</button>
            <button onClick={() => this.acquireStream(DESKTOP)}>Get desktop</button>
            <button onClick={this.revokeVideo}>Revoke Video</button>
        </div>
        <video ref={this.videoElement} autoPlay muted></video>
        </Fragment>;
    }
}

export default Player;
