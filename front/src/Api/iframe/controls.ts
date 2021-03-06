import { IframeApiContribution, sendToWorkadventure } from './IframeApiContribution';

class WorkadventureControlsCommands extends IframeApiContribution<WorkadventureControlsCommands> {
    callbacks = []

    disablePlayerControls(): void {
        sendToWorkadventure({ 'type': 'disablePlayerControls', data: null });
    }

    restorePlayerControls(): void {
        sendToWorkadventure({ 'type': 'restorePlayerControls', data: null });
    }
}


export default new WorkadventureControlsCommands();
