import api from './api';

// ─────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────
export const authAPI = {
  register:   (data)        => api.post('/auth/register', data),
  login:      (data)        => api.post('/auth/login', data),
  getProfile: ()            => api.get('/auth/profile'),
};

// ─────────────────────────────────────────────
//  PRODUCTS
// ─────────────────────────────────────────────
export const productsAPI = {
  getAll:   (params)        => api.get('/products', { params }),
  getOne:   (id)            => api.get(`/products/${id}`),
  create:   (data)          => api.post('/products', data),
  update:   (id, data)      => api.put(`/products/${id}`, data),
  delete:   (id)            => api.delete(`/products/${id}`),
};

// ─────────────────────────────────────────────
//  SERVICES
// ─────────────────────────────────────────────
export const servicesAPI = {
  getAll:   (params)        => api.get('/services', { params }),
  getOne:   (id)            => api.get(`/services/${id}`),
  create:   (data)          => api.post('/services', data),
  update:   (id, data)      => api.put(`/services/${id}`, data),
  delete:   (id)            => api.delete(`/services/${id}`),
};

// ─────────────────────────────────────────────
//  SEARCH (used for the homepage feed)
// ─────────────────────────────────────────────
export const searchAPI = {
  search:      (params)     => api.get('/search', { params }),
  suggestions: (q)          => api.get('/search/suggestions', { params: { q } }),
};

// ─────────────────────────────────────────────
//  ORDERS
// ─────────────────────────────────────────────
export const ordersAPI = {
  getMyOrders: ()           => api.get('/orders'),
  getOne:      (id)         => api.get(`/orders/${id}`),
  create:      (data)       => api.post('/orders', data),
  confirm:     (id)         => api.put(`/orders/${id}/confirm`),
};

// ─────────────────────────────────────────────
//  CART
// ─────────────────────────────────────────────
export const cartAPI = {
  get:    ()                => api.get('/cart'),
  add:    (data)            => api.post('/cart', data),
  update: (id, data)        => api.put(`/cart/${id}`, data),
  remove: (id)              => api.delete(`/cart/${id}`),
  clear:  ()                => api.delete('/cart'),
};

// ─────────────────────────────────────────────
//  REVIEWS
// ─────────────────────────────────────────────
export const reviewsAPI = {
  create:         (data)    => api.post('/reviews', data),
  getForListing:  (id)      => api.get(`/reviews/listing/${id}`),
  getForSeller:   (id)      => api.get(`/reviews/seller/${id}`),
};

// ─────────────────────────────────────────────
//  NOTIFICATIONS
// ─────────────────────────────────────────────
export const notificationsAPI = {
  getAll:      ()           => api.get('/notifications'),
  markRead:    (id)         => api.put(`/notifications/${id}/read`),
  markAllRead: ()           => api.put('/notifications/read-all'),
  delete:      (id)         => api.delete(`/notifications/${id}`),
};

// ─────────────────────────────────────────────
//  WALLET & PAYMENTS
// ─────────────────────────────────────────────
export const walletAPI = {
  get:          ()          => api.get('/wallet'),
  withdraw:     (data)      => api.post('/wallet/withdraw', data),
  transactions: ()          => api.get('/wallet/transactions'),
};

// ─────────────────────────────────────────────
//  MESSAGES
// ─────────────────────────────────────────────
export const messagesAPI = {
  getConversations: ()      => api.get('/messages'),
  getMessages:  (userId)    => api.get(`/messages/${userId}`),
  send:         (data)      => api.post('/messages', data),
};

// ─────────────────────────────────────────────
//  JOBS
// ─────────────────────────────────────────────
export const jobsAPI = {
  getAll:  (params)         => api.get('/jobs', { params }),
  getOne:  (id)             => api.get(`/jobs/${id}`),
  create:  (data)           => api.post('/jobs', data),
  update:  (id, data)       => api.put(`/jobs/${id}`, data),
  delete:  (id)             => api.delete(`/jobs/${id}`),
};

// ─────────────────────────────────────────────
//  BVN
// ─────────────────────────────────────────────
export const bvnAPI = {
  verify:  (data)           => api.post('/bvn/verify', data),
  status:  ()               => api.get('/bvn/status'),
};

// ─────────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────────
export const adminAPI = {
  getStats:          ()     => api.get('/admin/stats'),
  getUsers:          (p)    => api.get('/admin/users', { params: p }),
  banUser:           (id)   => api.put(`/admin/users/${id}/ban`),
  unbanUser:         (id)   => api.put(`/admin/users/${id}/unban`),
  suspendListing:    (id)   => api.put(`/admin/listings/${id}/suspend`),
  restoreListing:    (id)   => api.put(`/admin/listings/${id}/restore`),
  toggleReferrals:   (data) => api.put('/admin/referrals/toggle', data),
  getWithdrawals:    ()     => api.get('/admin/withdrawals'),
  processWithdrawal: (id)   => api.put(`/admin/withdrawals/${id}/process`),
  getBVNList:        (p)    => api.get('/bvn/admin/list', { params: p }),
  approveBVN:        (id)   => api.put(`/bvn/admin/${id}/approve`),
  rejectBVN:         (id)   => api.put(`/bvn/admin/${id}/reject`),
};