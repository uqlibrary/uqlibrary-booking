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
       * Holds the latest search results
       */
      _searchResults: {
        type: Array,
        value: [],
        notify: true
      },
      /**
       * Holds the date currently being searched for
       */
      _searchDate: {
        type: Date,
        notify: true,
        observer: '_searchDateChanged'
      },
      /**
       * Search duration
       */
      _searchDuration: {
        type: Number,
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
       * Holds the currently selected room
       */
      _selectedRoom: {
        type: Object,
        value: {},
        notify: true
      },
      /**
       * Whether the Bookings api should fetch cached values
       */
      _bookingsUseCache: {
        type: Boolean,
        value: false,
        notify: true
      }
		},
    listeners: {
      'uqlibrary-booking-navigate': '_doTransition',
      'uqlibrary-booking-change-title': '_changeTitle'
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
      var that = this;

      if (e.detail.hasSession) {
        that._account = e.detail;
        var _args = {id: that._account.id, date: moment(this.searchDate).format('DD-MM-YYYY'), nocache: true };
        // FBS has special user group(LoansDeskStaff) for ptypes 17 and 18, so we must allow all rooms for these groups
        if(that._account.type != 17 && that._account.type != 18) {
          _args.ptype = that._account.type;
        }
        that.$.facilities.get(_args);
      } else {
        that.$.account.login(window.location.href);
      }
    },
    /**
     * Called when the search date changes
     * @private
     */
    _searchDateChanged: function (oldValue, newValue) {
      if (!newValue || oldValue.toString() == newValue.toString()) { return; }

      this.$.facilities.get({
        date: moment(this._searchDate).format('DD-MM-YYYY'),
        "id" : this._account.id,
        "ptype" : this._account.type,
        nocache : true
      });
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
      this._transitionToPage(this._selectedPage - 1);
    },
    /**
     * Called whenever a iron-select event is fired on neon-animated-pages
     * @param e
     * @private
     */
    _pageChanged: function (e) {
      if (e.detail.item.localName == "section") {
        e.detail.item.children[0].activate();
      }
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

      // Set selectedRoom again
      if (this._selectedRoom && this._selectedRoom.id) {
        this._selectedRoom = this._roomList[this._selectedRoom.id];
      }
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