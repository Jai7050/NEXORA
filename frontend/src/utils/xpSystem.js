const XP_STORAGE_KEY = "nexora_total_xp";

const notifyXPChange = (newXP) => {
  window.dispatchEvent(
    new CustomEvent("nexora-xp-updated", {
      detail: newXP,
    })
  );
};

export const getTotalXP = () => {
  const savedXP =
    localStorage.getItem(XP_STORAGE_KEY);

  return savedXP ? Number(savedXP) : 0;
};

export const addXP = (amount) => {
  const currentXP = getTotalXP();

  const newXP =
    currentXP + Number(amount);

  localStorage.setItem(
    XP_STORAGE_KEY,
    String(newXP)
  );

  notifyXPChange(newXP);

  return newXP;
};

export const removeXP = (amount) => {
  const currentXP = getTotalXP();

  const newXP = Math.max(
    0,
    currentXP - Number(amount)
  );

  localStorage.setItem(
    XP_STORAGE_KEY,
    String(newXP)
  );

  notifyXPChange(newXP);

  return newXP;
};

export const setTotalXP = (amount) => {
  const safeXP = Math.max(
    0,
    Number(amount)
  );

  localStorage.setItem(
    XP_STORAGE_KEY,
    String(safeXP)
  );

  notifyXPChange(safeXP);

  return safeXP;
};

export const resetXP = () => {
  localStorage.removeItem(
    XP_STORAGE_KEY
  );

  notifyXPChange(0);
};