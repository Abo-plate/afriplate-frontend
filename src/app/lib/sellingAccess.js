// Presentation only. The backend rechecks the current review for every write.
export function sellingAccess(user){const access=user?.selling_access;return access?.account_id===user?.id&&typeof access?.allowed==='boolean'?access:null;}
export function canUseSellerTools(user){const access=sellingAccess(user);if(!access?.allowed)return false;if(user.student_membership==='unconfirmed')return user.user_type==='seller'||user.role==='seller';return ['student','non_student'].includes(user.student_membership);}
