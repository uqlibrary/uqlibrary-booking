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
      this.$.facilities.get();
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
            // Add room to general Rooms array
            var buildingImageName = room.building.replace(/\s/g, '_').replace(/\W/g, '').toLowerCase();
            var campusImageName = room.campus.replace(/\s/g, '_').replace(/\W/g, '').toLowerCase();

            roomList[room.id] = {
              id: room.id,
              scheduleid: room.scheduleid,
              title: room.title,
              campus: room.campus,
              building: room.building,
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
		 * Toggles the drawer panel of the main UQL app
		 * @private
		 */
		_toggleDrawerPanel: function () {
			this.fire('uqlibrary-toggle-drawer');
		}
	})
})();