/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
  Polymer({
    is: 'uqlibrary-booking-book-room',
    properties: {
      /**
       * Set when a room is selected
       */
      selectedRoom: {
        type: Object,
        value: {},
        notify: true,
        observer: '_searchDataChanged'
      },
      /**
       * Set when a search date is selected
       */
      searchDate: {
        type: Date,
        observer: '_searchDataChanged',
        notify: true
      },
      /**
       * Changed whenever the searchDate is updated
       */
      _maximumBookingDate: {
        type: Date,
        notify: true
      },
      /**
       * Holds the available time slots for the selected room
       */
      _bookingTimeSlots: {
        type: Array,
        value: [],
        notify: true
      },
			/**
       * Holds the computed max booking length
       */
      _maxBookingLength: {
        type: Number,
        value: 0
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    /**
     * Called when this element receives focus
     */
    activate: function () {
      this.fire('uqlibrary-booking-change-title', 'Book a room');
    },
    /**
     * Called when the search date has changed
     * @private
     */
    _searchDataChanged: function () {
      this._maxBookingLength = (!this.selectedRoom ? 0 : this.selectedRoom.maxtime / this.selectedRoom.time_span);
      this._bookingTimeSlots = this._createTimeslots();
      this._maximumBookingDate = moment(this.searchDate).add(7, "day").toDate();
    },
    /**
     * Formats the room location
     * @param roomDetails
     * @returns {string}
     * @private
     */
    _formatLocation : function (roomDetails) {
      var location = [];

      if (roomDetails.location) location.push(roomDetails.location);
      if (roomDetails.building) location.push(roomDetails.building);
      if (roomDetails) location.push(roomDetails.campus);

      return location.join(", ");
    },
    /**
     * Generates the time slots for the selected room
     * @returns {Array}
     * @private
     */
    _createTimeslots : function() {
      var that = this;

      var openingHours = moment(this.selectedRoom.available_from, "X");
      var closingHours = moment(this.selectedRoom.available_to, "X");
      var workingTimeslots = (closingHours - openingHours) / this.selectedRoom.time_span / 60 / 1000;
      var bookingDetails = this.selectedRoom.bookings;

      var currentDate = moment(new Date(openingHours.toDate()));
      var timeslots = [];

      for (var index = 0; index < workingTimeslots; index++){
        var timeslotStartTime = new Date(currentDate.toDate());
        var timeslotEndTime = new Date(currentDate.add(this.selectedRoom.time_span, "m").toDate());

        var selectable = bookingDetails.every(function(element, index, array){
          var bookingStartTime = moment(element.from, "X");
          var bookingEndTime = moment(element.to, "X");

          //timeslot is selectable if it belongs to a current booking in editing form
          if (bookingDetails && bookingDetails.startDate &&
              timeslotStartTime.getTime() >= bookingDetails.startDate.getTime() &&
              timeslotEndTime.getTime() <= bookingDetails.endDate.getTime()) {
            return true;
          }

          //timeslot does not overlap with existing booking
          if (bookingStartTime >= timeslotEndTime || bookingEndTime <= timeslotStartTime)
            return true;

          //timeslot overlaps with existing booking
          if ((timeslotStartTime >= bookingStartTime && timeslotEndTime <= bookingEndTime)
              || (timeslotStartTime <= bookingStartTime && timeslotEndTime > bookingStartTime && timeslotEndTime < bookingEndTime)
              || (timeslotStartTime > bookingStartTime && timeslotStartTime < bookingEndTime && timeslotEndTime >= bookingEndTime))
          {
            return false;
          }
        });

        timeslots.push(
            {
              startTime: timeslotStartTime,
              endTime: timeslotEndTime,
              selected: false,
              selectable: selectable
            });
      }

      return timeslots;
    },
		/**
     * Creates a room booking
     * @private
     */
    _createRoomBooking: function () {
      // get currently selected elements
      var selectedTimeslots = this._bookingTimeSlots.filter(function(item) { return item.selected; });
      var validation = this._validateSelection(selectedTimeslots);

      if (!validation.valid){
        this.$.toast.text = validation.message;
        this.$.toast.open();
      } else {

        var midnight = new Date(selectedTimeslots[0].startTime.getFullYear(), selectedTimeslots[0].startTime.getMonth(), selectedTimeslots[0].startTime.getDate(), 0, 0, 0);
        var startTime = (selectedTimeslots[0].startTime - midnight) / (1000 * 60);
        var endTime = (selectedTimeslots[selectedTimeslots.length-1].endTime - midnight) / (1000 * 60);

        var newBooking = {
          booking : {
            machid: this.selectedRoom.id,
            scheduleid: this.selectedRoom.scheduleid,
            date: moment(selectedTimeslots[0].startTime).format("MM/DD/YYYY"),
            starttime: startTime,
            endtime: endTime
          }
        };

        if (this.bookingDetails && this.bookingDetails.id) {
          newBooking.booking.resid = this.bookingDetails.id;
        }

        this.$.createBookingRequest.post(newBooking);
      }
    },
		/**
     * Validates a given time slot selection
     * @param selectedTimeslots
     * @returns {{valid: boolean, message: string}}
     * @private
     */
    _validateSelection : function(selectedTimeslots) {
      var validation = {
        valid : true,
        message: ''
      };

      if (selectedTimeslots.length == 0) {
        validation.valid = false;
        validation.message = "Please, make a valid selection.";
      } else if (selectedTimeslots.length > this.selectedRoom.maxtime / this.selectedRoom.time_span) {
        validation.valid = false;
        validation.message = "Current selection exceeds maximum booking duration. Please, make a valid selection.";
      }
      else if (!selectedTimeslots.every(function(element, index) {
          return !(index < selectedTimeslots.length - 1 && element.endTime.valueOf() !== selectedTimeslots[index+1].startTime.valueOf());
        })) {
        validation.valid = false;
        validation.message = "Current selection is not available. Please, make another selection.";
      }

      return validation;
    }
  })
})();