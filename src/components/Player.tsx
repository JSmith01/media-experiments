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
    interface PictureInPictureWindow extends EventTarget {
        readonly width: number;
        readonly height: number;
        onresize: EventHandlerNonNull;
    }

    interface MediaDevices {
        getDisplayMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
    }
    
    interface HTMLVideoElement {
        requestPictureInPicture(): Promise<PictureInPictureWindow>;
    }
    
    interface Document {
        pictureInPictureEnabled: boolean;
        exitPictureInPicture(): Promise<void>;
        pictureInPictureElement: HTMLVideoElement | null;
    }
}

const CAMERA = 'CAMERA';
const DESKTOP = 'DESKTOP';
type streamType = typeof CAMERA | typeof DESKTOP;

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
    
    recorder?: MediaRecorder;

    tieStreamWithRecording() {
        this.stream!.getTracks().forEach(track => {
            const recordingStreamEndHandler = () => {
                if (this.recorder && this.recorder.state === 'recording') {
                    this.recorder.stop();
                }
                track.removeEventListener('ended', recordingStreamEndHandler);
            };
            track.addEventListener('ended', recordingStreamEndHandler);
        });
    }

    startRecording() {
        if (!this.recorder || this.recorder.state === 'inactive') {
            this.recorder = new MediaRecorder(this.stream!);
            this.tieStreamWithRecording();
        }
        
        const recorderState = this.recorder.state;
        if (recorderState === 'inactive') {
            this.recorder.start();
        } else if (recorderState === 'paused') {
            this.recorder.resume();
        }
    };
        
    toggleRecording = () => {
        if (this.recorder && this.recorder.state === 'recording') {
            this.recorder.pause();
        } else if (this.stream) {
            this.startRecording();
        }
    };

    acquireStream = (type: streamType = CAMERA) => {
        const getStream = type === CAMERA 
            ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
            : navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
        const constraints: MediaStreamConstraints = type === CAMERA 
            ? { audio: makeConstraint(this.state.currentMic), video: makeConstraint(this.state.currentCamera) }
            : { video: true };

        getStream(constraints).then(
            (stream: MediaStream) => {
                this.handleNewStream(stream, type);
            }
        )
    };

    handleNewStream = (stream: MediaStream, streamType: streamType) => {
        this.stream = stream;
        
        const videoEl = this.videoElement.current;
        if (videoEl) {
            videoEl.srcObject = stream;
            if (videoEl.paused) {
                videoEl.play().catch((e: DOMException) => {
                    console.log(e.name, e.message);
                });
            }
        }

        stream.getTracks().forEach(track => {
            const trackEndHandler = () => {
                if (this.videoElement.current && this.videoElement.current.srcObject) {
                    this.videoElement.current.srcObject = null;
                }
                if (this.stream) {
                    this.stream = undefined;
                }
                track.removeEventListener('ended', trackEndHandler);
            };
            track.addEventListener('ended', trackEndHandler);
        });
    };

    revokeVideo = () => {
        const videoEl = this.videoElement.current as HTMLVideoElement;
        if (!videoEl.paused) {
            videoEl.pause();
        }

        videoEl.srcObject = null; 

        if (this.stream) {
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
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture()
                .then(() => this.setState({ isPiP: false }));
        } else if (this.videoElement.current && this.videoElement.current.readyState >= 1) {
            this.videoElement.current.requestPictureInPicture()
                .then(() => {
                    if (this.videoElement.current) {
                        this.setState({ isPiP: true });
                        this.videoElement.current.addEventListener('leavepictureinpicture', () => this.setState({ isPiP: false }))
                    }
                });
        }
    };

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
                <button onClick={this.toggleRecording}>Toggle recording</button>
            </div>
            <video ref={this.videoElement} autoPlay muted/>
        </Fragment>;
    }
}

export default Player;
