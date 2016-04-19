/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
  Polymer({
    is: 'uqlibrary-booking-findroom',
    properties: {
      /**
       * Master list of rooms populated by uqlibrary-booking
       */
      roomList: {
        type: Array,
        value: [],
        observer: '_buildRoomStructure'
      },
      /**
       * Search data shared across booking applications
       */
      searchResults: {
        type: Object,
        value: {},
        notify: true
      },
      /**
       * Holds the currently selected date
       */
      searchDate: {
        type: Date,
        notify: true,
        observer: '_searchDateChanged'
      },
      /**
       * Duration
       */
      searchDuration: {
        type: Number,
        notify: true,
        observer: '_getSearchResults'
      },
      /**
       * Holds the structured room data
       */
      _roomData: {
        type: Array,
        value: []
      },
      /**
       * Holds the selected campus, building, rooms, etc
       */
      _selectedCampus: { type: Object, value: null },
      _selectedBuilding: { type: Object, value: null },
      _selectedRoom: { type: Object, value: null },
      _selectedDay: { type: Object, value: null },
      _selectedTime: { type: String, observer: '_getSearchResults' },
      _selectedCapacity: { type: Number, observer: '_getSearchResults' },
      _buildingDropdown: { type: Array },
      _roomDropdown: { type: Array },
      _dayDropdown: {type: Array, value: [] },
      _timeDropdown: {type: Array, value: [] },
      _selectedDateIndex: { type: Number, value: 0 },
      _selectedTimeIndex: { type: Number, value: 0 },
      _selectedCampusIndex: { type: Number, value: 0}
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    attached: function () {
      // Select dates and times
      this._generateDays();
      this._generateTimes();
    },
    /**
     * Called when this page is opened
     */
    activate: function () {
      this.fire('uqlibrary-booking-change-title', 'Find a room');
    },
    /**
     * Takes the full room list and parses it for use in the Filter Form
     * @private
     */
    _buildRoomStructure: function () {
      var campuses = {};
      _.forEach(this.roomList, function (room) {
        if (!campuses[room.campus]) {
          campuses[room.campus] = {
            id: room.campus,
            title: room.campus,
            buildings: {}
          }
        }

        // Add the building if required
        if (!campuses[room.campus].buildings[room.building]) {
          campuses[room.campus].buildings[room.building] = {
            id: room.building,
            title: room.building,
            rooms: []
          }
        }

        // Add the room to the selected campus + building
        campuses[room.campus].buildings[room.building].rooms.push({
          id: room.id,
          title: room.title,
          capacity: room.capacity,
          maxtime: room.maxtime,
          mintime: room.mintime
        });
      });

      // Convert all objects to arrays
      this._roomData = _.values(_.mapValues(campuses, function (campus) {
        campus.buildings = _.values(campus.buildings);
        return campus;
      }));

      this._reselectItems();
      this._getSearchResults();
    },
    /**
     * Re-selects all items after a data reload
     * @private
     */
    _reselectItems: function () {
      var self = this;

      if (this._selectedCampus) {
        _.forEach(this._roomData, function (value, key) {
          if (value.id === self._selectedCampus.id) {
            self._selectedCampusIndex = key;
          }
        });
      }
    },
    /**
     * Filters the room list based on the input of the user
     * @private
     */
    _getSearchResults: function () {
      if (this._dayDropdown && this._dayDropdown.length == 0) return;

      var self = this;
      var selectedDate = moment(this.searchDate);
      var roomsFound = [];

      _.forEach(this.roomList, function (room) {
        // Check for selected campus, building and room
        if (self._selectedRoom != null && self._selectedRoom.id != room.id) return;
        if (self._selectedBuilding != null && room.building != self._selectedBuilding.id) return;
        if (!self._selectedCampus || room.campus != self._selectedCampus.id) return;

        // Capacity check
        if (self._selectedCapacity > room.capacity) return;

        // Date and time check
        // Get the nearest "slot"
        var startTimestamp = self._roundTimestamp('down', moment().unix(), room.time_span);
        if (selectedDate.toDate() > new Date()) {
          startTimestamp = self._roundTimestamp('up', selectedDate.unix(), room.time_span);
        }
        room.nextAvailable = self._getNextAvailable(room, startTimestamp);
        if (room.nextAvailable === false) return;
        var _time = moment.unix(room.nextAvailable);
        room.nextAvailableTimeText = _time.format("h:mm a") + ' - ' + _time.add(self.searchDuration, 'minutes').format("h:mm a") + ', ' + _time.format("DD/MM/YYYY");

        // Add the room to the search results if we got this far
        roomsFound.push(room);
      });

      this.searchResults = _.sortBy(roomsFound, 'nextAvailable');
    },
    /**
     * Gets the next available time for a room
     * @param room
     * @param startTimestamp
     * @returns {*}
     * @private
     */
    _getNextAvailable: function (room, startTimestamp) {
      var self = this;

      // Build available time slots
      var slots = [];
      var time = room.available_from;

      _.forEach(room.bookings, function (booking) {
        if (time != booking.from) {
          slots.push({from: time, to: booking.from});
        }
        time = booking.to;
      });

      // Add time period after last booking (or since start if no bookings)
      if (time != room.available_to) {
        slots.push({from: time, to: room.available_to});
      }

      // Go through each slot and set the "firstAvailable" variable
      firstAvailable = 0;
      _.forEach(slots, function (slot) {
        if (firstAvailable !== 0) return;

        // Check end timestamp
        var end = startTimestamp + self.searchDuration * 60;
        if (slot.to < end) return;

        if (startTimestamp >= slot.from && end <= slot.to) {
          firstAvailable = startTimestamp;
        } else if (end <= slot.to && slot.to >= (slot.from + self.searchDuration * 60)) {
          firstAvailable = slot.from;
        }
      });

      return (firstAvailable == 0 ? false : firstAvailable);
    },
    /**
     * Generates 7 days ahead
     * @private
     */
    _generateDays: function () {
      var date = moment();
      var days = [{
        date: date.format("MM/DD/YYYY"),
        label: "Today",
        dateObj: date.clone().toDate()
      }];
      for (var i = 1; i < 7; i++) {
        date.add(1, "day");
        days.push({
          date: date.format("MM/DD/YYYY"),
          label: date.format("dddd, MMMM D"),
          dateObj: date.clone().toDate()
        });
      }
      this._dayDropdown = days;
    },
    /**
     * Generates all times in the current day, in 30 minute blocks
     * @private
     */
    _generateTimes: function () {
      var timeStart = moment().startOf('day');
      var times = [];
      var selected = false;

      for (var i = 0; i < 48; i++) {
        if (!selected && timeStart.isAfter(moment())) selected = i;

        times.push({
          label: timeStart.format("hh:mm A"),
          hours: timeStart.format("H"),
          minutes: timeStart.format("m")
        });
        timeStart.add(30, "m");
      }

      this._timeDropdown = times;
      this._selectedTimeIndex = selected;
    },
    /**
     * Called when a campus is selected
     * @private
     */
    _selectCampus: function (e) {
      var self = this;

      _.forEach(this._roomData, function (value) {
        if (value.id == e.detail.item.getAttribute('data-id')) {
          self._selectedCampus = value;
        }
      });

      this._buildingDropdown = this._selectedCampus.buildings;
      this._selectedBuilding = 0;
      this._selectedRoom = 0;

      this._getSearchResults();
    },
    /**
     * Called when a building is selected
     * @private
     */
    _selectBuilding: function (e) {
      var self = this;

      self._selectedBuilding = null; // Reset
      _.forEach(self._selectedCampus.buildings, function (value, key) {
        if (value.id == e.detail.item.getAttribute('data-id')) {
          self._selectedBuilding = value;
        }
      });

      this._selectedRoom = null;
      if (self._selectedBuilding !== null) {
        this._roomDropdown = self._selectedBuilding.rooms;
      } else {
        this._roomDropdown = [];
      }

      this._getSearchResults();
    },
    /**
     * Called when a room is selected
     * @param e
     * @private
     */
    _selectRoom: function (e) {
      var self = this;

      self._selectedRoom = null;
      _.forEach(self._selectedBuilding.rooms, function (value, key) {
        if (value.id == e.detail.item.getAttribute('data-id')) {
          self._selectedRoom = value;
        }
      });

      this._getSearchResults();
    },
    /**
     * Called when the selected date has changed
     * @private
     */
    _searchDateChanged: function () {
      var self = this;
      _.forEach(self._dayDropdown, function (value, key) {
        if (moment(value.dateObj).format("YYYY-MM-DD") == moment(self.searchDate).format("YYYY-MM-DD")) {
          self._selectedDay = value;
          self._selectedDateIndex = key;
        }
      });
      this._getSearchResults();
    },
    /**
     * Called when the date has been selected
     * @param e
     * @private
     */
    _selectDate: function (e) {
      this.searchDate = this._dayDropdown[this._selectedDateIndex].dateObj;
    },
    /**
     * Called when a time has been selected
     * @param e
     * @private
     */
    _selectTime: function (e) {
      this._selectedTime = this._timeDropdown[this._selectedTimeIndex];
      this.searchDate.setHours(this._selectedTime.hours);
      this.searchDate.setMinutes(this._selectedTime.minutes);
    },
    /**
     * Rounds a timestamp up or down
     * @param direction
     * @param timestamp
     * @param timeSpan
     * @returns {*}
     * @private
     */
    _roundTimestamp: function(direction, timestamp, timeSpan) {
      if(timestamp % (timeSpan * 60) == 0) {
        return timestamp;
      }
      if(direction == 'up') {
        return (timestamp - (timestamp % (timeSpan * 60))  + (timeSpan * 60) );
      }
      else {
        return (timestamp - (timestamp % (timeSpan * 60)));
      }
    },
    /**
     * Sends the user off to the "Select Room" page
     * @private
     */
    _search: function () {
      if (this._selectedCampus === null) {
        this.$.toast.text = "No campus selected";
        this.$.toast.open();
      } else if (this.searchResults.length == 0) {
        this.$.toast.text = "No rooms found";
        this.$.toast.open();
      } else {
        this.fire("uqlibrary-booking-navigate", 2);
      }
    }
  });
})();