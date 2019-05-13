import GuardUnsatisfiedException from './guards/guardUnsatisfiedException'

/**
 * A WAIT node.
 * The state of this node will change to SUCCEEDED after a duration of time.
 * @param uid The unique node id.
 * @param guard The node guard.
 * @param duration The duration that this node will wait to succeed in milliseconds, or the earliest if longestDuration is defined.
 * @param longestDuration The longest possible duration in milliseconds that this node will wait to succeed.
 */
export default function Wait(uid, guard, duration, longestDuration) {
    /**
     * The node state.
     */
    let state = Mistreevous.State.READY;

    /** 
     * The time in milliseconds at which this node was first updated.
     */
    let initialUpdateTime;

    /**
     * The duration in milliseconds that this node will be waiting for. 
     */
    let waitDuration;
   
    /**
     * Update the node and get whether the node state has changed.
     * @param board The board.
     * @param guardScope The guard scope.
     * @returns Whether the state of this node has changed as part of the update.
     * @throws GuardUnsatisfiedException Thrown when any node guard condition in the current tree path fails.
     */
    this.update = function(board, guardScope) {
        // Get the pre-update node state.
        const initialState = state;

        // Evaluate all of the guard scope conditions for the current tree path, including the guard that this node may be decorated with.
        try {
            guardScope.createScope(guard, this).evaluate(board);
        } catch (exception) {
            if (typeof exception === GuardUnsatisfiedException && exception.isForNode(this)) {
                // The guard condition for this node did not pass, so this node will move into the FAILED state.
                state = Mistreevous.State.FAILED;

                // Return whether the state of this node has changed.
                return state !== initialState;
            } else {
                throw exception;
            }
        }

        // If this node is already in a 'SUCCEEDED' or 'FAILED' state then there is nothing to do.
        if (state === Mistreevous.State.SUCCEEDED || state === Mistreevous.State.FAILED) {
            // We have not changed state.
            return false;
        }

        // If this node is in the READY state then we need to set the initial update time.
        if (state === Mistreevous.State.READY) {
            // Set the initial update time.
            initialUpdateTime = new Date().getTime();

            // If a longestDuration value was defined then we will be randomly picking a duration between the
            // shortest and longest duration. If it was not defined, then we will be just using the duration.
            waitDuration = longestDuration ? Math.floor(Math.random() * (longestDuration - duration + 1) + duration) : duration;

            // The node is now running until we finish waiting.
            state = Mistreevous.State.RUNNING;
        }

        // Have we waited long enough?
        if (new Date().getTime() >= (initialUpdateTime + waitDuration)) {
            // We have finished waiting!
            state = Mistreevous.State.SUCCEEDED;
        }

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
    this.getName = () => `WAIT ${ longestDuration ? duration + "ms-" + longestDuration + "ms" : duration + "ms" }`;

    /**
     * Gets the state of the node.
     */
    this.getChildren = () => [];

    /**
     * Gets the guard of the node.
     */
    this.getGuard = () => guard;

    /**
     * Gets the type of the node.
     */
    this.getType = () => "wait";

    /**
     * Gets the unique id of the node.
     */
    this.getUid = () => uid;

    /**
     * Reset the state of the node.
     */
    this.reset = () => {
        // Reset the state of this node.
        state = Mistreevous.State.READY;
    };
};