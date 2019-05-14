/**
 * A LOTTO node.
 * A winning child is picked on the initial update of this node, based on ticket weighting.
 * The state of this node will match the state of the winning child.
 * @param uid The unique node id.
 * @param guard The node guard.
 * @param tickets The child node tickets
 * @param children The child nodes. 
 */
export default function Lotto(uid, guard, tickets, children) {
    /**
     * The node state.
     */
    let state = Mistreevous.State.READY;

    /**
     * The winning child node.
     */
    let winningChild;

    /**
     * Represents a lotto draw.
     */
    function LottoDraw() {
        /**
         * The participants
         */
        this.participants = [];

        /**
         * Add a participant.
         * @param participant The participant.
         * @param tickets The number of tickets held by the participant.
         */
        this.add = function(participant, tickets) {
            this.participants.push({ participant, tickets });
            return this;
        };

        /**
         * Draw a winning participant.
         * @returns A winning participant.
         */
        this.draw = function() {
            // We cannot do anything if there are no participants.
            if (!this.participants.length) {
                throw "cannot draw a lotto winner when there are no participants";
            }

            const pickable = [];

            this.participants.forEach(({ participant, tickets }) => {
                for (let ticketCount = 0; ticketCount < tickets; ticketCount++) {
                    pickable.push(participant);
                }
            });

            return this.getRandomItem(pickable);
        };

        /**
         * Get a random item form an array. 
         * @param items Th array of items.
         * @returns The randomly picked item.
         */
        this.getRandomItem = function(items) {
            // We cant pick a random item from an empty array.
            if (!items.length) {
                return undefined;
            }

            // Return a random item.
            return items[Math.floor(Math.random() * items.length)]; 
        }
    }
   
    /**
     * Update the node and get whether the node state has changed.
     * @param board The board.
     * @param guardScope The guard scope.
     * @returns Whether the state of this node has changed as part of the update.
     */
    this.update = function(board, guardScope) {
        // Get the pre-update node state.
        const initialState = state;

        // If this node is already in a 'SUCCEEDED' or 'FAILED' state then there is nothing to do.
        if (state === Mistreevous.State.SUCCEEDED || state === Mistreevous.State.FAILED) {
            // We have not changed state.
            return false;
        }

        // If a guard has been defined for the node, this node will move into the FAILED state if it is not satisfied.
        if (guard && !guard.isSatisfied(board)) {
            // The guard is not satisfied and therefore we are finished with the node.
            state = Mistreevous.State.FAILED;

            // The node has moved to the FAILED state.
            return true;
        }

        // If this node is in the READY state then we need to pick a winning child node.
        if (state === Mistreevous.State.READY) {
            // Create a lotto draw.
            const lottoDraw = new LottoDraw();

            // Add each child of this node to a lotto draw, with each child's corresponding ticket weighting, or a single ticket if not defined.
            children.forEach((child, index) => lottoDraw.add(child, tickets[index] || 1));

            // Randomly pick a child based on ticket weighting.
            winningChild = lottoDraw.draw();
        }

        // If the winning child has never been updated or is running then we will need to update it now.
        if (winningChild.getState() === Mistreevous.State.READY || winningChild.getState() === Mistreevous.State.RUNNING) {
            winningChild.update(board, guardScope.createScope(guard, this));
        }

        // The state of the lotto node is the state of its winning child.
        state = winningChild.getState();

        // Return whether the state of this node has changed.
        return state !== initialState;
    };

    /**
     * Gets the state of the node.
     */
    this.getState = () => state;

    /**
     * Gets the name of the node.
     */
    this.getName = () => tickets.length ? `LOTTO [${ tickets.join(",") }]` : "LOTTO";

    /**
     * Gets the state of the node.
     */
    this.getChildren = () => children;

    /**
     * Gets the guard of the node.
     */
    this.getGuard = () => guard;

    /**
     * Gets the type of the node.
     */
    this.getType = () => "lotto";

    /**
     * Gets the unique id of the node.
     */
    this.getUid = () => uid;

    /**
     * Reset the state of the node.
     * @param isAbort Whether the reset is part of an abort.
     */
    this.reset = (isAbort) => {
        // Reset the state of this node.
        state = Mistreevous.State.READY;

        // Reset each child node.
        children.forEach((child) => child.reset(isAbort));
    };
};