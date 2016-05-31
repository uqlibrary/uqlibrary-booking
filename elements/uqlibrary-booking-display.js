(function () {
  Polymer({
    is: 'uqlibrary-booking-display',
    properties: {
      /**
       * The `bookingDetails` attribute object represents booking details, eg resid, start date, end date, etc
       */
      bookingDetails: {
        type: Object,
        notify: true,
        observer: 'bookingDetailsChanged'
      },
      /**
       * Holds the user account
       */
      account: {
        type: Object,
        notify: true
      },
      /**
       * The `roomDetails` attribute object contains properties of the room
       */
      _roomDetails: {
        type: Object,
        notify: true,
        value: {}
      },
      /**
       * Holds the location String
       */
      _location: {
        type: String,
        value: ""
      },
      /**
       * Holds the booking time string
       */
      _bookingTime: {
        type: String,
        value: ""
      },
      /**
       * Holds the URL string
       */
      _url: {
        type: String,
        value: ""
      },
      /**
       * Holds the background URL
       */
      _backgroundUrl: {
        type: String
      }
    },
    // force focus on the room title for accessibility
    activate: function () {
      this.$.roomTitle.focus();
      this.$.roomTitle.blur();
    },
    attached: function () {
      var self = this;

      this.addEventListener('delete-booking', this.toggleDeleteDialog);

      this.$.facilities.addEventListener('uqlibrary-api-facilities-availability-loaded', function (e) {
        self._roomDetails = e.detail[self.bookingDetails.machid];
        self._location = self._formatLocation();
        self._bookingDate = self._formatBookingDate();
        self._bookingTime = self._formatBookingTime();
        self._url = self._roomDetails.url + '}';
        self._backgroundUrl = 'background-image: url(\'https://app.library.uq.edu.au/assets/images/uq-buildings/' + self._roomDetails.imageLarge + '\')';
      });
    },
    /**
     * Loads facilities from the API
     * @private
     */
    _loadFacilities: function () {
      var args = {
        date: moment(this.bookingDetails.startDate).format("DD-MM-YYYY"),
        nocache: true
      };

      if (this.account.type != 17 && this.account.type != 18) {
        args.id = this.account.id;
        args.ptype = this.account.type;
      }

      this.$.facilities.get(args);
    },
    /**
     * Called when the selectedBooking is changed
     * @private
     */
    bookingDetailsChanged: function () {
      if (!this.bookingDetails || !this.bookingDetails.machid) return;
      this._loadFacilities();
    },
    /**
     * Formats the location string
     * @returns {string}
     */
    _formatLocation: function () {
      var location = [];
      if (typeof(this._roomDetails.location) !== 'undefined' && this._roomDetails.location)
        location.push(this._roomDetails.location);
      if (typeof(this._roomDetails.building) !== 'undefined' && this._roomDetails.building)
        location.push(this._roomDetails.building);
      if (typeof(this._roomDetails.campus) !== 'undefined' &&  this._roomDetails.campus)
        location.push(this._roomDetails.campus);
      return location.join(', ');
    },
    /**
     * Formats the booking time string
     * @returns {string}
     * @private
     */
    _formatBookingTime: function () {
      var startFormat = moment(this.bookingDetails.startDate).format('a') == moment(this.bookingDetails.endDate).format('a') ? 'h:mm' : 'h:mm a';
      return moment(this.bookingDetails.startDate).format(startFormat) + ' - ' + moment(this.bookingDetails.endDate).format('h:mm a');
    },
    /**
     * Formats the booking date string
     * @returns {*}
     * @private
     */
    _formatBookingDate: function () {
      return moment(this.bookingDetails.startDate).format('dddd MMMM D, YYYY');
    },
    /**
     * Opens / Closes the information dialog
     * @private
     */
    _toggleDeleteDialog: function () {
      this.$.infoDialog.toggle();
    },
    /**
     * Called when a booking is deleted
     * @param event
     * @private
     */
    _deleteBookingComplete: function (event) {
      if (event.detail.response) {
        //display error returned by the server
        this.fire('uqlibrary-booking-show-toast', 'Error deleting this booking: ' + event.detail.responseText)
      } else {
        this.fire('booking-deleted');
      }
    },
    _editBooking: function () {
      this.fire('edit-booking-started', this.bookingDetails);
    },
    /**
     * Deletes the given booking
     * @private
     */
    _deleteBooking: function () {
      this._toggleDeleteDialog();
      this.$.deleteBookingRequest.delete({
        booking: {
          resid: this.bookingDetails.id
        }
      });
    }
  });
}());
