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
			}
		},
		ready: function () {
			var self = this;

			if (this.autoLoad){

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