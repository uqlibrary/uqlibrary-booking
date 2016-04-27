/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
  Polymer({
    is: 'uqlibrary-booking-select-room',
    properties: {
      /**
       * Holds the events
       */
      searchResults: {
        type: Array,
        value: []
      },
      /**
       * Set when a room is selected
       */
      selectedRoom: {
        type: Object,
        value: {},
        notify: true
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    /**
     * Called when the back button is pressed
     */
    back: function () {
      this.fire('uqlibrary-booking-navigate', 1);
    },
    /**
     * Called when the user clicks on a room
     * @param e
     * @private
     */
    _selectRoom: function (e) {
      this.selectedRoom = e.model.item;
      this.fire("book-room");
    }
  })
})();