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
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    ready: function () {
      var self = this;

      this.$.bookings.addEventListener("uqlibrary-api-account-bookings-loaded", function (e) {
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

        self.bookingsUseCache = true;
      });

      this.$.bookings.get();
    },
    /**
     * Called when an event item is clicked on
     * @param e
     * @private
     */
    _bookingSelected: function (e) {
      alert("You clicked on item with ID: " + e.detail.id);
    }
  })
})();