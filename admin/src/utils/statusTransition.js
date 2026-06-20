export const validTransitions = {
  DRAFT: ["TO_COOK"],
  TO_COOK: ["PREPARING"],
  PREPARING: ["COMPLETED"],
  COMPLETED: ["PAID"],
  PAID: []
};
