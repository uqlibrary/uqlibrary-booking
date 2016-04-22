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
      _selectedRoom: {
        type: Object,
        value: {},
        notify: true
      },
      /**
       * Set when a search date is selected
       */
      _searchDate: {
        type: Date,
        notify: true,
        observer: '_searchDataChanged'
      },
      /**
       * Set when the duration is changed
       */
      _searchDuration: {
        type: Number,
        notify: true
      },
      /**
       * Changed whenever the _searchDate is updated
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
      },
      /**
       * Holds booking details. Set by uqlibrary-booking (not passed through)
       */
      _bookingDetails: {
        type: Object,
        value: null
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    /**
     * Initializes the Book Room page (add or edit)
     * @param searchDate
     * @param room
     * @param duration
     * @param bookingDetails
     */
    initialize: function (searchDate, room, duration, bookingDetails) {
      this.fire('uqlibrary-booking-change-title', 'Book a room');

      this._selectedRoom = room;
      this._searchDuration = duration;
      this._bookingDetails = bookingDetails;
      this._searchDate = searchDate; // Triggers timeslot creation
    },
    /**
     * Called when the back button is pressed
     * TODO: Refactor once we rewrite
     */
    back: function () {
      if (this._bookingDetails) {
        this.fire('uqlibrary-booking-navigate', 4);
        this.fire('uqlibrary-booking-change-title', 'Booking details');
      } else {
        this.fire('uqlibrary-booking-navigate', 2);
        this.fire('uqlibrary-booking-change-title', 'Select a room');
      }
    },
    /**
     * Called when the search date has changed
     * @private
     */
    _searchDataChanged: function () {
      this._maxBookingLength = (!this._selectedRoom ? 0 : this._selectedRoom.maxtime / this._selectedRoom.time_span);
      this._bookingTimeSlots = this._createTimeslots();
      this._maximumBookingDate = moment().add(7, "day").toDate();
      this._selectTimeSlots();
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
      var self = this;

      var openingHours = moment(this._selectedRoom.available_from, "X");
      var closingHours = moment(this._selectedRoom.available_to, "X");

      var workingTimeslots = (closingHours - openingHours) / this._selectedRoom.time_span / 60 / 1000;
      var bookingDetails = this._selectedRoom.bookings;

      var currentDate = moment(new Date(openingHours.toDate()));
      var timeslots = [];

      for (var index = 0; index < workingTimeslots; index++){
        var timeslotStartTime = new Date(currentDate.toDate());
        var timeslotEndTime = new Date(currentDate.add(this._selectedRoom.time_span, "m").toDate());

        var selectable = this._selectedRoom.bookings.every(function(element, index, array){
          var bookingStartTime = moment(element.from, "X");
          var bookingEndTime = moment(element.to, "X");

          //timeslot is selectable if it belongs to a current booking in editing form
          if (self._bookingDetails && self._bookingDetails.startDate &&
              timeslotStartTime.getTime() >= self._bookingDetails.startDate.getTime() &&
              timeslotEndTime.getTime() <= self._bookingDetails.endDate.getTime()) {
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

        timeslots.push({
          startTime: timeslotStartTime,
          endTime: timeslotEndTime,
          selected: false,
          selectable: selectable
        });
      }

      return timeslots;
    },
    /**
     * Selects time slots
     * @private
     */
    _selectTimeSlots : function() {
      //for booking editing, only set time on the date of the booking
      if (this._bookingDetails && this._bookingDetails.startDate) {
        //search duration is always the existing booking duration
        this._searchDuration = (this._bookingDetails.endDate.getTime() - this._bookingDetails.startDate.getTime()) / (60 * 1000);

        var bookingStartDateTest = new Date (this._bookingDetails.startDate);
        var _searchDateTest = new Date(this._searchDate);

        if (_searchDateTest.setHours(0,0,0,0) !== bookingStartDateTest.setHours(0,0,0,0))
          return;
      }

      var duration = parseInt(Math.min(this._selectedRoom.maxtime, this._searchDuration) / this._selectedRoom.time_span);
      var remainingDuration = duration;
      var _searchDate = this._searchDate;

      this._bookingTimeSlots.every(function(element, index) {
        if (element.selectable
            && ((_searchDate >= element.startTime && _searchDate < element.endTime) || remainingDuration < duration)) {
          element.selected = true;
          remainingDuration--;
        }

        // cannot break selection if there's an unavailable time slot
        return remainingDuration === duration
            || (remainingDuration > 0 && remainingDuration < duration && element.selectable);
      });
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
            machid: this._selectedRoom.id,
            scheduleid: this._selectedRoom.scheduleid,
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
     * Called when a booking was created by the API
     * @param e
     * @private
     */
    _createBookingComplete: function (e) {
      if (e.detail.response) {
        //display error returned by the server
        this.$.toast.text = "Error creating a booking: " + e.detail.responseText;
        this.$.toast.open();
      } else {
        //if booking is successful, fire event to indicate booking is done and move on to other page
        this.fire('uqlibrary-booking-booking-created');
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
      } else if (selectedTimeslots.length > this._selectedRoom.maxtime / this._selectedRoom.time_span) {
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