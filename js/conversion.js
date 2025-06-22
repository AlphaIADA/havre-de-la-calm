document.addEventListener('DOMContentLoaded', function () {
  function triggerConversion() {
    if (typeof gtag === 'function') {
      gtag('event', 'conversion', {
        'send_to': 'GTM-5N4J57MT',
        'value': 1.0,
        'currency': 'NGN'
      });
    }
  }

  var bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', triggerConversion);
  }

  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', triggerConversion);
  }

  var appointmentForms = document.querySelectorAll('form.appointment-form');
  appointmentForms.forEach(function (form) {
    form.addEventListener('submit', triggerConversion);
  });
});
