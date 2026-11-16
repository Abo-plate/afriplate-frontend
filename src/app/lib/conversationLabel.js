export function conversationLabel(conversation) {
  if (conversation?.product_id) return 'Product: ' + (conversation.product_title || 'Listing') + ' (#' + conversation.product_id + ')';
  if (conversation?.service_id) return 'Service: ' + (conversation.service_title || 'Listing') + ' (#' + conversation.service_id + ')';
  return 'Direct conversation';
}
