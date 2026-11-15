// Explicit listing location wins; never consult the browsing user's profile.
export function listingCampus(item = {}) {
  return [item.university, item.campus, item.seller_university, item.poster_university]
    .find(value => typeof value === 'string' && value.trim())?.trim() || '';
}
