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
     * Called when the user clicks on a room
     * @param e
     * @private
     */
    _selectRoom: function (e) {
      this.selectedRoom = e.model.item;
      this.fire("book-room");
    },
    _goToFBS: function () {
      this.$.ga.addEvent('mainFBSLinkClicked');
      window.location = 'https://www.library.uq.edu.au/fbs/';
    }
  })
})();