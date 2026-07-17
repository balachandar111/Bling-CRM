import axios from "axios";

const API = axios.create({

  baseURL:
    import.meta.env.VITE_API_URL,

});


// TOKEN

API.interceptors.request.use(
  (req) => {

    const token =
      localStorage.getItem("token");

    if (token) {

      req.headers.Authorization =
      `Bearer ${token}`;
    }

    return req;
  }
);


// ================= DEACTIVATION HANDLING =================
// If the backend reports the account has been deactivated (resignation
// approved), clear local storage and redirect to the login page.
API.interceptors.response.use(

  (res) => res,

  (error) => {

    const message =
      error?.response?.data?.message || "";

    if (
      error?.response?.status === 403 &&
      message.toLowerCase().includes("deactivated")
    ) {

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      if (window.location.pathname !== "/login") {

        alert(message);

        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;