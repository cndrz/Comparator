export const $ = (id) => document.getElementById(id);

export const selectedValue = (name) =>
  document.querySelector(`input[name="${name}"]:checked`)?.value || "";
