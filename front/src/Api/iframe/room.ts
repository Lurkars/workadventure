import { Subject } from "rxjs";
import { EnterLeaveEvent, isEnterLeaveEvent } from '../Events/EnterLeaveEvent';
import {IframeApiContribution, sendToWorkadventure} from './IframeApiContribution';
import { apiCallback } from "./registeredCallbacks";
import type {LayerEvent} from "../Events/LayerEvent";
import type {SetPropertyEvent} from "../Events/setPropertyEvent";
import type {GameStateEvent} from "../Events/GameStateEvent";
import type {ITiledMap} from "../../Phaser/Map/ITiledMap";
import type {DataLayerEvent} from "../Events/DataLayerEvent";
import {isGameStateEvent} from "../Events/GameStateEvent";
import {isDataLayerEvent} from "../Events/DataLayerEvent";

const enterStreams: Map<string, Subject<EnterLeaveEvent>> = new Map<string, Subject<EnterLeaveEvent>>();
const leaveStreams: Map<string, Subject<EnterLeaveEvent>> = new Map<string, Subject<EnterLeaveEvent>>();
const dataLayerResolver = new Subject<DataLayerEvent>();
const stateResolvers = new Subject<GameStateEvent>();

let immutableData: GameStateEvent;

interface Room {
    id: string,
    mapUrl: string,
    map: ITiledMap,
    startLayer: string | null
}

interface User {
    id: string | undefined,
    nickName: string | null,
    tags: string[]
}


function getGameState(): Promise<GameStateEvent> {
    if (immutableData) {
        return Promise.resolve(immutableData);
    }
    else {
        return new Promise<GameStateEvent>((resolver, thrower) => {
            stateResolvers.subscribe(resolver);
            sendToWorkadventure({type: "getState", data: null});
        })
    }
}

function getDataLayer(): Promise<DataLayerEvent> {
    return new Promise<DataLayerEvent>((resolver, thrower) => {
        dataLayerResolver.subscribe(resolver);
        sendToWorkadventure({type: "getDataLayer", data: null})
    })
}

class WorkadventureRoomCommands extends IframeApiContribution<WorkadventureRoomCommands> {
    callbacks = [
        apiCallback({
            callback: (payloadData: EnterLeaveEvent) => {
                enterStreams.get(payloadData.name)?.next();
            },
            type: "enterEvent",
            typeChecker: isEnterLeaveEvent
        }),
        apiCallback({
            type: "leaveEvent",
            typeChecker: isEnterLeaveEvent,
            callback: (payloadData) => {
                leaveStreams.get(payloadData.name)?.next();
            }
        }),
        apiCallback({
            type: "gameState",
            typeChecker: isGameStateEvent,
            callback: (payloadData) => {
                stateResolvers.next(payloadData);
            }
        }),
        apiCallback({
            type: "dataLayer",
            typeChecker: isDataLayerEvent,
            callback: (payloadData) => {
                dataLayerResolver.next(payloadData);
            }
        }),
    ]


    onEnterZone(name: string, callback: () => void): void {
        let subject = enterStreams.get(name);
        if (subject === undefined) {
            subject = new Subject<EnterLeaveEvent>();
            enterStreams.set(name, subject);
        }
        subject.subscribe(callback);

    }
    onLeaveZone(name: string, callback: () => void): void {
        let subject = leaveStreams.get(name);
        if (subject === undefined) {
            subject = new Subject<EnterLeaveEvent>();
            leaveStreams.set(name, subject);
        }
        subject.subscribe(callback);
    }
    showLayer(layerName: string): void {
        sendToWorkadventure({type: 'showLayer', data: {'name': layerName}});
    }
    hideLayer(layerName: string): void {
        sendToWorkadventure({type: 'hideLayer', data: {'name': layerName}});
    }
    setProperty(layerName: string, propertyName: string, propertyValue: string | number | boolean | undefined): void {
        sendToWorkadventure({
            type: 'setProperty',
            data: {
                'layerName': layerName,
                'propertyName': propertyName,
                'propertyValue': propertyValue,
            }
        })
    }
    getCurrentRoom(): Promise<Room> {
        return getGameState().then((gameState) => {
          return getDataLayer().then((mapJson) => {
              return {id: gameState.roomId, map: mapJson.data as ITiledMap, mapUrl: gameState.mapUrl, startLayer: gameState.startLayerName};
          })
        })
    }
    getCurrentUser(): Promise<User> {
        return getGameState().then((gameState) => {
            return {id: gameState.uuid, nickName: gameState.nickname, tags: gameState.tags};
        })
    }

}


export default new WorkadventureRoomCommands();
