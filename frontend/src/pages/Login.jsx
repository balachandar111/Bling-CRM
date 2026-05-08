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


      // SAVE TOKEN
      localStorage.setItem(

        "token",

        data.token
      );


      // SAVE USER
      localStorage.setItem(

        "user",

        JSON.stringify(data.user)
      );


      navigate("/");

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

            <div className="logo-box">

              <FaChartLine />

            </div>

            <h1>
              Bling CRM
            </h1>

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