/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
  Polymer({
    is: 'uqlibrary-booking-book-room',
    properties: {
      /**
       * The selected room
       */
      selectedRoom: {
        type: Object,
        notify: true
      },
      /**
       * Outside search date. Does not propagate automatically though the page
       */
      searchDate: {
        type: Date
      },
      /**
       * Internal search date. This date is ONLY set by .activate(). This sets the page in motion
       */
      _searchDate: {
        type: Date,
        notify: true,
        observer: '_loadFacilities'
      },
      /**
       * Set when the duration is changed
       */
      searchDuration: {
        type: Number,
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
      },
      /**
       * Holds the user account
       */
      account: {
        type: Object,
        notify: true
      },
      /**
       * Holds the booking details.
       */
      bookingDetails: {
        type: Object,
        value: null
      },
      /**
       * Holds the background URL for the selected room
       */
      _backgroundUrl: {
        type: String,
        value: ''
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    attached: function () {
      var self = this;

      this.$.facilities.addEventListener('uqlibrary-api-facilities-availability-loaded', function (e) {
        if (self.bookingDetails) {
          self.selectedRoom = e.detail[self.bookingDetails.machid];
        } else if (self.selectedRoom.id) {
          // Selected room should already be set
          self.selectedRoom = e.detail[self.selectedRoom.id];
        }

        self._maxBookingLength = (!self.selectedRoom ? 0 : self.selectedRoom.maxtime / self.selectedRoom.time_span);
        self._bookingTimeSlots = self._createTimeslots();
        self._maximumBookingDate = moment().add(7, "day").toDate();
        self._selectTimeSlots();
        self._backgroundUrl = 'background-image: url(\'https://app.library.uq.edu.au/assets/images/uq-buildings/' + self.selectedRoom.imageLarge + '\')';
      });
    },
    /**
     * Called when this element receives focus. Sets up the element either for editing or adding a booking
     */
    activate: function () {
      if (this.bookingDetails && this.bookingDetails.machid) {
        // Edit booking. Setting search date will trigger load facilities
        this._searchDate = moment(this.bookingDetails.startDate).toDate();
      } else {
        this._searchDate = moment(this.searchDate).clone().toDate();
      }
    },
    /**
     * Loads facilities from the API
     * @private
     */
    _loadFacilities: function () {
      if (!this.bookingDetails && !this.selectedRoom) return;

      var args = {
        date: moment(this._searchDate).format("DD-MM-YYYY"),
        nocache: true
      };

      if (this.account.type != 17 && this.account.type != 18) {
        args.id = this.account.id;
        args.ptype = this.account.type;
      }

      this.$.facilities.get(args);
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

      var openingHours = moment(this.selectedRoom.available_from, "X");
      var closingHours = moment(this.selectedRoom.available_to, "X");

      var workingTimeslots = (closingHours - openingHours) / this.selectedRoom.time_span / 60 / 1000;
      var bookingDetails = this.selectedRoom.bookings;

      var currentDate = moment(new Date(openingHours.toDate()));
      var timeslots = [];

      for (var index = 0; index < workingTimeslots; index++){
        var timeslotStartTime = new Date(currentDate.toDate());
        var timeslotEndTime = new Date(currentDate.add(this.selectedRoom.time_span, "m").toDate());

        var selectable = this.selectedRoom.bookings.every(function(element, index, array){
          var bookingStartTime = moment(element.from, "X");
          var bookingEndTime = moment(element.to, "X");

          // time slot is selectable if it belongs to a current booking in editing form
          if (self.bookingDetails && self.bookingDetails.startDate &&
              timeslotStartTime.getTime() >= self.bookingDetails.startDate.getTime() &&
              timeslotEndTime.getTime() <= self.bookingDetails.endDate.getTime()) {
            return true;
          }

          // time slot does not overlap with existing booking
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
      if (this.bookingDetails && this.bookingDetails.startDate) {
        //search duration is always the existing booking duration
        this.searchDuration = (this.bookingDetails.endDate.getTime() - this.bookingDetails.startDate.getTime()) / (60 * 1000);

        var bookingStartDateTest = new Date (this.bookingDetails.startDate);
        var _searchDateTest = new Date(this._searchDate);

        if (_searchDateTest.setHours(0,0,0,0) !== bookingStartDateTest.setHours(0,0,0,0))
          return;
      }

      var duration = parseInt(Math.min(this.selectedRoom.maxtime, this.searchDuration) / this.selectedRoom.time_span);
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
        this.fire('uqlibrary-booking-show-toast', validation.message);
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
     * Called when a booking was created by the API
     * @param e
     * @private
     */
    _createBookingComplete: function (e) {
      if (e.detail.response) {
        this.fire('uqlibrary-booking-show-toast', "Error creating a booking: " + e.detail.responseText);
      } else {
        //if booking is successful, fire event to indicate booking is done and move on to other page
        this.fire('booking-created');
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
      } else if (selectedTimeslots.length > this._maxBookingLength) {
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