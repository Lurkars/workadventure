import ScaleManager = Phaser.Scale.ScaleManager;

interface Size {
    width: number;
    height: number;
}

export class HdpiManager {
    private _zoomModifier: number = 1;

    /**
     *
     * @param minRecommendedGamePixelsNumber The minimum number of pixels we want to display "by default" to the user
     * @param absoluteMinPixelNumber The very minimum of game pixels to display. Below, we forbid zooming more
     */
    public constructor(private minRecommendedGamePixelsNumber: number, private absoluteMinPixelNumber: number) {
    }

    /**
     * Returns the optimal size in "game pixels" based on the screen size in "real pixels".
     *
     * Note: the function is returning the optimal size in "game pixels" in the "game" property,
     * but also recommends resizing the "real" pixel screen size of the canvas.
     * The proposed new real size is a few pixels bigger than the real size available (if the size is not a multiple of the pixel size) and should overflow.
     *
     * @param realPixelScreenSize
     */
    public getOptimalGameSize(realPixelScreenSize: Size): { game: Size, real: Size } {
        const realPixelNumber = realPixelScreenSize.width * realPixelScreenSize.height;
        // If the screen has not a definition small enough to match the minimum number of pixels we want to display,
        // let's make the canvas the size of the screen (in real pixels)
        if (realPixelNumber <= this.minRecommendedGamePixelsNumber) {
            return {
                game: realPixelScreenSize,
                real: realPixelScreenSize
            };
        }

        let i = 1;

        while (realPixelNumber > this.minRecommendedGamePixelsNumber * i * i) {
            i++;
        }

        // Has the canvas more pixels than the screen? This is forbidden
        if ((i - 1) * this._zoomModifier < 1) {
            // Let's reset the zoom modifier (WARNING this is a SIDE EFFECT in a getter)
            this._zoomModifier = 1 / (i - 1);

            return {
                game: {
                    width: realPixelScreenSize.width,
                    height: realPixelScreenSize.height,
                },
                real: {
                    width: realPixelScreenSize.width,
                    height: realPixelScreenSize.height,
                }
            }
        }

        const gameWidth = Math.ceil(realPixelScreenSize.width / (i - 1) / this._zoomModifier);
        const gameHeight = Math.ceil(realPixelScreenSize.height / (i - 1) / this._zoomModifier);

        // Let's ensure we display a minimum of pixels, even if crazily zoomed in.
        if (gameWidth * gameHeight < this.absoluteMinPixelNumber) {
            const minGameHeight = Math.sqrt(this.absoluteMinPixelNumber * realPixelScreenSize.height / realPixelScreenSize.width);
            const minGameWidth = Math.sqrt(this.absoluteMinPixelNumber * realPixelScreenSize.width / realPixelScreenSize.height);

            // Let's reset the zoom modifier (WARNING this is a SIDE EFFECT in a getter)
            this._zoomModifier = realPixelScreenSize.width / minGameWidth / (i - 1);

            return {
                game: {
                    width: minGameWidth,
                    height: minGameHeight,
                },
                real: {
                    width: realPixelScreenSize.width,
                    height: realPixelScreenSize.height,
                }
            }

        }

        return {
            game: {
                width: gameWidth,
                height: gameHeight,
            },
            real: {
                width: Math.ceil(realPixelScreenSize.width / (i - 1)) * (i - 1),
                height: Math.ceil(realPixelScreenSize.height / (i - 1)) * (i - 1),
            }
        }
    }

    public get zoomModifier(): number {
        return this._zoomModifier;
    }

    public set zoomModifier(zoomModifier: number) {
        this._zoomModifier = zoomModifier;
    }
}