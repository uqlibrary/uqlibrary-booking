/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
	Polymer({
		is: 'uqlibrary-booking',
		properties: {
			/**
			 * Required. Whether the app should start in standalone mode or not.
			 * @type Boolean
			 */
			standAlone: {
				type: Object,
				value: true
			},
      /**
       * @type Boolean
       */
      autoLoad: {
        type: Object,
        value: true
      },
      /**
       * Title used in the header
       */
      headerTitle: {
        type: String,
        value: "My bookings"
      },
      /**
       * Holds the complete room list for all booking pages
       */
      _roomList: {
        type: Object,
        value: {},
        notify: true
      },
			/**
			 * Holds the user account
			 */
			_account: {
				type: Object,
				value: {
					hasSession: false
				}
			},
			/**
			 * Holds the currently selected page index
			 */
			_selectedPage: {
				type: Number,
				value: 0
			},
      /**
       * Holds a reference to the current page object
       */
      _pageObject: {
        type: Object
      }
		},
    listeners: {
      'uqlibrary-booking-navigate': '_doTransition',
      'uqlibrary-booking-change-title': '_changeTitle',
      'uqlibrary-booking-update-rooms': '_fetchRooms'
    },
		ready: function () {
      var self = this;

      this.$.facilities.addEventListener('uqlibrary-api-facilities-availability-loaded', function (e) {
        self._facilitiesUpdated(e);
      });

      this.$.account.addEventListener('uqlibrary-api-account-loaded', function (e) {
        self._accountLoaded(e);
      });

      this.$.account.get();
		},
    /**
     * Called when the account was loaded
     * @param e
     * @private
     */
    _accountLoaded: function (e) {
      if (e.detail.hasSession) {
        this._account = e.detail;
        this._loadFacilities(true, new Date());
      } else {
        this.$.account.login(window.location.href);
      }
    },
    /**
     * Called whenever a child page wants a room list
     * @param e
     * @private
     */
    _fetchRooms: function (e) {
      this._loadFacilities(e.detail.nocache, e.detail.date);
    },
    /**
     * Loads facilities from the API
     * @param noCache
     * @private
     */
    _loadFacilities: function (noCache, date) {
      if (!this._account.hasSession) return;

      var args = {
        date: moment(date).format("DD-MM-YYYY"),
        nocache: noCache
      };

      if (this._account.type != 17 && this._account.type != 18) {
        args.id = this._account.id;
        args.ptype = this._account.type;
      }

      this.$.facilities.get(args);
    },
    /**
     * Changes the header title when an event is received from a child page
     * @param e
     * @private
     */
    _changeTitle: function (e) {
      this.headerTitle = e.detail;
    },
    /**
     * Called when a booking is created
     * @param e
     * @private
     */
    _bookingCreated: function(e) {
      this.$.ga.addEvent('bookingCreated');

      // add new booking details to events on timeline
      this._bookingsUseCache = false;

      // transition to timeline
      this._transitionToPage(0);

      //Show toast that event was deleted after the transition is done
      var that = this;
      setTimeout(function(){
        that.$.toast.text = "Your booking was saved.";
        that.$.toast.open();
      }, 2000, that);
    },
    /**
     * Transitions to the selected page
     * @param page
     * @private
     */
    _transitionToPage: function (page) {
      this._selectedPage = page;
    },
    /**
     * Moves to the given page number
     * @param e
     * @private
     */
		_doTransition: function (e) {
			this._transitionToPage(e.detail);
		},
    /**
     * Moves back one page
     */
    _goBack: function () {
      this._pageObject.back();
    },
    /**
     * Called whenever a iron-select event is fired on neon-animated-pages
     * @param e
     * @private
     */
    _pageChanged: function (e) {
      if (e.detail.item.localName == "section") {
        this._pageObject = e.detail.item.firstElementChild;

        // My bookings is a special case
        if (this._selectedPage == 0) {
          this.$.mybookings.initialize();
        }
      }
    },
    /**
     * Starts the Edit booking process
     * @param e
     * @private
     */
    _bookingEditingStarted: function (e) {
      this.$.bookroom.initialize(e.detail.startDate, this._roomList[e.detail.machid], null, e.detail);
      this._transitionToPage(3);
    },
    /**
     * Called when we should start booking a room (new booking)
     * @param e
     * @private
     */
    _bookRoom: function (e) {
      this.$.bookroom.initialize(e.detail.searchData.date, e.detail.room, e.detail.searchData.duration, null);
      this._transitionToPage(3);
    },
    /**
     * Called when the "add booking process" is started. Shows the search page
     * @param e
     * @private
     */
    _addBooking: function (e) {
      this.$.findroom.initialize(this._roomList);
      this._transitionToPage(1);
    },
    /**
     * Called when an existing booking is selected
     * @param e
     * @private
     */
    _selectBooking: function (e) {
      this.headerTitle = "Booking details";

      // Fetch room data for this date
      this._loadFacilities(false, e.detail.startDate);
      this.$.displaybooking.initialize(e.detail);
      this._transitionToPage(4);
    },
    /**
     * Called when the user presses "Search" on the Find Room page
     * @param e
     * @private
     */
    _searchRoom: function (e) {
      // searchData
      // searchResults
      this.$.selectroom.initialize(e.detail.searchData, e.detail.searchResults);
      this._transitionToPage(2);
    },
    /**
     * Called when the facilities are returned from the API. Creates a master "room list"
     * @param e
     * @private
     */
    _facilitiesUpdated: function (e) {
      var self = this;
      var roomList = {};

      _.forEach(e.detail, function (facility) {
        _.forEach(facility.resources, function (resource) {
          _.forEach(resource.facilities, function (room) {
            if (room.status == "u") { return; }
            // Add room to general Rooms array
            var buildingImageName = room.building.replace(/\s/g, '_').replace(/\W/g, '').toLowerCase();
            var campusImageName = room.campus.replace(/\s/g, '_').replace(/\W/g, '').toLowerCase();

            roomList[room.id] = {
              id: room.id,
              scheduleid: room.scheduleid,
              title: room.title,
              campus: self._fixCampusName(room),
              building: self._fixBuildingName(room),
              location: room.location,
              capacity: room.capacity,
              maxtime: room.maxtime,
              mintime: room.mintime,
              bookings: room.bookings,
              available_from: resource.schedule.available_from,
              available_to: resource.schedule.available_to,
              url: room.url,
              notes: room.notes,
              next_available_time: null,
              next_available_time_text: '',
              time_span: resource.schedule['time_span'],
              image : campusImageName + '/' + buildingImageName + '_thumb' + '.jpg',
              imageLarge : campusImageName + '/' + buildingImageName + '.jpg'
            };
          });
        });
      });

      this._roomList = roomList;
    },
    /**
     * Fixes bad data from the API
     */
    _fixCampusName: function (room) {
      var campusReplacements = {
        "ST LUCIA": "St Lucia"
      };

      if (campusReplacements[room.campus]) {
        return campusReplacements[room.campus];
      } else {
        return room.campus;
      }
    },
    /**
     * Fixes bad data from the API
     */
    _fixBuildingName: function (room) {
      var buildingReplacements = {
        "94": "Biological Sciences Library (#94)",
        "Hawken Building 50": "Hawken Building (#50)",
        "Hawken Bldg (#50)": "Hawken Building (#50)",
        "2, Duhig Tower": "Duhig Bldg (#2)",
        "Duhig North (12)": "Duhig North Bldg (#12)",
        "Duhig North 12": "Duhig North Bldg (#12)",
        "Duhig North": "Duhig North Bldg (#12)",
        "Duhig North12": "Duhig North Bldg (#12)",
        "Duhig Bldg (#12)": "Duhig North Bldg (#12)",
        "": "Duhig North Bldg (#12)"
      };

      if (buildingReplacements[room.building]) {
        return buildingReplacements[room.building];
      } else {
        return room.building;
      }
    },
		/**
		 * Toggles the drawer panel of the main UQL app
		 * @private
		 */
		_toggleDrawerPanel: function () {
			this.fire('uqlibrary-toggle-drawer');
		}
	})
})();