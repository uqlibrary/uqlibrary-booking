/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
  Polymer({
    is: 'uqlibrary-booking-findroom',
    properties: {
      /**
       * Account
       */
      account: {
        type: Object,
        observer: '_accountChanged'
      },
      /**
       * List of all rooms for the selected search date
       */
      _roomList: {
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
        observer: 'searchDateChanged'
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
      selectedRoom: {
        type: Object,
        notify: true
      },
      /**
       * Holds the selected campus, building, rooms, etc
       */
      _selectedCampus: { type: Object, value: null },
      _selectedBuilding: { type: Object, value: null },
      _selectedRoom: { type: Object, value: null },
      _selectedDay: { type: Object, value: null },
      _selectedTime: { type: String },
      _selectedCapacity: { type: Number, observer: '_getSearchResults' },
      _buildingDropdown: { type: Array },
      _roomDropdown: { type: Array },
      _dayDropdown: {type: Array, value: [] },
      _timeDropdown: {type: Array, value: [] },
      _selectedDateIndex: { type: Number, value: 0 },
      _selectedTimeIndex: { type: Number, value: 0 },
      /**
       * Holds the selected campus index
       */
      _selectedCampusIndex: {
        type: Number,
        notify: true,
        observer: '_selectCampus'
      },
      /**
       * Holds the selected building index
       */
      _selectedBuildingIndex: {
        type: Number,
        notify: true,
        observer: '_selectBuilding'
      },
      /**
       * Holds the selected room index
       */
      _selectedRoomIndex: {
        type: Number,
        value: 0,
        notify: true,
        observer: '_selectRoom'
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    attached: function () {
      // Select dates and times
      this._generateDays();
      this._generateTimes();

      var self = this;
      this.$.facilities.addEventListener('uqlibrary-api-facilities-availability-loaded', function (e) {
        self._roomList = e.detail;
      });
    },
    activate: function () {
      // ?
    },
    _accountChanged: function () {
      if (this.account.id) {
        this._loadFacilities();
      }
    },
    /**
     * Loads facilities from the API
     * @private
     */
    _loadFacilities: function () {
      if (!this.searchDate || !this.account.id) return;

      var args = {
        date: moment(this.searchDate).format("DD-MM-YYYY"),
        nocache: true
      };

      if (this.account.type != 17 && this.account.type != 18) {
        args.id = this.account.id;
        args.ptype = this.account.type;
      }

      this.$.facilities.get(args);
    },
    /**
     * Takes the full room list and parses it for use in the Filter Form
     * @private
     */
    _buildRoomStructure: function () {
      var campuses = {};
      var self = this;

      _.forEach(this._roomList, function (room) {
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

      // Re-select the campus. Everything else will flow from there
      setTimeout(function () {
        if (self._selectedCampus) {
          var newCampusIndex = -1;
          // Find the same campus in the new results
          _.forEach(self._roomData, function (value, key) {
            if (value.id == self._selectedCampus.id) {
              newCampusIndex = key;
            }
          });

          if (newCampusIndex > -1) self._selectedCampusIndex = newCampusIndex;
        }
      }, 10);

      this._getSearchResults();
    },

    _tapped: function(event) {
      var dropdown = event.currentTarget;

      if (typeof(dropdown) !== 'undefined' && typeof(dropdown.contentElement.selectedItem) !== 'undefined') {
        dropdown.contentElement.selectedItem.addEventListener('tap', function() {
          dropdown.close();
        } );
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

      _.forEach(this._roomList, function (room) {
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
     * @param newVal
     * @private
     */
    _selectCampus: function (newVal) {
      if (newVal !== parseInt(newVal, 10)) return;

      var self = this;
      var oldCampus = this._selectedCampus;
      this._selectedCampus = this._roomData[newVal];

      if (!this._selectedCampus) return;
      if (oldCampus === this._selectedCampus) return;

      this._buildingDropdown = this._selectedCampus.buildings;

      if (oldCampus && this._selectedBuildingIndex != 0) {
        // Check if the same building exists in the new campus
        var newBuildingIndex = 0;
        _.forEach(this._buildingDropdown, function (val, key) {
          if (val.id == self._selectedBuilding.id) newBuildingIndex = key;
        });
        this._selectedBuildingIndex = newBuildingIndex;
      } else {
        this._selectedBuildingIndex = 0;
      }

      this._getSearchResults();
    },
    /**
     * Called when a building is selected
     * @param newVal
     * @private
     */
    _selectBuilding: function (newVal) {
      if (newVal == 0) {
        this._selectedBuilding = null;
        this._selectedRoomIndex = 0;
        this._getSearchResults();
        return;
      }

      var self = this;
      var oldBuilding = this._selectedBuilding;
      this._selectedBuilding = this._selectedCampus.buildings[newVal - 1];
      this._roomDropdown = this._selectedBuilding.rooms;

      if (oldBuilding && this._selectedRoomIndex != 0) {
        var newRoomIndex = 0;
        _.forEach(this._roomDropdown, function (val, key) {
          if (val.id == self._selectedRoom.id) newRoomIndex = key;
        });
        this._selectedRoomIndex = newRoomIndex;
      } else {
        this._selectedRoomIndex = 0;
      }

      this._getSearchResults();
    },
    /**
     * Called when a room is selected
     * @param newVal
     * @private
     */
    _selectRoom: function (newVal) {
      if (newVal == 0) {
        this._selectedRoom = null;
      } else {
        this._selectedRoom = this._selectedBuilding.rooms[newVal - 1];
      }

      this._getSearchResults();
    },
    /**
     * Called when the selected date has changed
     * @private
     */
    searchDateChanged: function (newVal, oldVal) {
      var self = this;
      
      _.forEach(self._dayDropdown, function (value, key) {
        if (moment(value.dateObj).format("YYYY-MM-DD") == moment(self.searchDate).format("YYYY-MM-DD")) {
          self._selectedDay = value;
          self._selectedDateIndex = key;
        }
      });

      if (typeof(oldVal) === 'undefined' || moment(oldVal).format("YYYY-MM-DD") !== moment(newVal).format("YYYY-MM-DD")) {
        this._loadFacilities();
      }
      this._getSearchResults();
    },
    /**
     * Called when the date has been selected
     * @param e
     * @private
     */
    _selectDate: function () {
      var date = this._dayDropdown[this._selectedDateIndex].dateObj;
      if (this._selectedTime) {
        date.setHours(this._selectedTime.hours);
        date.setMinutes(this._selectedTime.minutes);
        date.setSeconds(0);
      }
      this.searchDate = date;
    },
    /**
     * Called when a time has been selected
     * @param e
     * @private
     */
    _selectTime: function (e) {
      this._selectedTime = this._timeDropdown[this._selectedTimeIndex];

      // We need to force the date to change to make sure other pages pick up on the change
      var date = moment(this.searchDate).clone().toDate();
      date.setHours(this._selectedTime.hours);
      date.setMinutes(this._selectedTime.minutes);
      date.setSeconds(0);
      this.searchDate = date;
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
        this.fire('uqlibrary-booking-show-toast', 'No campus selected');
      } else if (this.searchResults.length == 0) {
        this.fire('uqlibrary-booking-show-toast', 'No rooms found');
      } else if (this._selectedRoom !== null) {
        this.selectedRoom = this._selectedRoom;
        this.fire('book-room');
      } else {
        this.fire("search");
      }
    }
  });
})();