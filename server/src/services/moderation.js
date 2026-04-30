const ALLOWED_NEXT_STATUS = {
  draft: ["pending", "published", "rejected"],
  pending: ["published", "rejected", "draft"],
  published: ["draft", "rejected"],
  rejected: ["draft", "pending"],
};

export function canTransitionStatus(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false;
  return (ALLOWED_NEXT_STATUS[currentStatus] || []).includes(nextStatus);
}
