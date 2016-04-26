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
       * Whether to show the back button
       */
      _backEnabled: {
        type: Boolean,
        value: false
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
				},
        notify: true
			},
			/**
			 * Holds the currently selected page index
			 */
			_selectedPage: {
				type: Number,
				value: 0
			}
		},
    listeners: {
      'uqlibrary-booking-navigate': '_doTransition',
      'uqlibrary-booking-update-header': '_updateHeader',
      'uqlibrary-booking-update-rooms': '_fetchRooms'
    },
		ready: function () {
      var self = this;

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
      } else {
        this.$.account.login(window.location.href);
      }
    },
    /**
     * Changes the header title and back button
     * @param e
     * @private
     */
    _updateHeader: function (e) {
      this.headerTitle = e.detail.title;
      this._backEnabled = e.detail.backEnabled;
    },
    /**
     * Called when a booking is created
     * @param e
     * @private
     */
    _bookingCreated: function(e) {
      this.$.ga.addEvent('bookingCreated');

      // transition to timeline
      this.$.mybookings.initialize(true);
      this._selectedPage = 0;

      //Show toast that event was created after the transition is done
      var self = this;
      setTimeout(function(){
        self.$.toast.text = "Your booking was saved.";
        self.$.toast.open();
      }, 500, self);
    },
    /**
     * Moves back one page
     */
    _goBack: function () {
      if (this._selectedPage == 0) {
        this.$.myBookings.back();
      } else {
        this.$.createBooking.back();
      }
    },
    /**
     * Called when we should start booking a room (new booking)
     * @param e
     * @private
     */
    _bookRoom: function (e) {
      this.$.bookroom.initialize(e.detail.searchData.date, e.detail.room, e.detail.searchData.duration, null);
      this._selectedPage = 3;
    },
    /**
     * Called when the "add booking process" is started. Shows the search page
     * @private
     */
    _addBooking: function () {
      this._selectedPage = 1;
      this.$.createBooking.activate();
    },
    /**
     * Navigates to the my bookings page
     * @private
     */
    _myBookings: function () {
      this._selectedPage = 0;
      this.$.myBookings.activate();
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