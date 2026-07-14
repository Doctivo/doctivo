const Razorpay = require('razorpay');

const rzp = new Razorpay({
  key_id: 'rzp_test_TDOuvBOpps8rpd',
  key_secret: 'Cxd6hIpEuh54UKGyf3UVscZC',
});

rzp.orders.create({
  amount: 100,
  currency: 'INR',
  receipt: 'test_123'
}).then(order => {
  console.log('Success:', order.id);
}).catch(err => {
  console.error('Error:', err);
});
