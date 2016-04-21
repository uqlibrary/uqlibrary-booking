/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
  Polymer({
    is: 'uqlibrary-booking-select-room',
    properties: {
      /**
       * Holds the search data coming from the Find a Room page
       */
      _searchData: {
        type: Object,
        value: {}
      },
      /**
       * Holds the events
       */
      _searchResults: {
        type: Array,
        value: []
      },
      /**
       * Set when a room is selected
       */
      _selectedRoom: {
        type: Object,
        value: {}
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
     * Called when this page is initialized
     * @param searchData
     * @param searchResults
     */
    initialize: function (searchData, searchResults) {
      this.fire('uqlibrary-booking-change-title', 'Select a room');

      this._searchResults = searchResults;
      this._searchData = searchData;
    },
    /**
     * Called when the user clicks on a room
     * @param e
     * @private
     */
    _selectRoom: function (e) {
      this.selectedRoom = e.model.item;
      this.fire("book-room", {
        searchData: this._searchData,
        room: e.model.item
      });
    }
  })
})();