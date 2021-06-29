import {emoteEventStream} from "../../Connexion/EmoteEventStream";
import type {GameScene} from "./GameScene";
import type {Subscription} from "rxjs";

export const emotes: string[] = ['❤️', '👏', '✋', '🙏', '👍', '👎'];

export class EmoteManager {
    private subscription: Subscription;

    constructor(private scene: GameScene) {
        this.subscription = emoteEventStream.stream.subscribe((event) => {
            const actor = this.scene.MapPlayersByKey.get(event.userId);
            if(actor) {
                actor.playEmote(event.emote);
            }
        })
    }

    getEmotes(): string[] {
        // TODO: localstorage + management
        return emotes;
    }

    destroy() {
        this.subscription.unsubscribe();
    }
}