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
    ready: function () {
      var self = this;
    },
    activate: function () {
      this.fire('uqlibrary-booking-change-title', 'Select a room');
    },
    /**
     * Called when the user clicks on a room
     * @param e
     * @private
     */
    _selectRoom: function (e) {
      this.selectedRoom = e.model.item;
      this.fire("uqlibrary-booking-navigate", 3);
    }
  })
})();