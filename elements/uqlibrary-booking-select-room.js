/**
 * By Jan-Willem Wisgerhof <j.wisgerhof@uq.edu.au>
 */
(function () {
  Polymer({
    is: 'uqlibrary-booking-select-room',
    properties: {
      /**
       * Holds the events
       */
      searchResults: {
        type: Array,
        value: []
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    ready: function () {
      var self = this;
    }
  })
})();