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
        value: [],
        observer: 'sChanged'
      }
    },
    behaviors: [
      Polymer.NeonSharedElementAnimatableBehavior
    ],
    ready: function () {
      var self = this;
    },
    sChanged: function () {
      console.log(this.searchResults);
    }
  })
})();