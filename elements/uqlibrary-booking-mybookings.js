/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
  Polymer({
    is: 'uqlibrary-booking-mybookings',
    properties: {
      /**
       * Holds the events
       */
      events: {
        type: Array,
        value: []
      },
      /**
       * Holds the selected booking
       */
      _selectedBooking: {
        type: Object,
        value: {},
        notify: true
      },
      /**
       * Holds the selected page of the My Bookings process
       */
      _selectedPage: {
        type: Number,
        notify: true,
        value: 0
      },
      /**
       * Holds the user account
       */
      account: {
        type: Object,
        notify: true
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    ready: function () {
      var self = this;

      this.$.bookings.addEventListener("uqlibrary-api-account-bookings-loaded", function (e) {
        self._processData(e);
      });

      this.$.bookings.get({ nocache : true });
    },
    /**
     * Called when this element receives focus
     */
    activate: function () {
      // Force the change
      this._selectedPage = -1;
      this._selectedPage = 0;

      this.$.bookings.get({ nocache : true });
    },
    /**
     * Function called from uqlibrary-booking when the back button is clicked
     */
    back: function () {
      this._selectedPage--;
    },
    /**
     * Called whenever a iron-select event is fired on neon-animated-pages
     * @private
     */
    _pageChanged: function (e) {
      if (e.target.id != "mybookingsPages") return;

      var headerData = {};

      if (this._selectedPage == 0) {
        // My Bookings page
        headerData.title = 'Room bookings';
        headerData.backEnabled = false;
      } else if (this._selectedPage == 1) {
        // Booking details page
        headerData.title = 'Booking details';
        headerData.backEnabled = true;
        this.$.bookingDisplay.activate();
      } else if (this._selectedPage == 2) {
        // Update booking page
        headerData.title = 'Update booking';
        headerData.backEnabled = true;
        this.$.bookingEdit.activate();
      }

      this.fire('uqlibrary-booking-update-header', headerData);
    },
    /**
     * Processes data
     * @param e
     * @private
     */
    _processData: function (e) {
      var self = this;

      var bookings = Array.isArray(e.detail) ? e.detail : [];
      if (bookings.length > 0) {
        var events = [];

        for (var i = bookings.length-1; i >= 0; i--) {

          var title = [];
          var subtitle = [];
          var b = bookings[i];

          if (b.resource.title)
            title.push(b.resource.title);
          if (b.resource.location)
            title.push(b.resource.location);
          if (self.rooms && self.rooms[b.resource.machid]) {
            subtitle.push(self.rooms[b.resource.machid].building);
            subtitle.push(self.rooms[b.resource.machid].campus);
          }

          events.push({
            id: b.id,
            startDate: new Date(b.from * 1000),
            endDate: new Date(b.to * 1000),
            title: title.join(", "),
            subtitle: subtitle.join(", "),
            scheduleid: b.resource.id,
            machid: b.resource.machid
          });

          //display up to first 20 bookings
          if (events.length == 20 || i == 0) {
            self.events = events;
            break;
          }
        }
      }
      else {
        self.events = [];
      }
    },
    /**
     * Called when an event item is clicked on
     * @param e
     * @private
     */
    _bookingSelected: function (e) {
      this._selectedBooking = e.detail;
      this._selectedPage = 1;
    },
    /**
     * Called when the user wants to edit a booking
     * @private
     */
    _editBooking: function () {
      this._selectedPage = 2;
    },
    /**
     * Called when a booking is deleted by uqlibrary-booking-display
     * @private
     */
    _bookingDeleted: function () {
      this.$.bookings.get({ nocache : true });
      this.back();

      this.fire('uqlibrary-booking-show-toast', 'Your booking was deleted');
    },
    /**
     * Fires of an event to navigate to the "Add Booking" page
     * @private
     */
    _addBooking: function () {
      this.fire("add-booking");
    },
    /**
     * Called when a booking is created
     * @private
     */
    _bookingUpdated: function() {
      this.$.ga.addEvent('bookingUpdated');

      this._selectedPage = 0;
      this.$.bookings.get({ nocache : true });

      //Show toast that event was created after the transition is done
      var self = this;
      setTimeout(function(){
        self.fire('uqlibrary-booking-show-toast', 'Your booking was saved.');
      }, 100, self);
    }
  })
})();