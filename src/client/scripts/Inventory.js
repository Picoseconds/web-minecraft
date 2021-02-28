const EDGE_SIZE = 8;
const ITEM_SIZE = 18;
const DOLL_SIZE = 51;

const ITEM_RENDER_SIZE = 16;

// Inventory row size
const INVENTORY_ROW = 9;

const itemsAtlasURL = "/assets/items/items-Atlas.png";

function slotIsValid(slot) {
    return slot >= 0 && slot < 45 && (slot | 0) == slot;
}

const allSlots = Array(46)
    .fill()
    .map((_, idx) => idx);

var Inventory = class Inventory {
    constructor(game) {
        this.game = game;

        this.itemsImage = new Image();
        this.itemsImage.src = itemsAtlasURL;

        this.itemsImage.onload = () => {
            console.log("Items image loaded successfully");
            this.itemsImageLoaded = true;
        };
        this.itemsImage.onerror = () => {
            console.error(
                "Items atlas failed to load, inventory may be broken"
            );
        };

        this.elem = $(".inv_window");
        this.canvas = $("<canvas></canvas>").appendTo(this.elem);
        this.canvas.css("image-rendering", "pixelated");

        this.canvasDom = this.canvas[0];

        this.focus = null;
        this.inventory = {};
        this.canvasDom.width = this.elem.width();
        this.canvasDom.height = this.elem.height();

        const BACKGROUND_SIZE = parseInt(
            window
                .getComputedStyle($(".inv_window")[0])
                .backgroundSize.split("px")[0]
        );

        this.scale = BACKGROUND_SIZE / 256;

        this.ctx = this.canvasDom.getContext("2d");
        this.ctx.clearRect(0, 0, this.canvasDom.width, this.canvasDom.height);

        this.canvas.on("mouseup", (evt) => {
            this.processMouseEvent(evt);
            if (!this.focus) return;

            this.game.socket.emit("clickWindow", {
                slot: this.focus,
                button: 0,
                mode: this.getInventoryOperationMode(evt),
            });
        });

        this.canvas.on("mousemove", (evt) => {
            this.processMouseEvent(evt);
        });
        window.z = this;
    }

    /**
     * Gets the inventory operation mode for an event, sent in the Click Window packet
     * @param {MouseEvent | KeyboardEvent} evt the event to get the inventory operation mode from
     */
    getInventoryOperationMode(evt) {
        if (evt instanceof KeyboardEvent) {
        } else {
            switch (evt.type) {
                case "mousedown":
                    if (this.holdingStack) {
                        this.dragButton = evt.button;
                        return 5;
                    }
                    break;

                case "mouseup":
                    if (evt.shiftKey) {
                        return 1;
                    }

                    if (evt.button == this.dragButton) {
                        this.dragButton = null;
                        return 5;
                    }

                    return 0;
                    break;
            }
        }
    }

    /**
     * Draws an item to the inventory canvas
     * @param {string} id the name of the item to draw, without the minecraft: prefix. ex: dirt
     * @param {number} x where to draw the item on the canvas
     * @param {number} y where to draw the item on the canvas
     * @param {number} size the (square) size to draw the item at
     */
    drawItem(id, x, y, size) {
        if (!this.itemsImageLoaded) return;

        const origSize = 43;
        const items = this.game.al.get("itemsMapping");

        let pos = items[id];
        size = size || origSize;

        const itemAtlasScale = origSize / 50;

        this.ctx.drawImage(
            this.itemsImage,
            ((pos.x - 1) * origSize) / itemAtlasScale,
            ((pos.y - 1) * origSize) / itemAtlasScale,
            origSize / itemAtlasScale,
            origSize / itemAtlasScale,
            x,
            y,
            size,
            size
        );
    }

    /**
     * Sets the drawn items in the player's inventory
     * @param {*} inventory the items in the player's inventory
     */
    updateInv(inventory) {
        this.inventory = inventory;
        this.update();
    }

    /**
     * Sets the focused slots according to a mouse event
     * @param {MouseEvent} evt the event to process
     */
    processMouseEvent(evt) {
        let coords;

        for (let slot of allSlots) {
            coords = this.getCoordinates(slot, true);

            if (
                evt.offsetX > coords[0] &&
                evt.offsetX < coords[0] + ITEM_SIZE * this.scale &&
                evt.offsetY > coords[1] &&
                evt.offsetY < coords[1] + ITEM_SIZE * this.scale
            ) {
                this.setFocus(slot);
                return;
            }
        }

        this.setFocus(null);
    }

    /**
     * Gets the on-screen coordinates of a slot in the player inventory. See https://wiki.vg/Inventory
     * @param {number} slot the slot to get the coordinates of
     * @param {boolean} scale whether to scale the coordinates to screen space
     */
    getCoordinates(slot, scale = false) {
        const scaleFactor = scale ? this.scale : 1;

        if (slot == 45) {
            // Should return 77, 62
            return [
                (EDGE_SIZE + ITEM_SIZE + DOLL_SIZE) * scaleFactor,
                (EDGE_SIZE + ITEM_SIZE * 3) * scaleFactor,
            ];
        }

        if (slot < 45 && slot >= 36) {
            return [
                (EDGE_SIZE + (slot - 36) * ITEM_SIZE) * scaleFactor,
                142 * scaleFactor,
            ];
        } else if (slot > 8 && slot < 36) {
            return [
                (EDGE_SIZE + (slot % INVENTORY_ROW) * ITEM_SIZE) * scaleFactor,
                (84 + (Math.floor(slot / INVENTORY_ROW) - 1) * ITEM_SIZE) *
                    scaleFactor,
            ];
        } else if (slot > 4 && slot < 9) {
            return [
                EDGE_SIZE * scaleFactor,
                (EDGE_SIZE + ITEM_SIZE * (7 - slot)) * scaleFactor,
            ];
        } else if (slot == 0) {
            return [154 * scaleFactor, 28 * scaleFactor];
        } else if (slot > 0) {
            return [
                (98 + (1 - (slot % 2)) * 18) * scaleFactor,
                (18 + Math.floor(slot / 3) * 18) * scaleFactor,
            ];
        }

        throw "Inventory.getCoordinates(): Invalid slot!";
    }

    /**
     * Sets the highlighted slot currently under the mouse cursor
     * @param {number} slot the slot currently under the mouse cursor
     */
    setFocus(slot) {
        this.focus = slot;
        this.update();
    }

    /**
     * Updates the inventory view
     */
    update() {
        this.ctx.clearRect(0, 0, this.canvasDom.width, this.canvasDom.height);

        if (this.focus !== null) {
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            const coords = this.getCoordinates(this.focus, true);
            this.ctx.fillRect(
                ...coords,
                ITEM_RENDER_SIZE * this.scale,
                ITEM_RENDER_SIZE * this.scale
            );
        }

        let itemCoords;

        for (let slot of Object.keys(this.inventory).map((slot) =>
            parseInt(slot)
        )) {
            if (this.inventory[slot]) {
                itemCoords = this.getCoordinates(slot, true);

                this.drawItem(
                    this.inventory[slot].name,
                    ...itemCoords,
                    ITEM_RENDER_SIZE * this.scale
                );
            }
        }
    }
};

export { Inventory };
