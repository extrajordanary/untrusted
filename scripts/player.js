function Player(x, y, __map) {
    /* private variables */

    var __x = x;
    var __y = y;
    var __color = "#0f0";

    var __game = __map._game;
    var __display = __map._display;

    /* unexposed variables */

    this._canMove = false;

    /* exposed getters/setters */

    this.getX = function () { return __x; };
    this.getY = function () { return __y; };

    this.getColor = function () { return __color; };
    this.setColor = function (c) {
        __color = c;
        __display.drawAll(__map);
    };

    /* unexposed methods */

    // (used for teleporters)
    this._moveTo = function (dynamicObject) {
        // no safety checks or anything
        // this method is about as safe as a war zone
        __x = dynamicObject.getX();
        __y = dynamicObject.getY();
        __display.drawAll(__map);
    };

    this._afterMove = function (x, y) {
        var player = this;

        this._hasTeleported = false; // necessary to prevent bugs with teleportation

        __map._hideChapter();
        __map._moveAllDynamicObjects();

        var onTransport = false;

        // check for collision with transport object
        for (var i = 0; i < __map.getDynamicObjects().length; i++) {
            var object = __map.getDynamicObjects()[i];
            if (object.getX() === x && object.getY() === y) {
                var objectDef = __map._getObjectDefinition(object.getType());
                if (objectDef.transport) {
                    onTransport = true;
                }
            }
        }

        // check for collision with static object UNLESS
        // we are on a transport
        if (!onTransport) {
            var objectName = __map._getGrid()[x][y].type;
            var objectDef = __map._getObjectDefinition(objectName);
            if (objectDef.type === 'item') {
                this.pickUpItem(objectName, objectDef);
            } else if (objectDef.onCollision) {
                __game.validateCallback(function () {
                    objectDef.onCollision(player, __game);
                });
            }
        }

        // check for collision with any lines on the map
        __map.testLineCollisions();
    };

    /* exposed methods */

    this.atLocation = function (x, y) {
        return (__x === x && __y === y);
    };

    this.move = function (direction) {
        if (!this._canMove) { // mainly for key delay
            return false;
        }

        var new__x;
        var new__y;
        if (direction === 'up') {
            new__x = __x;
            new__y = __y - 1;
        }
        else if (direction === 'down') {
            new__x = __x;
            new__y = __y + 1;
        }
        else if (direction === 'left') {
            new__x = __x - 1;
            new__y = __y;
        }
        else if (direction === 'right') {
            new__x = __x + 1;
            new__y = __y;
        }
        else if (direction === 'rest') {
            new__x = __x;
            new__y = __y;
        }
        else if (direction === 'funcPhone') {
            __game.usePhone();
            return;
        }

        if (__map._canMoveTo(new__x, new__y)) {
            __x = new__x;
            __y = new__y;

            __map.refresh();

            this._canMove = false;

            this._afterMove(__x, __y);

            __map._reenableMovementForPlayer(this); // (key delay can vary by map)
        }
    };

    this.killedBy = function (killer) {
        __game.sound.playSound('hurt');
        __game._restartLevel();

        __map.displayChapter('You have been killed by \n' + killer + '!', 'death');
    };

    this.pickUpItem = function (itemName, object) {
        var player = this;

        __game.addToInventory(itemName);
        __map._removeItemFromMap(__x, __y, itemName);
        __map.refresh();
        __game.sound.playSound('pickup');

        if (object.onPickUp) {
            __game.validateCallback(function () {
                setTimeout(function () {
                    object.onPickUp(player, __game);
                }, 100);
                // timeout is so that written text is not immediately overwritten
                // TODO: play around with Display.writeStatus so that this is
                // not necessary
            });
        }
    };

    this.hasItem = function (itemName) {
        return __game.checkInventory(itemName);
    };

    this.removeItem = function (itemName) {
        var object = __game.objects[itemName];

        __game.removeFromInventory(itemName);
        __game.sound.playSound('blip');
    };

    this.setPhoneCallback = function(func) {
        this._phoneFunc = func;
    };
}
