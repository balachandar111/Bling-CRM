// 📁 src/pages/Login.jsx

import React,
{
  useState,
} from "react";

import API from "../services/api";

import {
  useNavigate,
} from "react-router-dom";

import {

  FaEnvelope,

  FaLock,

  FaChartLine,

} from "react-icons/fa";

import "./Login.css";

const Login = () => {

  const navigate =
    useNavigate();


  const [formData, setFormData] =
    useState({

      email: "",
      password: "",

    });


  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]:
        e.target.value,
    });
  };


  const handleSubmit =
async (e) => {

  e.preventDefault();

  try {

    const { data } =
      await API.post(
        "/auth/login",
        formData
      );


    localStorage.setItem(
      "token",
      data.token
    );


    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );


    localStorage.setItem(
      "role",
      data.role
    );


    // ================= REDIRECT =================

    if (data.role === "employee") {

      navigate(
        "/employee-profile"
      );

    } else {

      navigate("/");
    }

  } catch (error) {

    alert(
      error.response.data.message
    );
  }
};


  return (

    <div className="login-page">

      {/* LEFT */}

      <div className="login-left">

        <div className="overlay">

          <div className="branding">

         

  <img

    src="https://res.cloudinary.com/ds4i8pujs/image/upload/v1779705309/bling_tech_logo_white_lmsgoz.png"

    alt="logo"

    className="small-logo"
  />
       

            <p>
              Smart Customer Relationship
              Management Platform
            </p>

          </div>

        </div>

      </div>


      {/* RIGHT */}

      <div className="login-right">

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <h2>
            Welcome Back 👋
          </h2>

          <p>
            Login to continue managing
            your customers and sales.
          </p>


          {/* EMAIL */}

          <div className="input-box">

            <FaEnvelope
              className="input-icon"
            />

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              onChange={handleChange}
              required
            />

          </div>


          {/* PASSWORD */}

          <div className="input-box">

            <FaLock
              className="input-icon"
            />

            <input
              type="password"
              name="password"
              placeholder="Enter password"
              onChange={handleChange}
              required
            />

          </div>


          <button type="submit">

            Login

          </button>


          <div className="bottom-text">

            © 2026 Bling CRM

          </div>

        </form>

      </div>

    </div>
  );
};

export default Login;