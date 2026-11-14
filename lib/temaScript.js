export const TEMA_KEY = "quickfix_tema";

export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${TEMA_KEY}");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){document.documentElement.setAttribute("data-theme","dark")}`;
