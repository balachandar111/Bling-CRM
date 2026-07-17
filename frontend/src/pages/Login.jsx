import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
} from "react-icons/fa";
import "./Login.css";

const Login = () => {

  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (e) => {

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

      if (
        data.role === "employee"
      ) {

        navigate(
          "/employee-profile"
        );

      } else {

        navigate("/");
      }

    } catch (error) {

      alert(
        error?.response?.data
          ?.message ||
          "Login Failed"
      );

    }

  };

  return (

    <div className="login-page">
      

      <div className="login-card">
         

        <div className="logo-section">

          <img
            src="https://res.cloudinary.com/ds4i8pujs/image/upload/v1779687977/bling_tech_logo_h7rc1m.png"
            alt="logo"
            className="login-logo"
          />

        </div>

        <div className="login-header">

          <h2>
            Welcome Back
          </h2>

          <p>
            Sign in to access your CRM
            dashboard and manage
            customers efficiently.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >

          <div className="input-box">

            <FaEnvelope
              className="input-icon"
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              autoComplete="username"
              value={
                formData.email
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="input-box">

            <FaLock
              className="input-icon"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              value={
                formData.password
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <button
            type="submit"
            className="login-btn"
          >

            <FaSignInAlt />

            <span>
              Sign In
            </span>

          </button>

        </form>

        <div className="bottom-text">

          © 2026 Bling CRM

        </div>

      </div>

    </div>

  );

};

export default Login;