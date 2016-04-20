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
      selectedBooking: {
        type: Object,
        notify: true
      },
      /**
       * Whether the data from my bookings should refreshed
       */
      useCached: {
        type: Boolean,
        value: false,
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

      self.useCached = true;
    },
    /**
     * Called when the My Bookings page is activated
     */
    activate: function () {
      this.$.bookings.get({nocache : !this.useCached} );
      this.fire('uqlibrary-booking-change-title', 'My bookings');
    },
    /**
     * Called when an event item is clicked on
     * @param e
     * @private
     */
    _bookingSelected: function (e) {
      this.selectedBooking = e.detail;
      this.fire('uqlibrary-booking-navigate', 4);
    },
    /**
     * Fires of an event to navigate to the "Add Booking" page
     * @param e
     * @private
     */
    _addBooking: function (e) {
      this.fire("uqlibrary-booking-navigate", 1);
    }
  })
})();