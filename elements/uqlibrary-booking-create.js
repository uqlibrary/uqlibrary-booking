/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
  Polymer({
    is: 'uqlibrary-booking-create',
    properties: {
      /**
       * Holds the user account
       */
      account: {
        type: Object,
        notify: true
      },
      /**
       * Holds the date selected on the Find Room page
       */
      _searchDate: {
        type: Date,
        notify: true
      },
      /**
       * Holds the duration selected on the Find Room page
       */
      _searchDuration: {
        type: Number,
        notify: true
      },
      /**
       * Holds the search results found by the Find Room page
       */
      _searchResults: {
        type: Array,
        value: [],
        notify: true
      },
      /**
       * Holds the room that is selected by the Select Room page
       */
      _selectedRoom: {
        type: Object,
        notify: true
      },
      /**
       * Holds the currently selected page
       */
      _selectedPage: {
        type: Number
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    /**
     * Function called from uqlibrary-booking when the back button is clicked
     */
    back: function () {
      if (this._selectedPage == 0 || !this._selectedPage) {
        this.fire('my-bookings');
      } else {
        this._selectedPage--;
      }
    },
    /**
     * Called when this element receives focus
     */
    activate: function () {
      this._selectedPage = 0;
      this.$.findRoom.activate();
    },
    /**
     * Called whenever a iron-select event is fired on neon-animated-pages
     * @private
     */
    _pageChanged: function (e) {
      if (e.target.id != "createBookingPages") return;

      var headerData = {};

      if (this._selectedPage == 0) {
        // My Bookings page
        headerData.title = 'Find a room';
        headerData.backEnabled = true;
      } else if (this._selectedPage == 1) {
        // Booking details page
        headerData.title = 'Select room';
        headerData.backEnabled = true;
      } else if (this._selectedPage == 2) {
        // Update booking page
        headerData.title = 'Book a room';
        headerData.backEnabled = true;
        this.$.bookRoom.activate();
      }

      this.fire('uqlibrary-booking-update-header', headerData);
    },
    /**
     * Called when the user presses "Search" on the Find Room page
     * @private
     */
    _navigateToSelectRoom: function () {
      this._selectedPage = 1;
    },
    /**
     * Called when the user selects a room on the Select Room page
     * @private
     */
    _navigateToBookRoom: function () {
      this._selectedPage = 2;
    },
    /**
     * Called when a booking is created
     * @private
     */
    _bookingCreated: function() {
      this.$.ga.addEvent('bookingCreated');

      this._selectedPage = 0;
      this.fire('my-bookings');

      //Show toast that event was created after the transition is done
      var self = this;
      setTimeout(function(){
        self.fire('uqlibrary-booking-show-toast', 'Your booking was saved.');
      }, 100, self);
    }
  })
})();