(function () {
  Polymer({
    is: 'uqlibrary-booking-display',
    properties: {
      authTokenValue: {
        notify: true
      },
      /**
       * Full room list given by uqlibrary-booking
       */
      roomList: {
        type: Object
      },
      /**
       * The `_bookingDetails` attribute object represents booking details, eg resid, start date, end date, etc
       */
      _bookingDetails: {
        type: Object,
        notify: true,
        value: {}
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
    ready: function () {
      this.addEventListener('delete-booking', this.toggleDeleteDialog);
    },
    /**
     * Called when this element is opened
     * @param bookingDetails
     */
    initialize: function (bookingDetails) {
      this._bookingDetails = bookingDetails;
      this._roomDetails = this.roomList[this._bookingDetails.machid];
      this._location = this._formatLocation();
      this._bookingTime = this._formatBookingTime();
      this._bookingDate = this._formatBookingDate();
      this._url = this._roomDetails.url + '}';
      this._backgroundUrl = 'background-image: url(\'https://app.library.uq.edu.au/assets/images/uq-buildings/' + this._roomDetails.imageLarge + '\')';
    },
    /**
     * Called when the back button is clicked
     */
    back: function () {
      this.fire('uqlibrary-booking-navigate', 0);
    },
    /**
     * Formats the location string
     * @returns {string}
     */
    _formatLocation: function () {
      var location = [];
      if (this._roomDetails.location)
        location.push(this._roomDetails.location);
      if (this._roomDetails.building)
        location.push(this._roomDetails.building);
      if (this._roomDetails.campus)
        location.push(this._roomDetails.campus);
      return location.join(', ');
    },
    /**
     * Formats the booking time string
     * @returns {string}
     * @private
     */
    _formatBookingTime: function () {
      var startFormat = moment(this._bookingDetails.startDate).format('a') == moment(this._bookingDetails.endDate).format('a') ? 'h:mm' : 'h:mm a';
      return moment(this._bookingDetails.startDate).format(startFormat) + ' - ' + moment(this._bookingDetails.endDate).format('h:mm a');
    },
    /**
     * Formats the booking date string
     * @returns {*}
     * @private
     */
    _formatBookingDate: function () {
      return moment(this._bookingDetails.startDate).format('dddd MMMM D, YYYY');
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
        this.$.toast.message = 'Error deleting this booking: ' + event.detail.responseText;
        this.$.toast.show();
      } else {
        // if booking delete is successful, fire event to indicate booking delete is done and move on to other page
        this.fire('booking-deleted');
      }
    },
    _editBooking: function () {
      this.fire('edit-booking-started', this._bookingDetails);
    },
    /**
     * Deletes the given booking
     * @private
     */
    _deleteBooking: function () {
      this._toggleDeleteDialog();
      this.$.deleteBookingRequest.delete({
        booking: {
          resid: this._bookingDetails.id
        }
      });
    }
  });
}());